import { describe, expect, it } from "vitest";
import {
  describePasswordPolicy,
  passwordMeetsPolicy,
} from "@/server/zitadel/settings";

describe("passwordMeetsPolicy", () => {
  const policy = {
    minLength: "10",
    requiresUppercase: true,
    requiresLowercase: true,
    requiresNumber: true,
    requiresSymbol: true,
  };

  it("accetta una password conforme", () => {
    expect(passwordMeetsPolicy("Abcdef123!", policy)).toBe(true);
  });

  it("rifiuta violazioni singole", () => {
    expect(passwordMeetsPolicy("Ab1!", policy)).toBe(false); // corta
    expect(passwordMeetsPolicy("abcdef123!", policy)).toBe(false); // no maiuscola
    expect(passwordMeetsPolicy("ABCDEF123!", policy)).toBe(false); // no minuscola
    expect(passwordMeetsPolicy("Abcdefghi!", policy)).toBe(false); // no numero
    expect(passwordMeetsPolicy("Abcdef1234", policy)).toBe(false); // no simbolo
  });

  it("usa default prudenti se la policy è vuota", () => {
    expect(passwordMeetsPolicy("1234567", {})).toBe(false);
    expect(passwordMeetsPolicy("12345678", {})).toBe(true);
  });
});

describe("describePasswordPolicy", () => {
  it("descrive i requisiti in italiano", () => {
    const text = describePasswordPolicy({
      minLength: 12,
      requiresUppercase: true,
      requiresNumber: true,
    });
    expect(text).toContain("12 caratteri");
    expect(text).toContain("una maiuscola");
    expect(text).toContain("un numero");
    expect(text).not.toContain("simbolo");
  });
});
