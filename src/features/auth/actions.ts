"use server";

import { headers } from "next/headers";
import { redirect, unstable_rethrow } from "next/navigation";
import { type ActionResult, ok } from "@/lib/action-result";
import {
  clearLoginFlowCookie,
  readLoginFlowCookie,
  setLoginFlowCookie,
  type LoginFlowState,
} from "@/server/zitadel/cookies";
import {
  getAppOrigin,
  getWebAuthnDomain,
  isCustomLoginEnabled,
} from "@/server/zitadel/config";
import {
  AUTH_ERROR_MESSAGES,
  codeErrorMessage,
  credentialsErrorMessage,
  logZitadelError,
  registrationErrorMessage,
} from "@/server/zitadel/errors";
import { availableMfaMethods, nextLoginStep, type MfaMethod } from "@/server/zitadel/mfa";
import {
  checkRateLimit,
  isAllowedCallbackUrl,
  RATE_LIMITS,
} from "@/server/zitadel/security";
import { finalizeAuthRequest, getAuthRequest } from "@/server/zitadel/auth-request";
import { createSession, getSession, updateSession } from "@/server/zitadel/session";
import {
  getLoginSettings,
  getPasswordComplexitySettings,
  describePasswordPolicy,
  passwordMeetsPolicy,
} from "@/server/zitadel/settings";
import {
  findUserIdByEmail,
  listAuthenticationMethods,
  registerHumanUser,
  requestPasswordReset,
  resendEmailCode,
  setPasswordWithCode,
  verifyEmail,
} from "@/server/zitadel/users";
import {
  credentialsSchema,
  forgotPasswordSchema,
  mfaCodeSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from "./schema";

/**
 * Server actions della login UI custom. Il browser parla solo con queste
 * action; ogni chiamata alle API ZITADEL parte dal server con il PAT del
 * login client. Contratto: mai eccezioni verso il client — o un redirect
 * (percorso felice) o un ActionResult con messaggio sicuro.
 */

async function clientKey(scope: string, identifier?: string): Promise<string> {
  const headerStore = await headers();
  const forwardedFor = headerStore.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() || "local";
  return `${scope}:${ip}${identifier ? `:${identifier}` : ""}`;
}

function firstIssue(error: unknown): string | null {
  if (error && typeof error === "object" && "issues" in error) {
    const issues = (error as { issues: Array<{ message?: string }> }).issues;
    return issues[0]?.message ?? null;
  }
  return null;
}

/**
 * Sessione ZITADEL completa (tutti i fattori verificati): conclude il login.
 *
 * - Se il flusso era partito da una auth request OIDC già aperta
 *   (pendingRequestId, es. arrivo da Login V2), la finalizza subito.
 * - Altrimenti avvia ora l'handshake OIDC via Auth.js (/api/login/start):
 *   ZITADEL ritorna su /api/login con una nuova auth request, che viene
 *   finalizzata automaticamente con la sessione già autenticata. Solo
 *   redirect 302: nessuna UI ZITADEL.
 *
 * Termina sempre con un redirect.
 */
async function completeLogin(flow: LoginFlowState): Promise<never> {
  if (!flow.pendingRequestId) {
    redirect(
      `/api/login/start?${new URLSearchParams({ callbackUrl: flow.redirectTo }).toString()}`
    );
  }

  let callbackUrl: string;
  let allowedOrigins: string[];
  try {
    const authRequest = await getAuthRequest(flow.pendingRequestId);
    allowedOrigins = [
      getAppOrigin(),
      ...(authRequest.redirectUri ? [authRequest.redirectUri] : []),
    ];
    callbackUrl = await finalizeAuthRequest(flow.pendingRequestId, {
      sessionId: flow.sessionId,
      sessionToken: flow.sessionToken,
    });
  } catch (error) {
    logZitadelError("finalizeAuthRequest", error);
    await clearLoginFlowCookie();
    redirect("/sign-in?error=flow");
  }
  await clearLoginFlowCookie();
  if (!isAllowedCallbackUrl(callbackUrl, allowedOrigins)) {
    // La callback deve tornare al client OIDC registrato: tutto il resto è anomalo.
    console.error("[auth] callbackUrl non consentita, redirect rifiutato");
    redirect("/sign-in?error=flow");
  }
  redirect(callbackUrl);
}

export type PasswordLoginState = { error: string } | null;

/** Step 1: verifica email+password tramite la Session API di ZITADEL. */
export async function submitPasswordLogin(
  _previous: PasswordLoginState,
  formData: FormData
): Promise<PasswordLoginState> {
  if (!isCustomLoginEnabled()) return { error: AUTH_ERROR_MESSAGES.generic };

  const parsed = credentialsSchema.safeParse({
    authRequest: formData.get("authRequest") ?? "",
    email: formData.get("email"),
    password: formData.get("password"),
    redirectTo: formData.get("redirectTo") ?? undefined,
  });
  if (!parsed.success) {
    return { error: firstIssue(parsed.error) ?? AUTH_ERROR_MESSAGES.invalidCredentials };
  }
  const { authRequest, email, password, redirectTo } = parsed.data;

  if (!checkRateLimit(await clientKey("login", email), RATE_LIMITS.credentials)) {
    return { error: AUTH_ERROR_MESSAGES.rateLimited };
  }

  let flow: LoginFlowState;
  let mfaRequired = false;
  let mfaAvailable: readonly MfaMethod[] = [];
  try {
    const created = await createSession({ loginName: email });
    const updated = await updateSession(created.sessionId, {
      checks: { password: { password } },
    });
    const factors = await getSession(created.sessionId, updated.sessionToken);
    const userId = factors.user?.id ?? "";
    const [authMethods, loginSettings] = await Promise.all([
      listAuthenticationMethods(userId, getWebAuthnDomain()),
      getLoginSettings(factors.user?.organizationId),
    ]);
    const step = nextLoginStep({ factors, authMethods, loginSettings });
    if (step.kind === "mfa") {
      mfaRequired = true;
      mfaAvailable = step.methods;
    }
    flow = {
      sessionId: created.sessionId,
      sessionToken: updated.sessionToken,
      userId,
      loginName: factors.user?.loginName ?? email,
      redirectTo,
      pendingRequestId: authRequest,
      completed: step.kind === "done",
      issuedAt: Date.now(),
    };
  } catch (error) {
    unstable_rethrow(error);
    logZitadelError("password login", error);
    return { error: credentialsErrorMessage(error) };
  }

  if (mfaRequired && mfaAvailable.length === 0) {
    return {
      error:
        "La tua organizzazione richiede l'autenticazione a due fattori, ma non ne hai ancora configurata una. Contatta un amministratore.",
    };
  }

  await setLoginFlowCookie(flow);
  if (mfaRequired) redirect("/mfa");
  await completeLogin(flow);
  return null; // irraggiungibile: completeLogin termina con redirect
}

/** Metodi MFA disponibili per il flusso corrente (per la pagina /mfa). */
export async function getMfaContext(): Promise<
  ActionResult<{ methods: readonly MfaMethod[]; loginName: string }>
> {
  const flow = await readLoginFlowCookie();
  if (!flow) return { ok: false, error: AUTH_ERROR_MESSAGES.flowExpired };
  try {
    const authMethods = await listAuthenticationMethods(flow.userId, getWebAuthnDomain());
    return ok({ methods: availableMfaMethods(authMethods), loginName: flow.loginName });
  } catch (error) {
    logZitadelError("getMfaContext", error);
    return { ok: false, error: AUTH_ERROR_MESSAGES.generic };
  }
}

/** Invia il codice OTP via email o SMS (challenge sulla sessione). */
export async function sendOtpChallenge(
  method: "otpEmail" | "otpSms"
): Promise<ActionResult<undefined>> {
  const flow = await readLoginFlowCookie();
  if (!flow) return { ok: false, error: AUTH_ERROR_MESSAGES.flowExpired };
  if (!checkRateLimit(await clientKey("otp-send", flow.userId), RATE_LIMITS.email)) {
    return { ok: false, error: AUTH_ERROR_MESSAGES.rateLimited };
  }
  try {
    const updated = await updateSession(flow.sessionId, {
      challenges:
        method === "otpEmail"
          ? { otpEmail: { sendCode: {} } }
          : { otpSms: { returnCode: false } },
    });
    await setLoginFlowCookie({ ...flow, sessionToken: updated.sessionToken });
    return ok(undefined);
  } catch (error) {
    logZitadelError("sendOtpChallenge", error);
    return { ok: false, error: AUTH_ERROR_MESSAGES.generic };
  }
}

export type MfaVerifyState = { error: string } | null;

/** Verifica il secondo fattore (TOTP o codice OTP) e finalizza il login. */
export async function submitMfaCode(
  _previous: MfaVerifyState,
  formData: FormData
): Promise<MfaVerifyState> {
  const flow = await readLoginFlowCookie();
  if (!flow) return { error: AUTH_ERROR_MESSAGES.flowExpired };

  const parsed = mfaCodeSchema.safeParse({
    method: formData.get("method"),
    code: formData.get("code"),
  });
  if (!parsed.success) {
    return { error: firstIssue(parsed.error) ?? AUTH_ERROR_MESSAGES.invalidCode };
  }
  if (!checkRateLimit(await clientKey("mfa", flow.userId), RATE_LIMITS.credentials)) {
    return { error: AUTH_ERROR_MESSAGES.rateLimited };
  }

  let nextFlow: LoginFlowState;
  try {
    const { method, code } = parsed.data;
    const checks =
      method === "totp"
        ? { totp: { code } }
        : method === "otpEmail"
          ? { otpEmail: { code } }
          : { otpSms: { code } };
    const updated = await updateSession(flow.sessionId, { checks });
    nextFlow = { ...flow, sessionToken: updated.sessionToken, completed: true };
  } catch (error) {
    unstable_rethrow(error);
    logZitadelError("submitMfaCode", error);
    return { error: codeErrorMessage(error) };
  }

  await setLoginFlowCookie(nextFlow);
  await completeLogin(nextFlow);
  return null;
}

/** Richiede la challenge WebAuthn (passkey/U2F) per il flusso corrente. */
export async function startWebAuthnChallenge(): Promise<
  ActionResult<{ publicKeyCredentialRequestOptions: Record<string, unknown> }>
> {
  const flow = await readLoginFlowCookie();
  if (!flow) return { ok: false, error: AUTH_ERROR_MESSAGES.flowExpired };
  try {
    const updated = await updateSession(flow.sessionId, {
      challenges: {
        webAuthN: {
          domain: getWebAuthnDomain(),
          userVerificationRequirement: "USER_VERIFICATION_REQUIREMENT_DISCOURAGED",
        },
      },
    });
    await setLoginFlowCookie({ ...flow, sessionToken: updated.sessionToken });
    const options = updated.challenges?.webAuthN?.publicKeyCredentialRequestOptions;
    if (!options) return { ok: false, error: AUTH_ERROR_MESSAGES.generic };
    return ok({ publicKeyCredentialRequestOptions: options });
  } catch (error) {
    logZitadelError("startWebAuthnChallenge", error);
    return { ok: false, error: AUTH_ERROR_MESSAGES.generic };
  }
}

/** Verifica l'assertion WebAuthn del browser e finalizza il login. */
export async function submitWebAuthnAssertion(
  assertionJson: string
): Promise<ActionResult<undefined>> {
  const flow = await readLoginFlowCookie();
  if (!flow) return { ok: false, error: AUTH_ERROR_MESSAGES.flowExpired };
  if (typeof assertionJson !== "string" || assertionJson.length > 50_000) {
    return { ok: false, error: AUTH_ERROR_MESSAGES.generic };
  }

  let credentialAssertionData: Record<string, unknown>;
  try {
    credentialAssertionData = JSON.parse(assertionJson) as Record<string, unknown>;
  } catch {
    return { ok: false, error: AUTH_ERROR_MESSAGES.generic };
  }

  let nextFlow: LoginFlowState;
  try {
    const updated = await updateSession(flow.sessionId, {
      checks: { webAuthN: { credentialAssertionData } },
    });
    nextFlow = { ...flow, sessionToken: updated.sessionToken, completed: true };
  } catch (error) {
    unstable_rethrow(error);
    logZitadelError("submitWebAuthnAssertion", error);
    return { ok: false, error: codeErrorMessage(error) };
  }

  await setLoginFlowCookie(nextFlow);
  await completeLogin(nextFlow);
  return ok(undefined);
}

export type RegisterState = { error: string } | null;

/** Registrazione: crea l'utente su ZITADEL e completa il login OIDC. */
export async function submitRegistration(
  _previous: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  if (!isCustomLoginEnabled()) return { error: AUTH_ERROR_MESSAGES.generic };

  const parsed = registerSchema.safeParse({
    authRequest: formData.get("authRequest") ?? "",
    givenName: formData.get("givenName"),
    familyName: formData.get("familyName"),
    email: formData.get("email"),
    password: formData.get("password"),
    passwordConfirm: formData.get("passwordConfirm"),
    termsAccepted: formData.get("termsAccepted") === "accepted" ? true : undefined,
  });
  if (!parsed.success) {
    return { error: firstIssue(parsed.error) ?? AUTH_ERROR_MESSAGES.generic };
  }
  const input = parsed.data;

  if (!checkRateLimit(await clientKey("register"), RATE_LIMITS.register)) {
    return { error: AUTH_ERROR_MESSAGES.rateLimited };
  }

  try {
    const policy = await getPasswordComplexitySettings();
    if (!passwordMeetsPolicy(input.password, policy)) {
      return { error: describePasswordPolicy(policy) };
    }
  } catch (error) {
    logZitadelError("password policy", error);
  }

  let flow: LoginFlowState;
  let newUserId: string;
  try {
    const { userId } = await registerHumanUser({
      givenName: input.givenName,
      familyName: input.familyName,
      email: input.email,
      password: input.password,
    });
    newUserId = userId;
    const created = await createSession({ userId });
    const updated = await updateSession(created.sessionId, {
      checks: { password: { password: input.password } },
    });
    flow = {
      sessionId: created.sessionId,
      sessionToken: updated.sessionToken,
      userId,
      loginName: input.email,
      redirectTo: "/onboarding",
      pendingRequestId: input.authRequest,
      completed: true,
      issuedAt: Date.now(),
    };
  } catch (error) {
    unstable_rethrow(error);
    logZitadelError("registration", error);
    return { error: registrationErrorMessage(error) };
  }

  // Prima di entrare nell'app l'utente conferma l'email incollando il
  // codice ricevuto; il flusso di login (già completo) resta nel cookie e
  // viene finalizzato dalla pagina di verifica.
  await setLoginFlowCookie(flow);
  redirect(`/verify-email?userId=${encodeURIComponent(newUserId)}`);
}

export type ForgotPasswordState = { done: true } | { error: string } | null;

/**
 * Richiesta di reset password. Risposta volutamente identica sia che
 * l'email esista sia che non esista (niente enumerazione utenti).
 */
export async function submitForgotPassword(
  _previous: ForgotPasswordState,
  formData: FormData
): Promise<ForgotPasswordState> {
  if (!isCustomLoginEnabled()) return { error: AUTH_ERROR_MESSAGES.generic };

  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: firstIssue(parsed.error) ?? AUTH_ERROR_MESSAGES.generic };
  }
  const { email } = parsed.data;

  if (!checkRateLimit(await clientKey("reset", email), RATE_LIMITS.email)) {
    return { error: AUTH_ERROR_MESSAGES.rateLimited };
  }

  const startedAt = Date.now();
  try {
    const userId = await findUserIdByEmail(email);
    if (userId) await requestPasswordReset(userId);
  } catch (error) {
    // Nessun dettaglio all'utente: la risposta resta identica.
    logZitadelError("forgot password", error);
  }
  // Riduce il canale laterale temporale tra lookup senza risultato e
  // lookup seguito dall'invio email. Il rate limit contiene il costo.
  const remainingDelay = 750 - (Date.now() - startedAt);
  if (remainingDelay > 0) {
    await new Promise((resolve) => setTimeout(resolve, remainingDelay));
  }
  return { done: true };
}

export type ResetPasswordState = { done: true } | { error: string } | null;

/** Imposta la nuova password verificando il codice ricevuto via email. */
export async function submitResetPassword(
  _previous: ResetPasswordState,
  formData: FormData
): Promise<ResetPasswordState> {
  if (!isCustomLoginEnabled()) return { error: AUTH_ERROR_MESSAGES.generic };

  const parsed = resetPasswordSchema.safeParse({
    userId: formData.get("userId"),
    code: formData.get("code"),
    password: formData.get("password"),
    passwordConfirm: formData.get("passwordConfirm"),
  });
  if (!parsed.success) {
    return { error: firstIssue(parsed.error) ?? AUTH_ERROR_MESSAGES.generic };
  }
  const input = parsed.data;

  if (!checkRateLimit(await clientKey("reset-confirm", input.userId), RATE_LIMITS.credentials)) {
    return { error: AUTH_ERROR_MESSAGES.rateLimited };
  }

  try {
    const policy = await getPasswordComplexitySettings();
    if (!passwordMeetsPolicy(input.password, policy)) {
      return { error: describePasswordPolicy(policy) };
    }
    await setPasswordWithCode(input.userId, input.password, input.code);
    return { done: true };
  } catch (error) {
    logZitadelError("reset password", error);
    return { error: codeErrorMessage(error) };
  }
}

export type VerifyEmailState = { done: true } | { error: string } | null;

/** Conferma l'email con il codice ricevuto (link dalla mail ZITADEL). */
export async function submitVerifyEmail(
  _previous: VerifyEmailState,
  formData: FormData
): Promise<VerifyEmailState> {
  if (!isCustomLoginEnabled()) return { error: AUTH_ERROR_MESSAGES.generic };

  const parsed = verifyEmailSchema.safeParse({
    userId: formData.get("userId"),
    code: formData.get("code"),
  });
  if (!parsed.success) {
    return { error: firstIssue(parsed.error) ?? AUTH_ERROR_MESSAGES.generic };
  }

  if (!checkRateLimit(await clientKey("verify-email", parsed.data.userId), RATE_LIMITS.credentials)) {
    return { error: AUTH_ERROR_MESSAGES.rateLimited };
  }

  try {
    await verifyEmail(parsed.data.userId, parsed.data.code);
  } catch (error) {
    logZitadelError("verify email", error);
    return { error: codeErrorMessage(error) };
  }

  // Registrazione appena conclusa: il flusso di login è già autenticato
  // nel cookie → prosegue con l'handshake OIDC fino all'onboarding.
  const flow = await readLoginFlowCookie();
  if (flow?.completed && flow.userId === parsed.data.userId) {
    await completeLogin(flow);
  }
  return { done: true };
}

/** Reinvia l'email di verifica (dalla pagina /verify-email). */
export async function resendVerificationEmail(
  userId: string
): Promise<ActionResult<undefined>> {
  if (!isCustomLoginEnabled()) return { ok: false, error: AUTH_ERROR_MESSAGES.generic };
  if (typeof userId !== "string" || !userId || userId.length > 64) {
    return { ok: false, error: AUTH_ERROR_MESSAGES.generic };
  }
  const flow = await readLoginFlowCookie();
  if (!flow || flow.userId !== userId) {
    return { ok: false, error: AUTH_ERROR_MESSAGES.generic };
  }
  if (!checkRateLimit(await clientKey("verify-resend", userId), RATE_LIMITS.email)) {
    return { ok: false, error: AUTH_ERROR_MESSAGES.rateLimited };
  }
  try {
    await resendEmailCode(userId);
    return ok(undefined);
  } catch (error) {
    logZitadelError("resend verification", error);
    return { ok: false, error: AUTH_ERROR_MESSAGES.generic };
  }
}

/** Annulla il flusso di login in corso (torna al sign-in). */
export async function abandonLoginFlow(): Promise<void> {
  await clearLoginFlowCookie();
  redirect("/sign-in");
}
