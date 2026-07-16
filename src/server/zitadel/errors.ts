import "server-only";

/**
 * Errori delle API ZITADEL (gRPC-gateway JSON: { code, message, details }).
 *
 * Regole:
 * - mai propagare al client i messaggi grezzi di ZITADEL;
 * - collassare "utente inesistente" e "password errata" nello stesso
 *   messaggio per impedire l'enumerazione degli utenti;
 * - non loggare mai body di richieste (possono contenere password/OTP) né
 *   token; qui si logga solo metodo, path, HTTP status e message ZITADEL.
 */

export class ZitadelApiError extends Error {
  readonly httpStatus: number;
  readonly grpcCode: number | undefined;
  /** Messaggio grezzo ZITADEL (contiene la chiave i18n, es. Errors.User.NotFound). */
  readonly apiMessage: string;

  constructor(httpStatus: number, grpcCode: number | undefined, apiMessage: string) {
    super(`ZITADEL API error (HTTP ${httpStatus})`);
    this.name = "ZitadelApiError";
    this.httpStatus = httpStatus;
    this.grpcCode = grpcCode;
    this.apiMessage = apiMessage;
  }

  matches(i18nKey: string): boolean {
    return this.apiMessage.includes(i18nKey);
  }
}

/** Errore applicativo con messaggio sicuro da mostrare all'utente. */
export class LoginFlowError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LoginFlowError";
  }
}

export const AUTH_ERROR_MESSAGES = {
  invalidCredentials: "Credenziali non valide. Controlla email e password.",
  invalidCode: "Codice non valido o scaduto. Riprova.",
  accountLocked:
    "Account bloccato per troppi tentativi. Contatta un amministratore per sbloccarlo.",
  rateLimited: "Troppi tentativi. Attendi qualche minuto e riprova.",
  flowExpired: "La sessione di accesso è scaduta. Ricomincia dall'inizio.",
  registrationFailed:
    "Non è stato possibile completare la registrazione. Verifica i dati e riprova.",
  generic: "Si è verificato un errore imprevisto. Riprova.",
} as const;

/**
 * Converte un errore ZITADEL in un messaggio utente sicuro per il flusso
 * di verifica credenziali (login con password).
 */
export function credentialsErrorMessage(error: unknown): string {
  if (error instanceof ZitadelApiError) {
    if (error.matches("Errors.User.Locked")) return AUTH_ERROR_MESSAGES.accountLocked;
    // NotFound e Password.Invalid collassano volutamente nello stesso testo.
    if (
      error.matches("Errors.User.NotFound") ||
      error.matches("Errors.User.Password.Invalid") ||
      error.matches("Errors.Session")
    ) {
      return AUTH_ERROR_MESSAGES.invalidCredentials;
    }
    if (error.httpStatus === 429) return AUTH_ERROR_MESSAGES.rateLimited;
  }
  return AUTH_ERROR_MESSAGES.generic;
}

/** Messaggio utente sicuro per la verifica di un codice (OTP/TOTP/reset). */
export function codeErrorMessage(error: unknown): string {
  if (error instanceof ZitadelApiError) {
    if (error.matches("Errors.User.Locked")) return AUTH_ERROR_MESSAGES.accountLocked;
    if (error.httpStatus === 429) return AUTH_ERROR_MESSAGES.rateLimited;
    if (error.httpStatus === 400 || error.httpStatus === 404) {
      return AUTH_ERROR_MESSAGES.invalidCode;
    }
  }
  return AUTH_ERROR_MESSAGES.generic;
}

/**
 * Messaggio sicuro per la registrazione. Un conflitto email e ogni altro
 * errore di creazione restituiscono lo stesso testo per non confermare
 * l'esistenza di un account. Restano distinguibili solo policy password e
 * rate limit, che non rivelano identità registrate.
 */
export function registrationErrorMessage(error: unknown): string {
  if (error instanceof ZitadelApiError) {
    if (error.httpStatus === 429) return AUTH_ERROR_MESSAGES.rateLimited;
    if (error.matches("Errors.User.Password")) {
      return "La password non rispetta i requisiti di sicurezza.";
    }
  }
  return AUTH_ERROR_MESSAGES.registrationFailed;
}

function safeLogValue(value: string): string {
  return value.replace(/[\r\n\t]+/g, " ").slice(0, 500);
}

/** Log lato server senza dati sensibili. */
export function logZitadelError(context: string, error: unknown): void {
  if (error instanceof ZitadelApiError) {
    console.error(
      `[zitadel] ${context}: HTTP ${error.httpStatus}${
        error.grpcCode !== undefined ? ` (grpc ${error.grpcCode})` : ""
      } — ${safeLogValue(error.apiMessage)}`
    );
    return;
  }
  console.error(
    `[zitadel] ${safeLogValue(context)}:`,
    error instanceof Error ? safeLogValue(error.message) : "errore non classificato"
  );
}
