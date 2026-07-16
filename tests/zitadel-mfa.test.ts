import { describe, expect, it } from "vitest";
import { availableMfaMethods, nextLoginStep } from "@/server/zitadel/mfa";
import type { AuthMethodType } from "@/server/zitadel/users";

const NOW = new Date().toISOString();

describe("availableMfaMethods", () => {
  it("filtra e ordina i metodi configurati", () => {
    const methods: AuthMethodType[] = [
      "AUTHENTICATION_METHOD_TYPE_PASSWORD",
      "AUTHENTICATION_METHOD_TYPE_OTP_EMAIL",
      "AUTHENTICATION_METHOD_TYPE_TOTP",
    ];
    expect(availableMfaMethods(methods)).toEqual(["totp", "otpEmail"]);
  });

  it("nessun secondo fattore configurato → lista vuota", () => {
    expect(availableMfaMethods(["AUTHENTICATION_METHOD_TYPE_PASSWORD"])).toEqual([]);
  });
});

describe("nextLoginStep", () => {
  it("password non verificata → passo password", () => {
    expect(
      nextLoginStep({
        factors: { user: { verifiedAt: NOW } },
        authMethods: ["AUTHENTICATION_METHOD_TYPE_PASSWORD"],
        loginSettings: {},
      })
    ).toEqual({ kind: "password" });
  });

  it("password ok e nessuna MFA configurata → done", () => {
    expect(
      nextLoginStep({
        factors: { user: { verifiedAt: NOW }, password: { verifiedAt: NOW } },
        authMethods: ["AUTHENTICATION_METHOD_TYPE_PASSWORD"],
        loginSettings: {},
      })
    ).toEqual({ kind: "done" });
  });

  it("password ok e TOTP configurato → passo MFA", () => {
    expect(
      nextLoginStep({
        factors: { user: { verifiedAt: NOW }, password: { verifiedAt: NOW } },
        authMethods: [
          "AUTHENTICATION_METHOD_TYPE_PASSWORD",
          "AUTHENTICATION_METHOD_TYPE_TOTP",
        ],
        loginSettings: {},
      })
    ).toEqual({ kind: "mfa", methods: ["totp"] });
  });

  it("secondo fattore già verificato → done", () => {
    expect(
      nextLoginStep({
        factors: {
          user: { verifiedAt: NOW },
          password: { verifiedAt: NOW },
          totp: { verifiedAt: NOW },
        },
        authMethods: [
          "AUTHENTICATION_METHOD_TYPE_PASSWORD",
          "AUTHENTICATION_METHOD_TYPE_TOTP",
        ],
        loginSettings: {},
      })
    ).toEqual({ kind: "done" });
  });

  it("passkey con user verification vale come login completo", () => {
    expect(
      nextLoginStep({
        factors: {
          user: { verifiedAt: NOW },
          webAuthN: { verifiedAt: NOW, userVerified: true },
        },
        authMethods: ["AUTHENTICATION_METHOD_TYPE_PASSKEY"],
        loginSettings: { forceMfa: true },
      })
    ).toEqual({ kind: "done" });
  });

  it("forceMfa senza metodi configurati → passo MFA con lista vuota", () => {
    expect(
      nextLoginStep({
        factors: { user: { verifiedAt: NOW }, password: { verifiedAt: NOW } },
        authMethods: ["AUTHENTICATION_METHOD_TYPE_PASSWORD"],
        loginSettings: { forceMfa: true },
      })
    ).toEqual({ kind: "mfa", methods: [] });
  });
});
