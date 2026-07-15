/**
 * Funzioni pure di redazione (senza dipendenze da runtime server) così da
 * essere testabili in isolamento. La API con `logger` vive in ./log.ts.
 */

/** Chiavi il cui valore va sempre oscurato (case-insensitive, match parziale). */
const SENSITIVE_KEY_PATTERNS = [
  "password",
  "passwd",
  "secret",
  "token",
  "authorization",
  "cookie",
  "set-cookie",
  "pat",
  "otp",
  "code",
  "client_secret",
  "id_token",
  "access_token",
  "refresh_token",
  "session",
  "apikey",
  "api_key",
  "private",
];

export const REDACTED = "[REDACTED]";

export function isSensitiveKey(key: string): boolean {
  const lower = key.toLowerCase();
  return SENSITIVE_KEY_PATTERNS.some((pattern) => lower.includes(pattern));
}

/**
 * Oscura pattern sensibili all'interno di stringhe libere:
 * - Bearer token
 * - JWT (tre segmenti base64url separati da punto)
 * - query param sensibili (?code=..., &access_token=...)
 */
export function redactString(input: string): string {
  return input
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer " + REDACTED)
    .replace(/\beyJ[A-Za-z0-9._-]{10,}/g, REDACTED)
    .replace(
      /([?&](?:code|access_token|refresh_token|id_token|token|client_secret|otp|pat)=)[^&#\s]+/gi,
      `$1${REDACTED}`
    );
}

/**
 * Ritorna una copia del valore con i campi sensibili sostituiti da [REDACTED].
 * Gestisce oggetti annidati, array e stringhe. Protetto contro riferimenti
 * circolari e profondità eccessiva.
 */
export function redact(
  value: unknown,
  depth = 0,
  seen = new WeakSet<object>()
): unknown {
  if (depth > 6) return "[TRUNCATED]";

  if (typeof value === "string") return redactString(value);
  if (value === null || typeof value !== "object") return value;

  if (seen.has(value as object)) return "[CIRCULAR]";
  seen.add(value as object);

  if (Array.isArray(value)) {
    return value.map((item) => redact(item, depth + 1, seen));
  }

  if (value instanceof Error) {
    return { name: value.name, message: redactString(value.message) };
  }

  const output: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    output[key] = isSensitiveKey(key) ? REDACTED : redact(val, depth + 1, seen);
  }
  return output;
}
