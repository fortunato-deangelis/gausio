import { beforeEach, describe, expect, it } from "vitest";
import Zitadel from "next-auth/providers/zitadel";
import { safeCallbackUrl } from "@/features/auth/components/auth-url";
import { buildEndSessionUrl } from "@/server/auth/logout";

describe("provider OIDC Zitadel (Auth.js)", () => {
  it("è di tipo oidc: Auth.js applica code flow con PKCE, state e nonce", () => {
    const provider = Zitadel({
      issuer: "https://idp.example.com",
      clientId: "client",
      clientSecret: "secret",
    });
    // Con type "oidc" @auth/core usa authorization code flow e i default
    // checks pkce+state (nonce per OIDC); non è un Credentials provider.
    expect(provider.type).toBe("oidc");
    expect(provider.id).toBe("zitadel");
    expect("authorize" in provider).toBe(false);
  });
});

describe("safeCallbackUrl (redirect post-login)", () => {
  it("accetta solo percorsi interni", () => {
    expect(safeCallbackUrl("/app/contatti")).toBe("/app/contatti");
    expect(safeCallbackUrl("//evil.example")).toBe("/app");
    expect(safeCallbackUrl("https://evil.example")).toBe("/app");
    expect(safeCallbackUrl(undefined)).toBe("/app");
  });
});

describe("logout OIDC (end_session)", () => {
  beforeEach(() => {
    process.env.AUTH_ZITADEL_ISSUER = "https://idp.example.com";
    process.env.AUTH_URL = "https://app.gausio.com";
  });

  it("costruisce la end_session URL con id_token_hint e post_logout_redirect_uri", () => {
    const url = buildEndSessionUrl("id-token-jwt");
    expect(url).not.toBeNull();
    const parsed = new URL(url as string);
    expect(parsed.origin).toBe("https://idp.example.com");
    expect(parsed.pathname).toBe("/oidc/v1/end_session");
    expect(parsed.searchParams.get("id_token_hint")).toBe("id-token-jwt");
    expect(parsed.searchParams.get("post_logout_redirect_uri")).toBe(
      "https://app.gausio.com/"
    );
  });

  it("senza issuer configurato restituisce null (logout solo locale)", () => {
    delete process.env.AUTH_ZITADEL_ISSUER;
    expect(buildEndSessionUrl("id-token-jwt")).toBeNull();
  });
});
