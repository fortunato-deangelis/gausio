/**
 * Inoltro (reverse proxy applicativo) dei path del protocollo OIDC verso
 * l'API ZITADEL.
 *
 * La Login App serve la UI interattiva sotto il proprio base path
 * (NEXT_PUBLIC_BASE_PATH, di default `/ui/v2/login`) e, in questo modello di
 * deployment, inoltra i path del protocollo OIDC a ZITADEL così che la Main App
 * possa usare la Login App come origin OIDC (custom login base URL).
 *
 * I prefissi sono ricavati dai path standard ZITADEL/OIDC — non sono inventati:
 *   - /.well-known/  (discovery, jwks)
 *   - /oauth/        (authorize, token, revoke, introspect)
 *   - /oidc/         (userinfo, end_session)
 *
 * Le funzioni sono pure e testabili in isolamento.
 */

/** Prefissi di path che devono essere inoltrati all'API ZITADEL. */
export const OIDC_FORWARD_PREFIXES = [
  "/.well-known/",
  "/oauth/",
  "/oidc/",
] as const;

/** True se il pathname appartiene al protocollo OIDC da inoltrare. */
export function isForwardablePath(pathname: string): boolean {
  return OIDC_FORWARD_PREFIXES.some(
    (prefix) => pathname === prefix.slice(0, -1) || pathname.startsWith(prefix)
  );
}

/**
 * Costruisce l'URL di destinazione sull'API ZITADEL preservando path e query.
 * Ritorna null se ZITADEL_API_URL non è configurato o l'URL non è valido.
 */
export function buildUpstreamUrl(
  requestUrl: string,
  apiBaseUrl: string | undefined
): string | null {
  if (!apiBaseUrl) return null;
  try {
    const incoming = new URL(requestUrl);
    const target = new URL(apiBaseUrl.replace(/\/+$/, ""));
    target.pathname = incoming.pathname;
    target.search = incoming.search;
    return target.toString();
  } catch {
    return null;
  }
}
