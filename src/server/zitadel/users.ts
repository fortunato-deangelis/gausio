import "server-only";
import { zitadelFetch } from "./client";
import { getAppOrigin } from "./config";

/**
 * User Service v2 — registrazione, verifica email, reset password.
 * Riferimenti:
 * - https://zitadel.com/docs/apis/resources/user_service_v2/user-service-add-human-user
 * - https://zitadel.com/docs/apis/resources/user_service_v2/user-service-verify-email
 * - https://zitadel.com/docs/apis/resources/user_service_v2/user-service-password-reset
 * - https://zitadel.com/docs/apis/resources/user_service_v2/user-service-set-password
 * - https://zitadel.com/docs/apis/resources/user_service_v2/user-service-list-users
 * - https://zitadel.com/docs/apis/resources/user_service_v2/user-service-list-authentication-method-types
 *
 * Nota: POST /v2/users/human e POST /v2/users/{id}/password sono marcati
 * deprecati nella reference più recente (sostituiti da /v2/users/new e
 * PATCH /v2/users/{id}), ma restano gli endpoint usati dalle guide
 * ufficiali "Build your own Login UI" e non richiedono organizationId
 * esplicito. Vedi docs/IMPLEMENTATION_PLAN.md §9.
 */

export type AuthMethodType =
  | "AUTHENTICATION_METHOD_TYPE_UNSPECIFIED"
  | "AUTHENTICATION_METHOD_TYPE_PASSWORD"
  | "AUTHENTICATION_METHOD_TYPE_PASSKEY"
  | "AUTHENTICATION_METHOD_TYPE_IDP"
  | "AUTHENTICATION_METHOD_TYPE_TOTP"
  | "AUTHENTICATION_METHOD_TYPE_U2F"
  | "AUTHENTICATION_METHOD_TYPE_OTP_SMS"
  | "AUTHENTICATION_METHOD_TYPE_OTP_EMAIL";

/** Template Go-template ({{.UserID}}, {{.Code}}) risolti da ZITADEL. */
function emailVerifyUrlTemplate(): string {
  return `${getAppOrigin()}/verify-email?userId={{.UserID}}&code={{.Code}}`;
}

function passwordResetUrlTemplate(): string {
  return `${getAppOrigin()}/reset-password?userId={{.UserID}}&code={{.Code}}`;
}

export async function registerHumanUser(input: {
  givenName: string;
  familyName: string;
  email: string;
  password: string;
}): Promise<{ userId: string }> {
  return zitadelFetch<{ userId: string }>({
    method: "POST",
    path: "/v2/users/human",
    body: {
      profile: { givenName: input.givenName, familyName: input.familyName },
      email: {
        email: input.email,
        sendCode: { urlTemplate: emailVerifyUrlTemplate() },
      },
      password: { password: input.password, changeRequired: false },
    },
  });
}

export async function verifyEmail(userId: string, verificationCode: string): Promise<void> {
  await zitadelFetch<Record<string, unknown>>({
    method: "POST",
    path: `/v2/users/${encodeURIComponent(userId)}/email/verify`,
    body: { verificationCode },
  });
}

export async function resendEmailCode(userId: string): Promise<void> {
  await zitadelFetch<Record<string, unknown>>({
    method: "POST",
    path: `/v2/users/${encodeURIComponent(userId)}/email/resend`,
    body: { sendCode: { urlTemplate: emailVerifyUrlTemplate() } },
  });
}

/** Ricerca l'utente per email; solo lato server (PAT), mai esposta. */
export async function findUserIdByEmail(email: string): Promise<string | null> {
  const response = await zitadelFetch<{
    result?: ReadonlyArray<{ userId?: string }>;
  }>({
    method: "POST",
    path: "/v2/users",
    body: {
      query: { limit: 1 },
      queries: [
        {
          emailQuery: { emailAddress: email, method: "TEXT_QUERY_METHOD_EQUALS" },
        },
      ],
    },
  });
  return response.result?.[0]?.userId ?? null;
}

/** Invia l'email di reset con link alla pagina custom. */
export async function requestPasswordReset(userId: string): Promise<void> {
  await zitadelFetch<Record<string, unknown>>({
    method: "POST",
    path: `/v2/users/${encodeURIComponent(userId)}/password_reset`,
    body: {
      sendLink: {
        notificationType: "NOTIFICATION_TYPE_Email",
        urlTemplate: passwordResetUrlTemplate(),
      },
    },
  });
}

/** Imposta la nuova password verificando il codice ricevuto via email. */
export async function setPasswordWithCode(
  userId: string,
  newPassword: string,
  verificationCode: string
): Promise<void> {
  await zitadelFetch<Record<string, unknown>>({
    method: "POST",
    path: `/v2/users/${encodeURIComponent(userId)}/password`,
    body: {
      newPassword: { password: newPassword, changeRequired: false },
      verificationCode,
    },
  });
}

/** Metodi di autenticazione configurati dall'utente (per la scelta MFA). */
export async function listAuthenticationMethods(
  userId: string,
  domain?: string
): Promise<readonly AuthMethodType[]> {
  const query = new URLSearchParams();
  query.set("includeWithoutDomain", "true");
  if (domain) query.set("domain", domain);
  const response = await zitadelFetch<{ authMethodTypes?: readonly AuthMethodType[] }>({
    method: "GET",
    path: `/v2/users/${encodeURIComponent(userId)}/authentication_methods`,
    query,
  });
  return response.authMethodTypes ?? [];
}
