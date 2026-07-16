import { beforeEach, describe, expect, it } from "vitest";
import {
  checkRateLimit,
  isAllowedCallbackUrl,
  isExpectedAuthRequest,
  isSafeInternalPath,
  resetRateLimits,
  RATE_LIMITS,
} from "@/server/zitadel/security";

describe("rate limiting", () => {
  beforeEach(() => resetRateLimits());

  it("consente fino al limite e poi blocca", () => {
    const rule = { limit: 3, windowMs: 60_000 };
    expect(checkRateLimit("k", rule)).toBe(true);
    expect(checkRateLimit("k", rule)).toBe(true);
    expect(checkRateLimit("k", rule)).toBe(true);
    expect(checkRateLimit("k", rule)).toBe(false);
  });

  it("chiavi diverse hanno contatori indipendenti", () => {
    const rule = { limit: 1, windowMs: 60_000 };
    expect(checkRateLimit("a", rule)).toBe(true);
    expect(checkRateLimit("b", rule)).toBe(true);
    expect(checkRateLimit("a", rule)).toBe(false);
  });

  it("la finestra scorre: i tentativi vecchi non contano", () => {
    const rule = { limit: 2, windowMs: 1_000 };
    const t0 = 1_000_000;
    expect(checkRateLimit("k", rule, t0)).toBe(true);
    expect(checkRateLimit("k", rule, t0 + 10)).toBe(true);
    expect(checkRateLimit("k", rule, t0 + 20)).toBe(false);
    expect(checkRateLimit("k", rule, t0 + 2_000)).toBe(true);
  });

  it("le regole predefinite esistono e sono ragionevoli", () => {
    expect(RATE_LIMITS.credentials.limit).toBeGreaterThan(0);
    expect(RATE_LIMITS.email.limit).toBeLessThanOrEqual(RATE_LIMITS.credentials.limit);
  });
});

describe("associazione auth request al flusso", () => {
  it("richiede lo stesso request id per un flusso esterno", () => {
    expect(
      isExpectedAuthRequest(
        "V2_expected",
        "V2_expected",
        "https://client.example/callback",
        "https://app.gausio.com"
      )
    ).toBe(true);
    expect(
      isExpectedAuthRequest(
        "V2_attacker",
        "V2_expected",
        "https://app.gausio.com/api/auth/callback/zitadel",
        "https://app.gausio.com"
      )
    ).toBe(false);
  });

  it("per il flusso interno accetta solo redirect verso l'origin dell'app", () => {
    expect(
      isExpectedAuthRequest(
        "V2_internal",
        undefined,
        "https://app.gausio.com/api/auth/callback/zitadel",
        "https://app.gausio.com"
      )
    ).toBe(true);
    expect(
      isExpectedAuthRequest(
        "V2_foreign",
        undefined,
        "https://evil.example/callback",
        "https://app.gausio.com"
      )
    ).toBe(false);
  });
});

describe("isSafeInternalPath (anti open-redirect)", () => {
  it("accetta solo path relativi interni", () => {
    expect(isSafeInternalPath("/app")).toBe(true);
    expect(isSafeInternalPath("/app/contatti?x=1")).toBe(true);
  });

  it("rifiuta destinazioni esterne o ambigue", () => {
    expect(isSafeInternalPath("//evil.example")).toBe(false);
    expect(isSafeInternalPath("https://evil.example")).toBe(false);
    expect(isSafeInternalPath("javascript:alert(1)")).toBe(false);
    expect(isSafeInternalPath("/app\\..\\x")).toBe(false);
    expect(isSafeInternalPath("")).toBe(false);
    expect(isSafeInternalPath(undefined)).toBe(false);
    expect(isSafeInternalPath(null)).toBe(false);
  });
});

describe("isAllowedCallbackUrl", () => {
  const allowed = ["https://app.gausio.com"];

  it("accetta la callback verso l'origin registrata", () => {
    expect(
      isAllowedCallbackUrl(
        "https://app.gausio.com/api/auth/callback/zitadel?code=x&state=y",
        allowed
      )
    ).toBe(true);
  });

  it("rifiuta origin diverse, schemi non http(s) e URL malformate", () => {
    expect(isAllowedCallbackUrl("https://evil.example/cb?code=x", allowed)).toBe(false);
    expect(isAllowedCallbackUrl("https://app.gausio.com.evil.example/cb", allowed)).toBe(false);
    expect(isAllowedCallbackUrl("javascript:alert(1)", allowed)).toBe(false);
    expect(isAllowedCallbackUrl("not-a-url", allowed)).toBe(false);
    expect(isAllowedCallbackUrl("//app.gausio.com/cb", allowed)).toBe(false);
  });
});
