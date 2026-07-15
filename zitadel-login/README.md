# ZITADEL Login App (sibling scaffold)

This folder is a **sibling application** to the Gausio Main App. It is a
scaffold that **tracks the upstream [ZITADEL Login UI v2](https://github.com/zitadel/typescript)**
(the `@zitadel/login` Next.js app) and is intended to serve the interactive
login flows behind the Main App's custom login base URL.

> It lives next to the Main App (not as a monorepo package) so the Main App's
> existing build, tooling, and deployment are untouched. It is excluded from the
> Main App's TypeScript program.

## What's here

```
zitadel-login/
├─ app/                     # Next.js scaffold (placeholder page + health API)
│  ├─ layout.tsx
│  ├─ page.tsx              # scaffold landing (no real auth yet)
│  └─ api/health/route.ts   # health probe
├─ lib/
│  ├─ health.ts             # health reporting (no secret leakage)
│  ├─ oidc-proxy.ts         # pure helpers to forward OIDC protocol paths
│  └─ __tests__/            # unit tests
├─ scripts/upstream.mjs     # fork tracking (check / vendor / diff)
├─ upstream.json            # pinned upstream ref + last vendored commit
├─ next.config.mjs          # base path /ui/v2/login + security headers
└─ .env.example             # ZITADEL_API_URL, ZITADEL_SERVICE_USER_TOKEN
```

The real login UI is **not** committed here — it is vendored on demand from
upstream. See [UPSTREAM.md](./UPSTREAM.md).

## Quick start

```bash
npm install
cp .env.example .env.local     # set ZITADEL_API_URL + ZITADEL_SERVICE_USER_TOKEN
npm run dev                    # http://localhost:3001/ui/v2/login
npm test                       # unit tests
```

## Upstream tracking

```bash
npm run upstream:check         # is upstream ahead of our pin?
npm run upstream:diff          # commits since the pinned SHA
npm run upstream:vendor        # git-subtree pull into vendor/ and update the pin
```

## Health

`GET /ui/v2/login/api/health` returns process info plus booleans indicating
whether `ZITADEL_API_URL` and `ZITADEL_SERVICE_USER_TOKEN` are configured and
whether the ZITADEL API is reachable. It never returns secret values.

## Related docs

- [../docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md)
- [../docs/APP_LOGIN_COMMUNICATION.md](../docs/APP_LOGIN_COMMUNICATION.md)
- [UPSTREAM.md](./UPSTREAM.md)
