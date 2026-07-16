# Security

## Token & session handling

- **Session type:** stateless JWT in an httpOnly, SameSite cookie (Auth.js v5).
- **No tokens to the client:** `session` exposes only the internal user id. The
  ZITADEL `id_token` is confined to the encrypted server-side JWT
  (`zitadelIdToken`) and never sent to the client. It is kept so it can be used
  as `id_token_hint` at logout in the future; the current logout implementation
  uses `client_id` + a registered `post_logout_redirect_uri` instead (see
  [APP_LOGIN_COMMUNICATION.md](./APP_LOGIN_COMMUNICATION.md)).
- **PKCE:** Authorization Code Flow with PKCE is enforced by the provider.
- **AUTH_SECRET:** required in every non-dev environment. Generate with
  `npx auth secret`. The dev-only credentials provider is gated behind
  `AUTH_DEV_LOGIN=true` and must never be enabled in production.

## Open-redirect protection

All post-login/post-logout redirects flow through
[`sanitizeRedirect`](../src/server/security/redirect.ts):

- only **same-origin, path-relative** targets are allowed (must start with a
  single `/`);
- protocol-relative (`//evil.com`), backslash tricks (`/\evil.com`), control
  characters (CRLF injection), and absolute URLs are rejected and replaced with
  a safe fallback (`/app`);
- absolute URLs are allowed only when their **origin** is in the allowlist
  built from the known env vars (`buildAllowedOrigins`); no wildcards.

Covered by unit tests in
[`src/server/security/__tests__/redirect.test.ts`](../src/server/security/__tests__/redirect.test.ts).

## Log redaction

[`redact` / `redactString`](../src/server/security/redact.ts) scrub sensitive
material before anything is logged:

- known secret-ish keys (`token`, `secret`, `password`, `authorization`,
  `client_secret`, `id_token`, `access_token`, `code`, `cookie`, …) are masked
  in objects (recursively);
- JWT-shaped and bearer-token-shaped substrings in free-form strings are masked;
- the `logger` wrapper in [`log.ts`](../src/server/security/log.ts) applies this
  to every argument.

Covered by [`redact.test.ts`](../src/server/security/__tests__/redact.test.ts).

## HTTP security headers

Set globally in [`next.config.ts`](../next.config.ts):

| Header | Value | Why |
| ------ | ----- | --- |
| `X-Frame-Options` | `DENY` | anti-clickjacking |
| `Content-Security-Policy` | `frame-ancestors 'none'` | anti-clickjacking (modern) |
| `X-Content-Type-Options` | `nosniff` | block MIME sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | limit referrer leakage |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | force HTTPS (production builds only) |
| `Permissions-Policy` | restrictive | disable unused browser features |

The CSP allows `'unsafe-eval'` only in development (React Refresh); production
builds omit it.

The Login App applies the same anti-framing headers in
[`zitadel-login/next.config.mjs`](../zitadel-login/next.config.mjs).

## Federated logout

Logout clears the local session first, then redirects to the ZITADEL
`end_session_endpoint`. `post_logout_redirect_uri` values must be registered in
ZITADEL (no wildcards). See
[APP_LOGIN_COMMUNICATION.md](./APP_LOGIN_COMMUNICATION.md).

## Secret handling checklist

- Never log tokens, secrets, or full cookies — rely on `logger`.
- Never place tokens in `session` or any client-visible payload.
- Health endpoints report booleans about config presence, never values.
- Keep `AUTH_DEV_LOGIN` unset/false outside local development.

## Reporting

Report suspected vulnerabilities privately to the maintainers; do not open
public issues for security reports.
