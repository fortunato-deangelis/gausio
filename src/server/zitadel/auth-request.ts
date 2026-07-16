import "server-only";
import { zitadelFetch } from "./client";

/**
 * OIDC Service v2 — lettura e finalizzazione delle auth request quando la
 * feature Login V2 redirige il browser alla login UI custom
 * ({baseUri}/login?authRequest=V2_...).
 * Riferimenti:
 * - https://zitadel.com/docs/guides/integrate/login-ui/oidc-standard
 * - https://zitadel.com/docs/apis/resources/oidc_service_v2/oidc-service-get-auth-request
 * - https://zitadel.com/docs/apis/resources/oidc_service_v2/oidc-service-create-callback
 */

export type OidcAuthRequest = Readonly<{
  id: string;
  creationDate?: string;
  clientId?: string;
  scope?: readonly string[];
  redirectUri?: string;
  prompt?: readonly string[];
  loginHint?: string;
  hintUserId?: string;
  maxAge?: string;
  uiLocales?: readonly string[];
}>;

export async function getAuthRequest(authRequestId: string): Promise<OidcAuthRequest> {
  const response = await zitadelFetch<{ authRequest: OidcAuthRequest }>({
    method: "GET",
    path: `/v2/oidc/auth_requests/${encodeURIComponent(authRequestId)}`,
  });
  return response.authRequest;
}

/**
 * Associa la sessione autenticata alla auth request. Chiamabile UNA SOLA
 * volta per auth request; la callbackUrl restituita è la redirect_uri del
 * client OIDC con code+state e va validata prima del redirect.
 */
export async function finalizeAuthRequest(
  authRequestId: string,
  session: { sessionId: string; sessionToken: string }
): Promise<string> {
  const response = await zitadelFetch<{ callbackUrl: string }>({
    method: "POST",
    path: `/v2/oidc/auth_requests/${encodeURIComponent(authRequestId)}`,
    body: { session },
  });
  return response.callbackUrl;
}

/** Motivi di errore OIDC (enum zitadel.oidc.v2.ErrorReason). */
export type OidcErrorReason =
  | "ERROR_REASON_ACCESS_DENIED"
  | "ERROR_REASON_LOGIN_REQUIRED"
  | "ERROR_REASON_INTERACTION_REQUIRED"
  | "ERROR_REASON_SERVER_ERROR";

/** Chiude la auth request con un errore OIDC (es. accesso negato). */
export async function failAuthRequest(
  authRequestId: string,
  error: { error: OidcErrorReason; errorDescription?: string }
): Promise<string> {
  const response = await zitadelFetch<{ callbackUrl: string }>({
    method: "POST",
    path: `/v2/oidc/auth_requests/${encodeURIComponent(authRequestId)}`,
    body: { error },
  });
  return response.callbackUrl;
}
