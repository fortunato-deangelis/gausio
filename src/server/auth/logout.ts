import "server-only";
import { headers } from "next/headers";
import { getToken } from "next-auth/jwt";

/**
 * Supporto al logout OIDC: recupera l'id_token conservato nel JWT di
 * sessione Auth.js e costruisce la URL di end_session di ZITADEL
 * (RP-initiated logout). La post_logout_redirect_uri deve essere
 * registrata sull'applicazione OIDC in ZITADEL.
 */

function isSecureCookieEnvironment(): boolean {
  return (process.env.AUTH_URL ?? "").startsWith("https://");
}

export async function getIdTokenForLogout(): Promise<string | null> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;
  try {
    const token = await getToken({
      req: { headers: await headers() },
      secret,
      secureCookie: isSecureCookieEnvironment(),
    });
    const idToken = token?.idToken;
    return typeof idToken === "string" && idToken.length > 0 ? idToken : null;
  } catch {
    return null;
  }
}

function configuredPostLogoutRedirectUri(): string | null {
  const value =
    process.env.AUTH_POST_LOGOUT_REDIRECT_URI?.trim() ||
    process.env.AUTH_URL?.trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return value.split("#")[0]?.split("?")[0] || null;
  } catch {
    return null;
  }
}

/** URL OIDC end_session; null se issuer/client/redirect non sono configurati. */
export function buildEndSessionUrl(idToken: string): string | null {
  const issuer = process.env.AUTH_ZITADEL_ISSUER;
  const clientId = process.env.AUTH_ZITADEL_ID;
  const postLogoutRedirectUri = configuredPostLogoutRedirectUri();
  if (!issuer || !clientId || !postLogoutRedirectUri) return null;
  const url = new URL("/oidc/v1/end_session", issuer);
  url.searchParams.set("id_token_hint", idToken);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("post_logout_redirect_uri", postLogoutRedirectUri);
  return url.toString();
}
