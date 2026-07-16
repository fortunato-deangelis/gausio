import { describe, expect, it } from "vitest";
import {
  AUTH_ERROR_MESSAGES,
  codeErrorMessage,
  credentialsErrorMessage,
  registrationErrorMessage,
  ZitadelApiError,
} from "@/server/zitadel/errors";

describe("mappatura errori credenziali (no user enumeration)", () => {
  it("utente inesistente e password errata producono lo stesso messaggio", () => {
    const notFound = new ZitadelApiError(
      400,
      9,
      "Errors.User.NotFound (COMMAND-Df4b3)"
    );
    const wrongPassword = new ZitadelApiError(
      400,
      3,
      "Errors.User.Password.Invalid (COMMAND-3M0fs)"
    );
    expect(credentialsErrorMessage(notFound)).toBe(
      credentialsErrorMessage(wrongPassword)
    );
    expect(credentialsErrorMessage(notFound)).toBe(
      AUTH_ERROR_MESSAGES.invalidCredentials
    );
  });

  it("account bloccato produce un messaggio distinto", () => {
    const locked = new ZitadelApiError(400, 9, "Errors.User.Locked (COMMAND-JLK35)");
    expect(credentialsErrorMessage(locked)).toBe(AUTH_ERROR_MESSAGES.accountLocked);
  });

  it("il messaggio grezzo ZITADEL non trapela mai all'utente", () => {
    const raw = new ZitadelApiError(500, 13, "internal: db timeout on host xyz");
    expect(credentialsErrorMessage(raw)).toBe(AUTH_ERROR_MESSAGES.generic);
    expect(credentialsErrorMessage(raw)).not.toContain("xyz");
  });

  it("errori non-ZITADEL producono il messaggio generico", () => {
    expect(credentialsErrorMessage(new Error("boom"))).toBe(AUTH_ERROR_MESSAGES.generic);
  });
});

describe("mappatura errori registrazione (no email enumeration)", () => {
  it("conflitto email e errore generico producono lo stesso messaggio", () => {
    const duplicate = new ZitadelApiError(409, 6, "Errors.User.AlreadyExists");
    const internal = new ZitadelApiError(500, 13, "internal failure");

    expect(registrationErrorMessage(duplicate)).toBe(
      AUTH_ERROR_MESSAGES.registrationFailed
    );
    expect(registrationErrorMessage(duplicate)).toBe(
      registrationErrorMessage(internal)
    );
    expect(registrationErrorMessage(duplicate).toLowerCase()).not.toContain(
      "esiste"
    );
  });

  it("mantiene sicuri i messaggi di policy password e rate limit", () => {
    expect(
      registrationErrorMessage(
        new ZitadelApiError(400, 3, "Errors.User.Password.Complexity")
      )
    ).toContain("password");
    expect(registrationErrorMessage(new ZitadelApiError(429, 8, "rate"))).toBe(
      AUTH_ERROR_MESSAGES.rateLimited
    );
  });
});

describe("mappatura errori codici (OTP/TOTP/reset)", () => {
  it("400/404 diventano 'codice non valido'", () => {
    expect(codeErrorMessage(new ZitadelApiError(400, 3, "Errors.User.Code.Invalid"))).toBe(
      AUTH_ERROR_MESSAGES.invalidCode
    );
    expect(codeErrorMessage(new ZitadelApiError(404, 5, "Errors.NotFound"))).toBe(
      AUTH_ERROR_MESSAGES.invalidCode
    );
  });

  it("429 diventa rate limited, lock resta distinto", () => {
    expect(codeErrorMessage(new ZitadelApiError(429, 8, "rate"))).toBe(
      AUTH_ERROR_MESSAGES.rateLimited
    );
    expect(codeErrorMessage(new ZitadelApiError(400, 9, "Errors.User.Locked"))).toBe(
      AUTH_ERROR_MESSAGES.accountLocked
    );
  });
});
