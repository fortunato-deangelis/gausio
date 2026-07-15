# Operations runbook

## Health endpoints

### Main App

| Endpoint | Meaning | Healthy |
| -------- | ------- | ------- |
| `GET /api/health` | Full report: process + config presence + ZITADEL reachability. | `200` with `status: "ok"` |
| `GET /api/health/live` | Liveness: process is up. | always `200` unless the process is dead |
| `GET /api/health/ready` | Readiness: safe to receive traffic (config present, ZITADEL reachable). | `200` / `503` |

Sample `GET /api/health` response (no secrets — only status labels):

```json
{
  "status": "ok",
  "uptime": 128,
  "timestamp": "2026-01-01T00:00:00.000Z",
  "checks": {
    "config": "ok",
    "database": "ok",
    "zitadel": "ok"
  }
}
```

Each check is one of `"ok"`, `"error"`, or `"skipped"` (`zitadel` is `skipped`
when the OIDC vars are unset and only the dev login is in use). Top-level
`status` is `"degraded"` if any check is `"error"`.

### Login App

`GET /ui/v2/login/api/health` → reports `zitadelApiUrlConfigured`,
`serviceUserTokenConfigured`, and `zitadelApiReachable`.

## Common alerts & responses

| Symptom | Likely cause | Action |
| ------- | ------------ | ------ |
| `/api/health/ready` = 503, `zitadelReachable: false` | Issuer down or wrong `AUTH_ZITADEL_ISSUER` | Verify issuer URL and network egress to ZITADEL. |
| Login loops back to sign-in | Callback URL not registered / clock skew | Check ZITADEL redirect URIs and server time. |
| Logout doesn't end ZITADEL session | `post_logout_redirect_uri` not registered | Register the exact Main App origin in ZITADEL. |
| `zitadelConfigured: false` in prod | Missing `AUTH_ZITADEL_*` | Set the OIDC env vars; redeploy. |
| Login App health degraded | Missing `ZITADEL_API_URL` / token | Set Login App env; verify PAT validity. |

## Log hygiene

- All server logging goes through `logger` (`src/server/security/log.ts`), which
  redacts tokens/secrets. Do not add raw `console.log` of request bodies,
  headers, or tokens.
- Health endpoints are safe to expose to internal probes; they never return
  secret values.

## Upstream maintenance (Login App)

```bash
cd zitadel-login
npm run upstream:check    # is upstream ahead of our pin?
npm run upstream:diff     # what changed since the pinned commit
npm run upstream:vendor   # pull the subtree and update the pin
```

Pin a specific tag/SHA in `upstream.json` before vendoring for reproducible
builds. See [UPSTREAM.md](../zitadel-login/UPSTREAM.md).

## Incident quick reference

1. Check `/api/health` on both apps.
2. Check recent deploys / env changes.
3. Check ZITADEL status and the registered URIs.
4. Roll back the most recent change if health does not recover.
