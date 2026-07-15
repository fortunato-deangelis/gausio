import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildAllowedOrigins,
  isSafeRelativePath,
  sanitizeRedirect,
} from "../redirect";

test("isSafeRelativePath accetta path interni", () => {
  assert.equal(isSafeRelativePath("/app"), true);
  assert.equal(isSafeRelativePath("/app/vendite?x=1"), true);
});

test("isSafeRelativePath blocca protocol-relative e backslash", () => {
  assert.equal(isSafeRelativePath("//evil.com"), false);
  assert.equal(isSafeRelativePath("/\\evil.com"), false);
  assert.equal(isSafeRelativePath("https://evil.com"), false);
  assert.equal(isSafeRelativePath(""), false);
});

test("isSafeRelativePath blocca caratteri di controllo (CRLF injection)", () => {
  assert.equal(isSafeRelativePath("/app\r\nSet-Cookie: x=1"), false);
});

test("sanitizeRedirect ritorna il fallback per input non sicuri", () => {
  assert.equal(sanitizeRedirect("//evil.com"), "/app");
  assert.equal(sanitizeRedirect("https://evil.com"), "/app");
  assert.equal(sanitizeRedirect(undefined), "/app");
  assert.equal(sanitizeRedirect(null), "/app");
  assert.equal(sanitizeRedirect("javascript:alert(1)"), "/app");
});

test("sanitizeRedirect preserva path relativi sicuri", () => {
  assert.equal(sanitizeRedirect("/app/contatti"), "/app/contatti");
});

test("sanitizeRedirect consente solo origin in allowlist", () => {
  const allowedOrigins = buildAllowedOrigins({
    APP_BASE_URL: "https://app.example.com",
  });
  assert.equal(
    sanitizeRedirect("https://app.example.com/app", { allowedOrigins }),
    "https://app.example.com/app"
  );
  assert.equal(
    sanitizeRedirect("https://evil.com/app", { allowedOrigins }),
    "/app"
  );
});

test("buildAllowedOrigins ignora valori malformati", () => {
  const origins = buildAllowedOrigins({
    APP_BASE_URL: "not a url",
    AUTH_URL: "https://a.example.com",
  });
  assert.equal(origins.has("https://a.example.com"), true);
  assert.equal(origins.size, 1);
});
