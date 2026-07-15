import "server-only";

/**
 * Lettura centralizzata (server-side) della configurazione OIDC/ZITADEL.
 *
 * Tutti i segreti restano lato server: nessun valore qui deve avere il
 * prefisso NEXT_PUBLIC_. Questo modulo NON deve essere importato da componenti
 * client.
 */

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

/**
 * Base URL della Custom Login App (Login UI v2). Quando impostata, la Main App
 * instrada l'authorization endpoint OIDC verso la Login App invece che verso
 * la hosted login di ZITADEL. Gli altri endpoint (token, userinfo, jwks,
 * end_session) restano sull'issuer ZITADEL e vengono usati solo server-side.
 */
export function getLoginBaseUrl(
  env: Record<string, string | undefined> = process.env
): string | undefined {
  const value = env.ZITADEL_LOGIN_BASE_URL?.trim();
  return value ? trimTrailingSlash(value) : undefined;
}

/** Issuer ZITADEL (accetta sia AUTH_ZITADEL_ISSUER sia ZITADEL_ISSUER). */
export function getZitadelIssuer(
  env: Record<string, string | undefined> = process.env
): string | undefined {
  const value = (env.AUTH_ZITADEL_ISSUER ?? env.ZITADEL_ISSUER)?.trim();
  return value ? trimTrailingSlash(value) : undefined;
}

/**
 * Endpoint OIDC derivati. I path seguono lo standard ZITADEL e NON vanno
 * inventati: authorize/token/userinfo su /oauth/v2 e /oidc/v1, end_session su
 * /oidc/v1/end_session. La Login App fa da proxy per /oauth, /oidc e
 * /.well-known verso l'API ZITADEL.
 */
export function getOidcEndpoints(
  env: Record<string, string | undefined> = process.env
): {
  issuer?: string;
  authorization?: string;
  endSession?: string;
} {
  const issuer = getZitadelIssuer(env);
  const loginBase = getLoginBaseUrl(env);
  if (!issuer) return {};

  // Se la Login App è configurata, l'utente deve raggiungere l'authorization
  // endpoint tramite di essa (custom login base URL). Gli endpoint machine
  // (token exchange, end_session) restano sull'issuer.
  const authorizationHost = loginBase ?? issuer;

  return {
    issuer,
    authorization: `${authorizationHost}/oauth/v2/authorize`,
    endSession: `${issuer}/oidc/v1/end_session`,
  };
}

export const isZitadelConfigured = Boolean(
  getZitadelIssuer() &&
    (process.env.AUTH_ZITADEL_ID ?? process.env.ZITADEL_CLIENT_ID) &&
    (process.env.AUTH_ZITADEL_SECRET ?? process.env.ZITADEL_CLIENT_SECRET)
);

/** Base URL pubblica della Main App (per post_logout_redirect_uri assoluto). */
export function getAppBaseUrl(
  env: Record<string, string | undefined> = process.env
): string | undefined {
  const value = (
    env.APP_BASE_URL ??
    env.AUTH_URL ??
    env.NEXTAUTH_URL ??
    env.NEXT_PUBLIC_SITE_URL
  )?.trim();
  return value ? trimTrailingSlash(value) : undefined;
}

/**
 * Costruisce l'URL di end_session (logout federato) di ZITADEL.
 *
 * `idTokenHint` è opzionale: se presente, ZITADEL esegue il logout senza
 * schermata di conferma. In sua assenza si passano client_id e
 * post_logout_redirect_uri (che DEVE essere registrato tra i post logout
 * redirect URI dell'app in ZITADEL). Non usiamo mai wildcard.
 *
 * Ritorna undefined se ZITADEL non è configurato: il chiamante ricadrà sul
 * solo logout locale.
 */
export function buildEndSessionUrl(options: {
  idTokenHint?: string;
  postLogoutRedirect?: string;
  env?: Record<string, string | undefined>;
}): string | undefined {
  const env = options.env ?? process.env;
  const { endSession } = getOidcEndpoints(env);
  if (!endSession) return undefined;

  const url = new URL(endSession);
  const clientId = env.AUTH_ZITADEL_ID ?? env.ZITADEL_CLIENT_ID;
  const appBase = getAppBaseUrl(env);

  if (options.idTokenHint) {
    url.searchParams.set("id_token_hint", options.idTokenHint);
  } else if (clientId) {
    url.searchParams.set("client_id", clientId);
  }

  const postLogout =
    options.postLogoutRedirect ?? (appBase ? `${appBase}/` : undefined);
  if (postLogout) {
    url.searchParams.set("post_logout_redirect_uri", postLogout);
  }

  return url.toString();
}
