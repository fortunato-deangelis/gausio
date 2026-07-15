# ZITADEL configuration

Steps to configure the ZITADEL instance so both apps work.

## 1. Create the OIDC application (Main App client)

1. In your ZITADEL project, create a new **Application** of type **Web**.
2. Authentication method: **PKCE** (Authorization Code + PKCE).
3. **Redirect URIs** — add the Auth.js callback for every environment:
   - `http://localhost:3000/api/auth/callback/zitadel` (local)
   - `https://<your-domain>/api/auth/callback/zitadel` (prod)
4. **Post logout redirect URIs** — add the Main App origins (exact, no
   wildcards):
   - `http://localhost:3000/`
   - `https://<your-domain>/`
5. Copy the **Client ID** and **Client Secret** into the Main App env
   (`AUTH_ZITADEL_ID`, `AUTH_ZITADEL_SECRET`) and set `AUTH_ZITADEL_ISSUER` to
   your instance URL.

## 2. Scopes & claims

- Requested scopes: `openid email profile`.
- Ensure email and profile claims are released so `syncUser` can populate the
  local user (`email`, `name`, `picture`).

## 3. Service user for the Login App

The Login App (ZITADEL Login UI v2) calls the ZITADEL API with a **service
user**:

1. Create a **Machine user**.
2. Grant it the roles required by the Login UI (see the upstream docs for the
   exact role set for your ZITADEL version).
3. Generate a **Personal Access Token** and set it as
   `ZITADEL_SERVICE_USER_TOKEN` in the Login App env, with `ZITADEL_API_URL`
   pointing at your instance.

## 4. Custom login base URL (optional)

To route interactive login through the self-hosted Login App instead of the
hosted login:

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
