import "server-only";

/**
 * Configurazione del client ZITADEL per la login UI custom.
 *
 * La login custom richiede, oltre alla configurazione OIDC di Auth.js
 * (AUTH_ZITADEL_*), il PAT di un service user con ruolo IAM_LOGIN_CLIENT:
 * senza PAT l'app ripiega sul flusso hosted di ZITADEL.
 */

export type ZitadelConfig = Readonly<{
  /** Issuer OIDC = base URL delle API v2 (senza slash finale). */
  issuer: string;
  /** PAT del service user "login client". */
  serviceUserToken: string;
}>;

function normalizeUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

/** true se Auth.js ha un provider Zitadel configurato (il client secret
 * è opzionale: le app "None"/PKCE non ne hanno uno). */
export function isZitadelOidcConfigured(): boolean {
  return Boolean(process.env.AUTH_ZITADEL_ISSUER && process.env.AUTH_ZITADEL_ID);
}

/** true se la login UI custom può operare (OIDC + PAT del login client). */
export function isCustomLoginEnabled(): boolean {
  return isZitadelOidcConfigured() && Boolean(process.env.ZITADEL_SERVICE_USER_TOKEN);
}

/**
 * Config runtime; lancia se la login custom non è configurata.
 * Da usare solo dietro un check di isCustomLoginEnabled().
 */
export function getZitadelConfig(): ZitadelConfig {
  const issuer = process.env.AUTH_ZITADEL_ISSUER;
  const serviceUserToken = process.env.ZITADEL_SERVICE_USER_TOKEN;
  if (!issuer || !serviceUserToken) {
    throw new Error(
      "Login custom ZITADEL non configurata: servono AUTH_ZITADEL_ISSUER e ZITADEL_SERVICE_USER_TOKEN."
    );
  }
  return {
    issuer: normalizeUrl(issuer),
    serviceUserToken,
  };
}

/** Origin pubblico dell'app (per urlTemplate, redirect e WebAuthn RP ID). */
export function getAppOrigin(): string {
  const url = process.env.AUTH_URL || "http://localhost:3000";
  return new URL(url).origin;
}

/** Dominio (senza porta) usato come RP ID per le challenge WebAuthn. */
export function getWebAuthnDomain(): string {
  return new URL(getAppOrigin()).hostname;
}
