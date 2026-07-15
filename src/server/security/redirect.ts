/**
 * Sanitizzazione dei redirect URL per prevenire open redirect.
 *
 * Regola generale: accettiamo solo URL *relativi* alla Main App (path che
 * iniziano con "/" ma non con "//" né "/\\"), oppure URL assoluti il cui
 * origin è esplicitamente in allowlist. Qualsiasi altro valore viene
 * sostituito con un fallback sicuro.
 *
 * Le funzioni sono pure e senza dipendenze da Next.js per essere testabili in
 * isolamento (vedi src/server/security/__tests__).
 */

/** Fallback usato quando l'URL richiesto non è sicuro. */
export const DEFAULT_SAFE_PATH = "/app";

/**
 * Ritorna true se `target` è un path relativo sicuro:
 * - inizia con "/"
 * - non è uno schema-relative URL ("//host") che porterebbe fuori dominio
 * - non contiene un backslash iniziale ("/\\host"), trucco usato per bypass
 * - non contiene caratteri di controllo
 */
export function isSafeRelativePath(target: string): boolean {
  if (typeof target !== "string" || target.length === 0) return false;
  if (target[0] !== "/") return false;
  // "//" e "/\" vengono interpretati da alcuni browser come protocol-relative.
  if (target[1] === "/" || target[1] === "\\") return false;
  // Nessun carattere di controllo (inclusi \r \n \t) che consenta header/URL injection.
  if (/[\u0000-\u001f\u007f]/.test(target)) return false;
  return true;
}

/**
 * Costruisce l'allowlist di origin consentiti a partire dalle variabili
 * d'ambiente note. Non vengono mai usate wildcard.
 */
export function buildAllowedOrigins(
  env: Record<string, string | undefined> = process.env
): ReadonlySet<string> {
  const candidates = [
    env.APP_BASE_URL,
    env.AUTH_URL,
    env.NEXTAUTH_URL,
    env.NEXT_PUBLIC_SITE_URL,
    env.ZITADEL_LOGIN_BASE_URL,
  ];
  const origins = new Set<string>();
  for (const value of candidates) {
    if (!value) continue;
    try {
      origins.add(new URL(value).origin);
    } catch {
      // Valore malformato: ignorato di proposito, non deve rompere il boot.
    }
  }
  return origins;
}

/**
 * Ritorna un URL/percorso sicuro verso cui redirigere.
 *
 * @param target valore potenzialmente non fidato (query param, form field…)
 * @param options fallback e allowlist di origin per URL assoluti
 */
export function sanitizeRedirect(
  target: string | null | undefined,
  options: {
    fallback?: string;
    allowedOrigins?: ReadonlySet<string>;
  } = {}
): string {
  const fallback = options.fallback ?? DEFAULT_SAFE_PATH;

  if (typeof target !== "string" || target.length === 0) return fallback;

  // Caso comune: path relativo interno.
  if (isSafeRelativePath(target)) return target;

  // URL assoluto: consentito solo se l'origin è in allowlist.
  try {
    const url = new URL(target);
    const allowed = options.allowedOrigins ?? buildAllowedOrigins();
    if (allowed.has(url.origin)) {
      return url.toString();
    }
  } catch {
    // Non è un URL assoluto valido.
  }

  return fallback;
}
