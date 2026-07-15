import { test } from "node:test";
import assert from "node:assert/strict";
import { checkLoginHealth } from "../health.ts";

test("degraded when config is missing", async () => {
  const report = await checkLoginHealth({});
  assert.equal(report.status, "degraded");
  assert.equal(report.config.zitadelApiUrlConfigured, false);
  assert.equal(report.config.serviceUserTokenConfigured, false);
  assert.equal(report.checks.zitadelApiReachable, "skipped");
});

test("never leaks the token value", async () => {
  const report = await checkLoginHealth({
    ZITADEL_SERVICE_USER_TOKEN: "super-secret-token",
  });
  const serialized = JSON.stringify(report);
  assert.equal(serialized.includes("super-secret-token"), false);
  assert.equal(report.config.serviceUserTokenConfigured, true);
});

test("degraded (not error) when token set but api url missing", async () => {
  const report = await checkLoginHealth({
    ZITADEL_SERVICE_USER_TOKEN: "t",
  });
  assert.equal(report.config.zitadelApiUrlConfigured, false);
  assert.equal(report.status, "degraded");
});
