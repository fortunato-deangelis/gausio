import { test } from "node:test";
import assert from "node:assert/strict";
import { redact, redactString, isSensitiveKey } from "../redact";

test("isSensitiveKey riconosce chiavi sensibili", () => {
  for (const key of [
    "password",
    "client_secret",
    "accessToken",
    "id_token",
    "Authorization",
    "cookie",
    "PAT",
  ]) {
    assert.equal(isSensitiveKey(key), true, key);
  }
  assert.equal(isSensitiveKey("email"), false);
  assert.equal(isSensitiveKey("name"), false);
  // "pat" è sensibile solo come chiave esatta: "path" non va oscurato.
  assert.equal(isSensitiveKey("path"), false);
  assert.equal(isSensitiveKey("filePath"), false);
});

test("redactString oscura Bearer token e JWT", () => {
  const jwt =
    "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.abcDEF123456789_-xyz";
  assert.equal(redactString(`Bearer ${jwt}`).includes(jwt), false);
  assert.equal(redactString(jwt).includes("eyJhbGci"), false);
});

test("redactString oscura query param sensibili", () => {
  const out = redactString(
    "https://x/callback?code=SECRET123&state=abc&access_token=zzz"
  );
  assert.equal(out.includes("SECRET123"), false);
  assert.equal(out.includes("zzz"), false);
  assert.equal(out.includes("state=abc"), true);
});

test("redact oscura chiavi sensibili annidate", () => {
  const input = {
    email: "a@b.it",
    password: "hunter2",
    nested: { access_token: "tok", ok: "value" },
    list: [{ client_secret: "s" }],
  };
  const out = redact(input) as Record<string, unknown>;
  assert.equal(out.email, "a@b.it");
  assert.equal(out.password, "[REDACTED]");
  assert.deepEqual(out.nested, { access_token: "[REDACTED]", ok: "value" });
  assert.deepEqual(out.list, [{ client_secret: "[REDACTED]" }]);
});

test("redact gestisce riferimenti circolari", () => {
  const a: Record<string, unknown> = { name: "x" };
  a.self = a;
  const out = redact(a) as Record<string, unknown>;
  assert.equal(out.name, "x");
  assert.equal(out.self, "[CIRCULAR]");
});

test("redact riduce gli Error a nome e messaggio redatto", () => {
  const err = new Error("failed with token eyJabcDEFghij123456789");
  const out = redact(err) as { name: string; message: string };
  assert.equal(out.name, "Error");
  assert.equal(out.message.includes("eyJabcDEF"), false);
});
