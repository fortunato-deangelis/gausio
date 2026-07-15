# Local development

## Prerequisites

- Node.js 20+ (Node 22 recommended)
- npm (the Main App uses `package-lock.json`)
- A local or remote PostgreSQL database

## Main App

```bash
# 1. install
npm install

# 2. env
cp .env.example .env.local
#    - set DATABASE_URL
#    - set AUTH_SECRET  (npx auth secret)
#    - leave the ZITADEL vars empty to use the dev login
#    - keep AUTH_DEV_LOGIN=true for local-only credential login

# 3. run
npm run dev            # http://localhost:3000
```

### Dev login vs ZITADEL

- With the `AUTH_ZITADEL_*` vars **empty**, the OIDC provider is not registered
  and you sign in with the **dev login** (`AUTH_DEV_LOGIN=true`). This is for
  local development only.
- To test the real OIDC flow locally, fill in the ZITADEL vars and add
  `http://localhost:3000/api/auth/callback/zitadel` as a redirect URI in
  ZITADEL. See [ZITADEL_CONFIGURATION.md](./ZITADEL_CONFIGURATION.md).

### Useful scripts

```bash
npm run typecheck      # tsc --noEmit
npm test               # unit tests (security utils)
npm run lint
```

## Login App

```bash
cd zitadel-login
npm install
cp .env.example .env.local   # set ZITADEL_API_URL + ZITADEL_SERVICE_USER_TOKEN
npm run dev                  # http://localhost:3001/ui/v2/login

npm test                     # unit tests (health + oidc-proxy helpers)
```

The Login App scaffold shows a placeholder page until you vendor the upstream
ZITADEL Login UI v2 — see [UPSTREAM.md](../zitadel-login/UPSTREAM.md).

## Running both together

Main App on `:3000`, Login App on `:3001`. To exercise the custom login base URL
locally, set in the Main App `.env.local`:

```
ZITADEL_LOGIN_BASE_URL=http://localhost:3001/ui/v2/login
```

(Requires a vendored, functioning Login App and a matching ZITADEL config.)
