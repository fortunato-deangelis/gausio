# Deployment

The two apps deploy **independently**. The Main App keeps its existing
deployment untouched; the Login App is a separate deployable.

## Main App

- Standard Next.js 16 build: `npm run build` / `npm start`.
- Required env in production: `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`,
  `NEXT_PUBLIC_SITE_URL`, and the `AUTH_ZITADEL_*` trio for OIDC.
- **Do not** set `AUTH_DEV_LOGIN=true` in production.
- Set `APP_BASE_URL` (or rely on `AUTH_URL`) so federated-logout redirects are
  absolute and registered in ZITADEL.
- Security headers (incl. HSTS) are emitted from `next.config.ts`; ensure TLS is
  terminated in front of the app.

### Health checks

Point your platform's health probe at:

- Liveness: `GET /api/health/live`
- Readiness: `GET /api/health/ready` (200 only when config + ZITADEL reachable)

## Login App

- Build/run from `zitadel-login/`: `npm run build` / `npm start` (serves on the
  `/ui/v2/login` base path, port 3001 by default).
- Required env: `ZITADEL_API_URL`, `ZITADEL_SERVICE_USER_TOKEN`.
- Health probe: `GET /ui/v2/login/api/health`.
- Before the first real deploy, **vendor the upstream app** and build from the
  vendored sources — see [UPSTREAM.md](../zitadel-login/UPSTREAM.md).

## Routing / DNS

Typical layout:

- `https://app.<domain>` → Main App
- `https://login.<domain>/ui/v2/login` → Login App
- ZITADEL issuer on its own host (cloud or self-hosted).

If you front everything behind one host, route `/ui/v2/login/*` to the Login App
and everything else to the Main App. Keep OIDC callback and post-logout URIs in
ZITADEL in sync with the chosen hostnames.

## Rollout checklist

1. Migrate the database.
2. Deploy the Main App; verify `/api/health/ready` is green.
3. Deploy the Login App; verify its `/api/health`.
4. Register redirect + post-logout URIs in ZITADEL.
5. If using it, set `ZITADEL_LOGIN_BASE_URL` and flip the ZITADEL custom login
   base URL.
6. Smoke-test login and logout end-to-end (see [TEST_PLAN.md](./TEST_PLAN.md)).
