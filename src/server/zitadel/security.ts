/**
 * Utility di sicurezza del flusso di login: rate limiting delle action
 * sensibili e validazione dei redirect (anti open-redirect).
 *
 * Il limiter è in-memory: protegge la singola istanza Node. In produzione
 * multi-istanza va affiancato da un limite a livello di edge/proxy o da uno
 * store condiviso (vedi docs/SECURITY.md); ZITADEL applica comunque le sue
 * lockout policy e i suoi rate limit lato IdP.
 */

type RateLimitRule = Readonly<{ limit: number; windowMs: number }>;

const buckets = new Map<string, number[]>();

export const RATE_LIMITS = {
  /** Verifiche di credenziali e codici: 10 tentativi / 5 minuti per chiave. */
  credentials: { limit: 10, windowMs: 5 * 60 * 1000 },
  /** Invio email (reset, verifica, OTP): 5 invii / 15 minuti per chiave. */
  email: { limit: 5, windowMs: 15 * 60 * 1000 },
  /** Registrazioni: 5 / ora per chiave. */
  register: { limit: 5, windowMs: 60 * 60 * 1000 },
} as const satisfies Record<string, RateLimitRule>;

/** true se l'azione è consentita; false se la chiave ha superato il limite. */
export function checkRateLimit(key: string, rule: RateLimitRule, now = Date.now()): boolean {
  const windowStart = now - rule.windowMs;
  const hits = (buckets.get(key) ?? []).filter((t) => t > windowStart);
  if (hits.length >= rule.limit) {
    buckets.set(key, hits);
    return false;
  }
  hits.push(now);
  buckets.set(key, hits);
  // pulizia opportunistica per evitare crescita illimitata
  if (buckets.size > 10_000) {
    for (const [k, v] of buckets) {
      if (v.every((t) => t <= windowStart)) buckets.delete(k);
    }
  }
  return true;
}

/** Svuota i bucket (solo per i test). */
export function resetRateLimits(): void {
  buckets.clear();
}

/**
 * Un percorso interno è sicuro solo se relativo alla root dell'app
 * (niente "//host", niente schema, niente backslash).
 */
export function isSafeInternalPath(path: string | undefined | null): path is string {
  if (!path) return false;
  return path.startsWith("/") && !path.startsWith("//") && !path.includes("\\");
}

/**
 * La callbackUrl restituita da ZITADEL alla finalizzazione della auth
 * request deve puntare alla redirect_uri registrata del client OIDC (nel
 * nostro caso l'app stessa). Qualsiasi altra destinazione viene rifiutata.
 */
export function isAllowedCallbackUrl(
  callbackUrl: string,
  allowedOrigins: readonly string[]
): boolean {
  let parsed: URL;
  try {
    parsed = new URL(callbackUrl);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
  return allowedOrigins.some((origin) => {
    try {
      return new URL(origin).origin === parsed.origin;
    } catch {
      return false;
    }
  });
}

/**
 * Associa una auth request al flusso che l'ha originata. I flussi esterni
 * devono conservare lo stesso request id; quelli avviati dall'app senza id
 * possono finalizzare soltanto una request che ritorna all'origin dell'app.
 */
export function isExpectedAuthRequest(
  requestId: string,
  pendingRequestId: string | undefined,
  redirectUri: string | undefined,
  appOrigin: string
): boolean {
  if (pendingRequestId) return requestId === pendingRequestId;
  if (!redirectUri) return false;
  try {
    return new URL(redirectUri).origin === new URL(appOrigin).origin;
  } catch {
    return false;
  }
}
