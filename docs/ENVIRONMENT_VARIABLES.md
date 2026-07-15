# Environment variables

Two `.env.example` files describe the contract:

- Main App: [`.env.example`](../.env.example)
- Login App: [`zitadel-login/.env.example`](../zitadel-login/.env.example)

## Main App

| Variable | Required | Default | Description |
| -------- | :------: | ------- | ----------- |
| `DATABASE_URL` | yes | — | PostgreSQL connection string. |
| `AUTH_SECRET` | yes (prod) | — | Auth.js encryption secret. Generate with `npx auth secret`. |
| `AUTH_URL` | prod / proxy | `http://localhost:3000` | Public URL of the Main App. |
| `NEXT_PUBLIC_SITE_URL` | yes | — | Canonical URL for metadata/sitemap/robots. |
| `AUTH_ZITADEL_ISSUER` | for OIDC | — | ZITADEL issuer (discovery base). |
| `AUTH_ZITADEL_ID` | for OIDC | — | OIDC client id. |
| `AUTH_ZITADEL_SECRET` | for OIDC | — | OIDC client secret. |
| `ZITADEL_LOGIN_BASE_URL` | no | — | If set, routes the authorize endpoint through the Login App. |
| `APP_BASE_URL` | no | falls back to `AUTH_URL`/`NEXT_PUBLIC_SITE_URL` | Used to build absolute `post_logout_redirect_uri`. |
| `AUTH_DEV_LOGIN` | no | `false` | Enables the dev-only credentials login. **Never in prod.** |
| `UPLOADS_DIR` | no | `storage/uploads` | Where uploaded attachments are stored. |

### Compatibility aliases

The config reader also accepts `ZITADEL_ISSUER`, `ZITADEL_CLIENT_ID`, and
`ZITADEL_CLIENT_SECRET` as fallbacks for the `AUTH_ZITADEL_*` names, so
deployments already using the plain ZITADEL naming keep working.

## Login App

| Variable | Required | Description |
| -------- | :------: | ----------- |
| `ZITADEL_API_URL` | yes | Base URL of the ZITADEL instance API (no trailing slash). |
| `ZITADEL_SERVICE_USER_TOKEN` | yes | Service-user PAT used to call the ZITADEL API. Secret. |

> Variable names for the Login App mirror the upstream ZITADEL Login UI v2
> contract. When you vendor the upstream app (see
> [UPSTREAM.md](../zitadel-login/UPSTREAM.md)), reconcile any additional
> variables it introduces here.

## Validation

- The Main App treats ZITADEL as **optional**: with the ZITADEL vars unset the
  OIDC provider is simply not registered (so auth routes don't crash), and only
  the dev login is available.
- Health endpoints report which groups are configured — see
  [OPERATIONS_RUNBOOK.md](./OPERATIONS_RUNBOOK.md).
