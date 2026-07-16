import "server-only";
import { zitadelFetch } from "./client";

/**
 * Session Service v2 — autenticazione dell'utente nella login UI custom.
 * Riferimenti:
 * - https://zitadel.com/docs/apis/resources/session_service_v2/session-service-create-session
 * - https://zitadel.com/docs/apis/resources/session_service_v2/session-service-set-session
 * - https://zitadel.com/docs/guides/integrate/login-ui/username-password
 * - https://zitadel.com/docs/guides/integrate/login-ui/mfa
 * - https://zitadel.com/docs/guides/integrate/login-ui/passkey
 */

/** Durata della sessione ZITADEL creata dal login (Duration protobuf). */
const SESSION_LIFETIME = "18000s"; // 5 ore

export type SessionFactors = Readonly<{
  user?: {
    verifiedAt?: string;
    id?: string;
    loginName?: string;
    displayName?: string;
    organizationId?: string;
  };
  password?: { verifiedAt?: string };
  webAuthN?: { verifiedAt?: string; userVerified?: boolean };
  totp?: { verifiedAt?: string };
  otpSms?: { verifiedAt?: string };
  otpEmail?: { verifiedAt?: string };
  intent?: { verifiedAt?: string };
}>;

export type SessionChallenges = Readonly<{
  webAuthN?: { publicKeyCredentialRequestOptions?: Record<string, unknown> };
  otpSms?: string;
  otpEmail?: string;
}>;

type CreateSessionResponse = Readonly<{
  sessionId: string;
  sessionToken: string;
  challenges?: SessionChallenges;
}>;

type UpdateSessionResponse = Readonly<{
  sessionToken: string;
  challenges?: SessionChallenges;
}>;

type GetSessionResponse = Readonly<{
  session?: {
    id?: string;
    factors?: SessionFactors;
    expirationDate?: string;
  };
}>;

export type SessionChecks = Readonly<{
  user?: { loginName: string } | { userId: string };
  password?: { password: string };
  totp?: { code: string };
  otpSms?: { code: string };
  otpEmail?: { code: string };
  webAuthN?: { credentialAssertionData: Record<string, unknown> };
}>;

export type SessionChallengeRequest = Readonly<{
  /** sendCode: {} fa inviare l'email a ZITADEL; returnCode è solo per test. */
  otpEmail?: { sendCode: Record<string, never> };
  otpSms?: { returnCode: boolean };
  webAuthN?: {
    domain: string;
    userVerificationRequirement:
      | "USER_VERIFICATION_REQUIREMENT_REQUIRED"
      | "USER_VERIFICATION_REQUIREMENT_PREFERRED"
      | "USER_VERIFICATION_REQUIREMENT_DISCOURAGED";
  };
}>;

/** Crea la sessione identificando l'utente (mai col browser, solo server). */
export async function createSession(
  user: { loginName: string } | { userId: string }
): Promise<CreateSessionResponse> {
  return zitadelFetch<CreateSessionResponse>({
    method: "POST",
    path: "/v2/sessions",
    body: { checks: { user }, lifetime: SESSION_LIFETIME },
  });
}

/**
 * Aggiunge check e/o challenge alla sessione. Ogni chiamata riuscita
 * restituisce un NUOVO sessionToken: va sempre conservato l'ultimo.
 */
export async function updateSession(
  sessionId: string,
  input: { checks?: SessionChecks; challenges?: SessionChallengeRequest }
): Promise<UpdateSessionResponse> {
  return zitadelFetch<UpdateSessionResponse>({
    method: "PATCH",
    path: `/v2/sessions/${encodeURIComponent(sessionId)}`,
    body: input,
  });
}

/** Legge i fattori verificati della sessione. */
export async function getSession(
  sessionId: string,
  sessionToken?: string
): Promise<SessionFactors> {
  const query = new URLSearchParams();
  if (sessionToken) query.set("sessionToken", sessionToken);
  const response = await zitadelFetch<GetSessionResponse>({
    method: "GET",
    path: `/v2/sessions/${encodeURIComponent(sessionId)}`,
    query,
  });
  return response.session?.factors ?? {};
}

/** Termina la sessione ZITADEL (logout lato IdP). */
export async function deleteSession(
  sessionId: string,
  sessionToken?: string
): Promise<void> {
  await zitadelFetch<Record<string, unknown>>({
    method: "DELETE",
    path: `/v2/sessions/${encodeURIComponent(sessionId)}`,
    body: sessionToken ? { sessionToken } : {},
  });
}
