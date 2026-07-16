import { describe, expect, it } from "vitest";
import nextConfig, { buildContentSecurityPolicy } from "../next.config";

describe("header di sicurezza (next.config.ts)", () => {
  it("applica CSP, Referrer-Policy, nosniff, Permissions-Policy e HSTS a tutte le rotte", async () => {
    const rules = await nextConfig.headers?.();
    expect(rules).toBeDefined();
    const all = rules?.find((r) => r.source === "/:path*");
    expect(all).toBeDefined();
    const byKey = Object.fromEntries(all!.headers.map((h) => [h.key, h.value]));

    expect(byKey["Content-Security-Policy"]).toContain("default-src 'self'");
    expect(byKey["Content-Security-Policy"]).toContain("frame-ancestors 'none'");
    expect(byKey["Content-Security-Policy"]).toContain("connect-src 'self'");
    expect(byKey["Content-Security-Policy"]).toContain("form-action 'self'");
    expect(byKey["Content-Security-Policy"]).toContain("object-src 'none'");
    expect(byKey["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(byKey["X-Content-Type-Options"]).toBe("nosniff");
    expect(byKey["Permissions-Policy"]).toContain("camera=()");
    expect(byKey["Strict-Transport-Security"]).toContain("max-age=");
  });

  it("consente eval solo in sviluppo per gli strumenti diagnostici di React", () => {
    expect(buildContentSecurityPolicy("development")).toContain("'unsafe-eval'");
    expect(buildContentSecurityPolicy("production")).not.toContain("'unsafe-eval'");
    expect(buildContentSecurityPolicy("production")).toContain(
      "upgrade-insecure-requests"
    );
    expect(buildContentSecurityPolicy("development")).not.toContain(
      "upgrade-insecure-requests"
    );
  });

  it("non invia referrer e non conserva le pagine con token o codici", async () => {
    const rules = await nextConfig.headers?.();
    for (const source of ["/reset-password", "/verify-email", "/invito/:path*"]) {
      const rule = rules?.find((candidate) => candidate.source === source);
      const byKey = Object.fromEntries(
        (rule?.headers ?? []).map((header) => [header.key, header.value])
      );
      expect(byKey["Referrer-Policy"]).toBe("no-referrer");
      expect(byKey["Cache-Control"]).toContain("no-store");
    }
  });
});
