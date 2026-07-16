import { describe, expect, it } from "vitest";
import {
  credentialsSchema,
  forgotPasswordSchema,
  mfaCodeSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/features/auth/schema";

describe("credentialsSchema", () => {
  it("normalizza l'email (trim + lowercase)", () => {
    const parsed = credentialsSchema.parse({
      authRequest: "V2_123",
      email: "  Mario@Azienda.IT ",
      password: "x",
    });
    expect(parsed.email).toBe("mario@azienda.it");
    expect(parsed.authRequest).toBe("V2_123");
  });

  it("l'auth request è opzionale (form-first) ma se presente deve essere valida", () => {
    const withoutRequest = credentialsSchema.parse({
      authRequest: "",
      email: "a@b.it",
      password: "x",
    });
    expect(withoutRequest.authRequest).toBeUndefined();
    expect(
      credentialsSchema.safeParse({
        authRequest: "https://evil.example",
        email: "a@b.it",
        password: "x",
      }).success
    ).toBe(false);
  });

  it("normalizza redirectTo su /app se non è un path interno sicuro", () => {
    const external = credentialsSchema.parse({
      authRequest: "",
      email: "a@b.it",
      password: "x",
      redirectTo: "https://evil.example",
    });
    expect(external.redirectTo).toBe("/app");
    const doubleSlash = credentialsSchema.parse({
      authRequest: "",
      email: "a@b.it",
      password: "x",
      redirectTo: "//evil.example",
    });
    expect(doubleSlash.redirectTo).toBe("/app");
    const internal = credentialsSchema.parse({
      authRequest: "",
      email: "a@b.it",
      password: "x",
      redirectTo: "/app/contatti",
    });
    expect(internal.redirectTo).toBe("/app/contatti");
  });

  it("rifiuta email non valide e password vuote", () => {
    expect(
      credentialsSchema.safeParse({ authRequest: "V2_1", email: "no", password: "x" })
        .success
    ).toBe(false);
    expect(
      credentialsSchema.safeParse({ authRequest: "V2_1", email: "a@b.it", password: "" })
        .success
    ).toBe(false);
  });
});

describe("mfaCodeSchema", () => {
  it("accetta solo codici numerici 6-8 cifre e metodi noti", () => {
    expect(mfaCodeSchema.safeParse({ method: "totp", code: "123456" }).success).toBe(true);
    expect(mfaCodeSchema.safeParse({ method: "otpEmail", code: "12345678" }).success).toBe(
      true
    );
    expect(mfaCodeSchema.safeParse({ method: "totp", code: "12345" }).success).toBe(false);
    expect(mfaCodeSchema.safeParse({ method: "totp", code: "abcdef" }).success).toBe(false);
    expect(mfaCodeSchema.safeParse({ method: "webAuthN", code: "123456" }).success).toBe(
      false
    );
  });
});

describe("registerSchema", () => {
  const base = {
    authRequest: "V2_1",
    givenName: "Mario",
    familyName: "Rossi",
    email: "mario@azienda.it",
    password: "Secret123!",
    passwordConfirm: "Secret123!",
  };

  it("richiede l'accettazione dei termini", () => {
    expect(registerSchema.safeParse({ ...base, termsAccepted: true }).success).toBe(true);
    expect(registerSchema.safeParse({ ...base, termsAccepted: undefined }).success).toBe(
      false
    );
    expect(registerSchema.safeParse({ ...base, termsAccepted: false }).success).toBe(false);
  });

  it("richiede che password e conferma coincidano", () => {
    expect(
      registerSchema.safeParse({
        ...base,
        passwordConfirm: "Diversa123!",
        termsAccepted: true,
      }).success
    ).toBe(false);
  });

  it("applica il minimo prudenziale sulla password", () => {
    expect(
      registerSchema.safeParse({
        ...base,
        password: "corta",
        passwordConfirm: "corta",
        termsAccepted: true,
      }).success
    ).toBe(false);
  });
});

describe("reset/forgot password schema", () => {
  it("forgot richiede una email valida", () => {
    expect(forgotPasswordSchema.safeParse({ email: "a@b.it" }).success).toBe(true);
    expect(forgotPasswordSchema.safeParse({ email: "x" }).success).toBe(false);
  });

  it("reset richiede userId, codice, nuova password e conferma", () => {
    const valid = {
      userId: "u1",
      code: "C1",
      password: "Secret123!",
      passwordConfirm: "Secret123!",
    };
    expect(resetPasswordSchema.safeParse(valid).success).toBe(true);
    expect(resetPasswordSchema.safeParse({ ...valid, userId: "" }).success).toBe(false);
    expect(resetPasswordSchema.safeParse({ ...valid, code: "" }).success).toBe(false);
    expect(
      resetPasswordSchema.safeParse({ ...valid, passwordConfirm: "Diversa123!" }).success
    ).toBe(false);
  });
});
