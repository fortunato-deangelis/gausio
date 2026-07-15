import "server-only";

import { redact, redactString } from "./redact";

/**
 * Redazione centralizzata dei log.
 *
 * Nessun segreto o materiale sensibile deve finire nei log:
 * password, OTP, authorization code, access/refresh/id token, session token,
 * PAT, client secret, header Authorization/Cookie, ecc.
 *
 * Usare `logger` al posto di `console` per l'output applicativo lato server.
 * Le funzioni di redazione pure vivono in ./redact.ts (testabili in isolamento).
 */

export { redact, redactString, isSensitiveKey, REDACTED } from "./redact";

type LogLevel = "debug" | "info" | "warn" | "error";

function emit(level: LogLevel, message: string, meta?: unknown): void {
  const safeMessage = redactString(message);
  const payload = meta === undefined ? undefined : redact(meta);
  const line =
    payload === undefined
      ? `[${level}] ${safeMessage}`
      : `[${level}] ${safeMessage} ${JSON.stringify(payload)}`;

  // Debug silenziato in produzione.
  if (level === "debug" && process.env.NODE_ENV === "production") return;
  const sink =
    level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  sink(line);
}

export const logger = {
  debug: (message: string, meta?: unknown) => emit("debug", message, meta),
  info: (message: string, meta?: unknown) => emit("info", message, meta),
  warn: (message: string, meta?: unknown) => emit("warn", message, meta),
  error: (message: string, meta?: unknown) => emit("error", message, meta),
};
