# Deployment

The two apps deploy **independently**. The Main App keeps its existing
deployment untouched; the Login App is a separate deployable.

The current target platform is **Vercel** — see
[Deploying on Vercel](#deploying-on-vercel) below. The generic sections apply
to any Node/container host.

## Main App

- Standard Next.js 16 build: `npm run build` / `npm start`.
- Required env in production: `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`,
  `NEXT_PUBLIC_SITE_URL`, and the `AUTH_ZITADEL_*` trio for OIDC.
- **Do not** set `AUTH_DEV_LOGIN=true` in production.
- Set `APP_BASE_URL` (or rely on `AUTH_URL`) so federated-logout redirects are
  absolute and registered in ZITADEL.
- Security headers (incl. HSTS, production builds only) are emitted from
  `next.config.ts`; ensure TLS is terminated in front of the app.

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

## Deploying on Vercel

Create **two Vercel projects** from the same repository:

| Project | Root Directory | Domain (example) |
| ------- | -------------- | ---------------- |
| Main App | `/` (repo root) | `app.<domain>` |
| Login App | `zitadel-login` | `login.<domain>` (serves under `/ui/v2/login`) |

Framework preset **Next.js**, default build command (`next build`) for both.

### End-to-end walkthrough (ZITADEL → Vercel → self-hosted login)

Follow the phases in order. After **Phase B** the app is live with ZITADEL's
hosted login; **Phases C–D** switch it to the self-hosted Login App so the
login form runs inside our own deployment and its UI/UX can be customized.

#### Phase A — ZITADEL: create the app and collect the values

Full console details in
[ZITADEL_CONFIGURATION.md](./ZITADEL_CONFIGURATION.md); condensed:

1. Console → **Projects → (project) → Applications → New**:
   type **Web**, authentication method **Code** (confidential — *not* the
   "PKCE" public type, the Main App needs the client secret).
2. **Redirect URIs**:
   - `https://app.<domain>/api/auth/callback/zitadel`
   - `http://localhost:3000/api/auth/callback/zitadel` (enable *Development
     Mode* on the app for `http://`).
3. **Post logout redirect URIs**: `https://app.<domain>/` and
   `http://localhost:3000/`.
4. On creation, copy **Client ID** and **Client Secret** (shown once).
5. For the Login App: Console → **Users → Service Users → New** (machine
   user), grant it **IAM_LOGIN_CLIENT** (Instance → Managers), then open the
   user → **Personal Access Tokens → New** and copy the PAT once.

Values collected in this phase:

| Value | Becomes |
| ----- | ------- |
| Instance URL, e.g. `https://<instance>.zitadel.cloud` | `AUTH_ZITADEL_ISSUER` (Main App), `ZITADEL_API_URL` (Login App) |
| Client ID | `AUTH_ZITADEL_ID` |
| Client Secret | `AUTH_ZITADEL_SECRET` |
| Service-user PAT | `ZITADEL_SERVICE_USER_TOKEN` (Login App) |

#### Phase B — Main App on Vercel

1. Vercel → **Add New → Project** → import this repository. Root Directory
   `/` (default), framework preset **Next.js**.
2. **Settings → Environment Variables**, environment *Production*
   (mark secrets as *Sensitive*):

   | Variable | Value |
   | -------- | ----- |
   | `DATABASE_URL` | **Pooled** Postgres connection string (see [Main App on Vercel](#main-app-on-vercel)) |
   | `AUTH_SECRET` | Output of `npx auth secret` (fresh, not the dev value) |
   | `AUTH_URL` | `https://app.<domain>` |
   | `NEXT_PUBLIC_SITE_URL` | `https://app.<domain>` |
   | `APP_BASE_URL` | `https://app.<domain>` |
   | `AUTH_ZITADEL_ISSUER` | Instance URL from Phase A |
   | `AUTH_ZITADEL_ID` | Client ID from Phase A |
   | `AUTH_ZITADEL_SECRET` | Client Secret from Phase A |

   Do **not** set `AUTH_DEV_LOGIN` or `ZITADEL_LOGIN_BASE_URL` yet.
3. Run the migrations against the production database (Vercel never does):
   `npx drizzle-kit migrate` locally/from CI with `DATABASE_URL` pointing at
   the production DB (prefer the *direct*, non-pooled URL for DDL).
4. Deploy, then assign the domain `app.<domain>` (Project → Settings →
   Domains). If the domain differs from what you registered in Phase A,
   update the ZITADEL redirect/post-logout URIs now.
5. Verify: `GET https://app.<domain>/api/health/ready` returns `200` with
   `"zitadel": "ok"`, and a full sign-in/sign-out round-trip works (users land
   on ZITADEL's **hosted** login at this stage — expected).

#### Phase C — Login App scaffold on Vercel

1. Vercel → **Add New → Project** → import the **same repository** again.
   Set **Root Directory = `zitadel-login`**, framework preset **Next.js**.
2. Environment variables (*Production*, mark the token as *Sensitive*):

   | Variable | Value |
   | -------- | ----- |
   | `ZITADEL_API_URL` | Instance URL from Phase A (no trailing slash) |
   | `ZITADEL_SERVICE_USER_TOKEN` | Service-user PAT from Phase A |

3. Deploy and assign the domain `login.<domain>`.
4. Verify: `GET https://login.<domain>/ui/v2/login/api/health` returns `200`
   with `zitadelApiUrlConfigured`, `serviceUserTokenConfigured` and
   `zitadelApiReachable` all true, and
   `https://login.<domain>/ui/v2/login` shows the scaffold placeholder page.

At this point the scaffold is deployed but **login still goes through
ZITADEL's hosted page** — the scaffold has no login flows yet.

#### Phase D — switch to the self-hosted login form

1. **Vendor the upstream Login UI v2** (this is what actually brings the
   login form in-house): in `zitadel-login/upstream.json` pin `ref` to a
   known-good upstream tag/SHA, then `npm run upstream:vendor` and follow
   [UPSTREAM.md](../zitadel-login/UPSTREAM.md) to build from the vendored
   sources. Apply UI/UX customizations as commits on top of the subtree.
2. Redeploy the Login App project and re-verify its health endpoint — now
   `https://login.<domain>/ui/v2/login/loginname` must render the real login
   form.
3. In the **Main App** Vercel project add
   `ZITADEL_LOGIN_BASE_URL=https://login.<domain>/ui/v2/login` and redeploy.
4. In the ZITADEL Console, point the instance/app **custom login base URL**
   (login v2 UI setting) at `https://login.<domain>/ui/v2/login`
   (see [ZITADEL_CONFIGURATION.md](./ZITADEL_CONFIGURATION.md) §4).
5. Verify end-to-end: starting from `https://app.<domain>/sign-in`, the
   browser must land on `login.<domain>` (not on the ZITADEL host) for the
   interactive login, and both login and logout must complete
   (see [TEST_PLAN.md](./TEST_PLAN.md)).

To roll back to the hosted login at any time: remove `ZITADEL_LOGIN_BASE_URL`
from the Main App and revert the custom login base URL in ZITADEL.

### Main App on Vercel

1. **Environment variables** (Project → Settings → Environment Variables), set
   for the *Production* environment:
   - `DATABASE_URL` — use a **pooled** connection string (Neon/Supabase
     pgbouncer or Vercel Postgres): each serverless invocation opens its own
     connections, a direct Postgres URL exhausts `max_connections`.
   - `AUTH_SECRET` — generate with `npx auth secret`; never reuse the dev value.
   - `AUTH_URL` — canonical production URL (e.g. `https://app.<domain>`).
     Auth.js can auto-detect the host on Vercel, but being explicit avoids
     preview-domain surprises.
   - `NEXT_PUBLIC_SITE_URL`, `APP_BASE_URL` — same canonical URL.
   - `AUTH_ZITADEL_ISSUER`, `AUTH_ZITADEL_ID`, `AUTH_ZITADEL_SECRET` — see
     [ZITADEL_CONFIGURATION.md](./ZITADEL_CONFIGURATION.md).
   - `ZITADEL_LOGIN_BASE_URL` — only once the Login App is deployed and the
     upstream UI is vendored.
   - Leave `AUTH_DEV_LOGIN` **unset** in Production *and* Preview: preview
     deployments are publicly reachable URLs.
2. **Migrations**: Vercel does not run them. Apply `npx drizzle-kit migrate`
   from CI (or locally against the production DB) *before* promoting a deploy
   that changes the schema.
3. **Preview deployments & OIDC**: ZITADEL redirect URIs must be registered
   exactly, and preview URLs are dynamic — OIDC login will not work on
   ad-hoc preview URLs. Either register a fixed preview domain
   (e.g. `staging.<domain>` assigned to a branch) or accept that previews are
   UI-only.
4. **Monitoring**: Vercel has no built-in health probes; point an external
   uptime monitor at `GET /api/health/ready`.

> **Known limitation — attachments.** The attachments feature writes files to
> the local filesystem (`UPLOADS_DIR`, default `storage/uploads`). On Vercel
> the filesystem is **ephemeral**: uploaded files disappear between
> invocations/deploys. Before relying on attachments in production, move the
> storage backend to an object store (e.g. Vercel Blob or S3-compatible) —
> the write/read points are `src/features/attachments/actions.ts` and
> `src/app/api/attachments/[id]/route.ts`.

### Login App on Vercel

1. Set the project **Root Directory** to `zitadel-login` (Vercel then installs
   and builds only that app).
2. Env vars: `ZITADEL_API_URL`, `ZITADEL_SERVICE_USER_TOKEN` (mark as
   *Sensitive*).
3. The app serves under the `/ui/v2/login` base path; assign a stable domain
   (e.g. `login.<domain>`) and use
   `https://login.<domain>/ui/v2/login` as the custom login base URL in
   ZITADEL and as `ZITADEL_LOGIN_BASE_URL` in the Main App.
4. **The scaffold alone is not a login page**: vendor the upstream Login UI v2
   first ([UPSTREAM.md](../zitadel-login/UPSTREAM.md)), otherwise users will
   see the placeholder page instead of the login form.

## Rollout checklist

For the first production deploy on Vercel follow the
[end-to-end walkthrough](#end-to-end-walkthrough-zitadel--vercel--self-hosted-login)
above; for subsequent rollouts:

1. Migrate the database.
2. Deploy the Main App; verify `/api/health/ready` is green.
3. Deploy the Login App; verify its `/api/health`.
4. Register redirect + post-logout URIs in ZITADEL.
5. If using it, set `ZITADEL_LOGIN_BASE_URL` and flip the ZITADEL custom login
   base URL.
6. Smoke-test login and logout end-to-end (see [TEST_PLAN.md](./TEST_PLAN.md)).
