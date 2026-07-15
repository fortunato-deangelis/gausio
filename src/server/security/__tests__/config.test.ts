import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildEndSessionUrl,
  getLoginBaseUrl,
  getOidcEndpoints,
} from "../config";

const ENV = {
  AUTH_ZITADEL_ISSUER: "https://instance.zitadel.cloud",
  AUTH_ZITADEL_ID: "client-123",
  ZITADEL_LOGIN_BASE_URL: "https://login.example.com/",
  APP_BASE_URL: "https://app.example.com",
};

test("getLoginBaseUrl normalizza lo slash finale", () => {
  assert.equal(getLoginBaseUrl(ENV), "https://login.example.com");
  assert.equal(getLoginBaseUrl({}), undefined);
});

test("getOidcEndpoints instrada authorize verso la Login App quando presente", () => {
  const endpoints = getOidcEndpoints(ENV);
  assert.equal(
    endpoints.authorization,
    "https://login.example.com/oauth/v2/authorize"
  );
  // token/end_session restano sull'issuer.
  assert.equal(
    endpoints.endSession,
    "https://instance.zitadel.cloud/oidc/v1/end_session"
  );
});

test("getOidcEndpoints usa l'issuer se la Login App non è configurata", () => {
  const endpoints = getOidcEndpoints({
    AUTH_ZITADEL_ISSUER: ENV.AUTH_ZITADEL_ISSUER,
    AUTH_ZITADEL_ID: ENV.AUTH_ZITADEL_ID,
  });
  assert.equal(
    endpoints.authorization,
    "https://instance.zitadel.cloud/oauth/v2/authorize"
  );
});

test("getOidcEndpoints è vuoto senza issuer", () => {
  assert.deepEqual(getOidcEndpoints({}), {});
});

test("buildEndSessionUrl usa client_id e post_logout_redirect_uri", () => {
  const url = new URL(buildEndSessionUrl({ env: ENV })!);
  assert.equal(url.origin + url.pathname, "https://instance.zitadel.cloud/oidc/v1/end_session");
  assert.equal(url.searchParams.get("client_id"), "client-123");
  assert.equal(
    url.searchParams.get("post_logout_redirect_uri"),
    "https://app.example.com/"
  );
  assert.equal(url.searchParams.has("id_token_hint"), false);
});

test("buildEndSessionUrl preferisce id_token_hint quando disponibile", () => {
  const url = new URL(
    buildEndSessionUrl({ env: ENV, idTokenHint: "the-id-token" })!
  );
  assert.equal(url.searchParams.get("id_token_hint"), "the-id-token");
  assert.equal(url.searchParams.has("client_id"), false);
});

test("buildEndSessionUrl è undefined senza ZITADEL", () => {
  assert.equal(buildEndSessionUrl({ env: {} }), undefined);
});
