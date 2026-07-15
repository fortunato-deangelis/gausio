import { test } from "node:test";
import assert from "node:assert/strict";
import { isForwardablePath, buildUpstreamUrl } from "../oidc-proxy.ts";

test("recognizes OIDC protocol paths", () => {
  assert.equal(isForwardablePath("/.well-known/openid-configuration"), true);
  assert.equal(isForwardablePath("/oauth/v2/token"), true);
  assert.equal(isForwardablePath("/oidc/v1/userinfo"), true);
});

test("does not forward interactive UI paths", () => {
  assert.equal(isForwardablePath("/ui/v2/login/loginname"), false);
  assert.equal(isForwardablePath("/"), false);
  assert.equal(isForwardablePath("/api/health"), false);
});

test("builds upstream url preserving path and query", () => {
  const out = buildUpstreamUrl(
    "https://login.example.com/oauth/v2/authorize?client_id=abc&scope=openid",
    "https://instance.zitadel.cloud/"
  );
  assert.equal(
    out,
    "https://instance.zitadel.cloud/oauth/v2/authorize?client_id=abc&scope=openid"
  );
});

test("returns null when api base url missing or invalid", () => {
  assert.equal(buildUpstreamUrl("https://x/oauth/v2/token", undefined), null);
  assert.equal(buildUpstreamUrl("not-a-url", "https://api"), null);
});
