import type { SessionFactors } from "./session";
import type { LoginSettings } from "./settings";
import type { AuthMethodType } from "./users";

/**
 * Decisione del passo successivo del login: logica pura (testabile) che
 * incrocia i fattori già verificati della sessione, i metodi configurati
 * dall'utente e la login policy di ZITADEL. Nessuna verifica avviene qui:
 * i check restano sulla Session API.
 */

export type MfaMethod = "totp" | "otpEmail" | "otpSms" | "webAuthN";

export type NextLoginStep =
  | { kind: "password" }
  | { kind: "mfa"; methods: readonly MfaMethod[] }
  | { kind: "done" };

const SECOND_FACTOR_PRIORITY: ReadonlyArray<{
  method: MfaMethod;
  authMethod: AuthMethodType;
}> = [
  { method: "totp", authMethod: "AUTHENTICATION_METHOD_TYPE_TOTP" },
  { method: "webAuthN", authMethod: "AUTHENTICATION_METHOD_TYPE_U2F" },
  { method: "otpEmail", authMethod: "AUTHENTICATION_METHOD_TYPE_OTP_EMAIL" },
  { method: "otpSms", authMethod: "AUTHENTICATION_METHOD_TYPE_OTP_SMS" },
];

function hasVerified(factor?: { verifiedAt?: string }): boolean {
  return Boolean(factor?.verifiedAt);
}

function secondFactorVerified(factors: SessionFactors): boolean {
  return (
    hasVerified(factors.totp) ||
    hasVerified(factors.otpEmail) ||
    hasVerified(factors.otpSms) ||
    hasVerified(factors.webAuthN)
  );
}

/** Metodi MFA disponibili per l'utente, in ordine di preferenza. */
export function availableMfaMethods(
  authMethods: readonly AuthMethodType[]
): readonly MfaMethod[] {
  return SECOND_FACTOR_PRIORITY.filter(({ authMethod }) =>
    authMethods.includes(authMethod)
  ).map(({ method }) => method);
}

/**
 * Prossimo passo dopo un check riuscito.
 * - password non verificata → passo password;
 * - MFA configurata (o forzata dalla policy) e secondo fattore mancante →
 *   passo MFA con i metodi disponibili;
 * - altrimenti la sessione è pronta per finalizzare la auth request.
 */
export function nextLoginStep(input: {
  factors: SessionFactors;
  authMethods: readonly AuthMethodType[];
  loginSettings: LoginSettings;
}): NextLoginStep {
  const { factors, authMethods, loginSettings } = input;
  const passwordDone = hasVerified(factors.password);
  const passkeyDone = hasVerified(factors.webAuthN) && factors.webAuthN?.userVerified;

  // Una passkey con user verification vale come autenticazione completa.
  if (passkeyDone) return { kind: "done" };
  if (!passwordDone) return { kind: "password" };
  if (secondFactorVerified(factors)) return { kind: "done" };

  const methods = availableMfaMethods(authMethods);
  if (methods.length > 0) return { kind: "mfa", methods };

  // Nessun secondo fattore configurato: se la policy lo impone il login
  // non può procedere senza setup (gestito come errore a monte); qui si
  // segnala comunque il passo MFA vuoto solo se forzato.
  if (loginSettings.forceMfa) return { kind: "mfa", methods: [] };
  return { kind: "done" };
}
