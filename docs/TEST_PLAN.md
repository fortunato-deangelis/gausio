# Test plan

## Automated unit tests

Run from the repo root:

```bash
npm test
```

Covers (`src/server/security/__tests__/`):

- **redirect.test.ts** — open-redirect protection: same-origin allow,
  protocol-relative/backslash/absolute reject, allowlist enforcement, fallback.
- **redact.test.ts** — secret redaction: masked keys, nested objects, JWT/bearer
  substrings, and the invariant that no known secret value survives
  serialization.
- **config.test.ts** — issuer/endpoint derivation, `isZitadelConfigured`, and
  `buildEndSessionUrl` (id_token_hint vs client_id + post_logout_redirect_uri,
  and the undefined path when unconfigured).

Login App (`cd zitadel-login && npm test`):

- **health.test.ts** — degraded vs error vs ok states, and the no-token-leak
  invariant.
- **oidc-proxy.test.ts** — forwardable path detection and upstream URL building.

## Manual / smoke tests

### Login (dev)

1. `AUTH_DEV_LOGIN=true`, ZITADEL vars empty.
2. Visit `/app` → redirected to `/sign-in?callbackUrl=/app`.
3. Sign in with dev login → land on `/app`.
4. Tamper `callbackUrl=https://evil.com` → after login you land on `/app`, not
   the external site.

### Login (OIDC)

1. Configure ZITADEL + `AUTH_ZITADEL_*`.
2. `/sign-in` → "continue with ZITADEL" → complete flow → session cookie set.
3. Inspect the session in the browser: it contains **no** access/id token.

### Logout (federated)

1. While signed in via ZITADEL, trigger sign-out.
2. Local cookie cleared, browser hits ZITADEL `end_session`, returns to `/`.
3. Revisiting `/app` requires login again.

### Health

- `curl -sS localhost:3000/api/health/live` → 200.
- `curl -sS localhost:3000/api/health/ready` → 200 when configured; 503 when
  ZITADEL unreachable.
- `curl -sS localhost:3000/api/health` → JSON with booleans only (grep the
  output to confirm no token values appear).

### Security headers

```bash
curl -sSI localhost:3000/ | grep -iE 'x-frame-options|content-security-policy|x-content-type-options|referrer-policy'
```

## CI recommendation

Run `npm run typecheck`, `npm run lint`, and `npm test` for the Main App, and
`npm test` in `zitadel-login/`, on every PR.
