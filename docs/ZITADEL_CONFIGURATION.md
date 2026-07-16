# ZITADEL configuration

Steps to configure the ZITADEL instance so both apps work.

## 1. Create the OIDC application (Main App client)

In the ZITADEL Console: **Projects → (your project) → Applications → New**.

1. Application type: **Web**.
2. Authentication method: **Code** (confidential client with client secret;
   ZITADEL calls it "Basic" / "Post" client authentication). Do **not** pick
   the "PKCE" application type: that creates a *public* client **without a
   client secret**, while the Main App requires `AUTH_ZITADEL_SECRET` to be set
   (`isZitadelConfigured` is false without it). Auth.js still performs
   Authorization Code **+ PKCE** on top of the confidential client.
3. **Redirect URIs** — add the Auth.js callback for every environment:
   - `http://localhost:3000/api/auth/callback/zitadel` (local; enable
     "Development Mode" on the app to allow `http://` URIs)
   - `https://<your-domain>/api/auth/callback/zitadel` (prod)
4. **Post logout redirect URIs** — add the Main App origins (exact, no
   wildcards):
   - `http://localhost:3000/`
   - `https://<your-domain>/`
5. Create the app: ZITADEL shows the **Client ID** and **Client Secret** once —
   copy them immediately (the secret can be regenerated later from the app's
   **Configuration** tab).

### Where each env var comes from (Console → `.env`)

| Env var | Where to find it in the ZITADEL Console |
| ------- | --------------------------------------- |
| `AUTH_ZITADEL_ISSUER` | Your instance domain, e.g. `https://<instance>.zitadel.cloud` (Console → **Instance → Domains**, or the "Issuer" in the app's **Urls** tab). No trailing slash, no path. |
| `AUTH_ZITADEL_ID` | The application's **Client ID** (Application → **Configuration**). |
| `AUTH_ZITADEL_SECRET` | The application's **Client Secret**, shown at creation or via **Regenerate Client Secret**. |
| `ZITADEL_API_URL` (Login App) | Same instance domain as the issuer. |
| `ZITADEL_SERVICE_USER_TOKEN` (Login App) | PAT of the machine user — see section 3. |

You can verify the issuer by opening
`https://<instance>/.well-known/openid-configuration` in a browser: it must
return the discovery document.

## 2. Scopes & claims

- Requested scopes: `openid email profile`.
- Ensure email and profile claims are released so `syncUser` can populate the
  local user (`email`, `name`, `picture`).

## 3. Service user for the Login App

The Login App (ZITADEL Login UI v2) calls the ZITADEL API with a **service
user**:

1. Console → **Users → Service Users → New**: create a **Machine user**
   (e.g. `login-client`).
2. Grant it the **IAM_LOGIN_CLIENT** role (Console → **Instance → Managers →
   Add manager**, pick the service user). Older ZITADEL versions may require a
   different role set — check the upstream Login UI docs for your version.
3. Open the service user → **Personal Access Tokens → New**: set an expiry and
   copy the token once. Set it as `ZITADEL_SERVICE_USER_TOKEN` in the Login App
   env, with `ZITADEL_API_URL` pointing at your instance.

## 4. Custom login base URL (target setup)

The goal of this integration is to serve the **login form from our own
self-hosted Login App** (so its UI/UX can be customized), not ZITADEL's hosted
login page. Until these steps are completed — including vendoring the upstream
Login UI, see [UPSTREAM.md](../zitadel-login/UPSTREAM.md) — users still land on
ZITADEL's hosted login:

1. Deploy the Login App under a stable origin (e.g.
   `https://login.<your-domain>/ui/v2/login`).
2. Set `ZITADEL_LOGIN_BASE_URL` in the Main App to that origin.
3. In ZITADEL, configure the instance/app **custom login base URL** (a.k.a.
   custom login UI) to point at the Login App, per your ZITADEL version's admin
   settings.

## 5. Verify

- Main App `/api/health/ready` returns `200` when ZITADEL discovery is
  reachable.
- Login App `/ui/v2/login/api/health` returns `200` when `ZITADEL_API_URL` is
  reachable and the service token is configured.

See [ZITADEL_CONFIGURATION reference values](./ENVIRONMENT_VARIABLES.md) for the
full variable list.
