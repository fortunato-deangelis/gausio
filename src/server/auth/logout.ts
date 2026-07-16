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

/** URL OIDC end_session; null se l'issuer non è configurato. */
export function buildEndSessionUrl(idToken: string): string | null {
  const issuer = process.env.AUTH_ZITADEL_ISSUER;
  const appUrl = process.env.AUTH_URL;
  if (!issuer || !appUrl) return null;
  const url = new URL("/oidc/v1/end_session", issuer);
  url.searchParams.set("id_token_hint", idToken);
  url.searchParams.set("post_logout_redirect_uri", new URL("/", appUrl).toString());
  return url.toString();
}
