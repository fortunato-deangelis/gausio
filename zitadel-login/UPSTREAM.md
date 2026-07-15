# Tracking the upstream ZITADEL Login UI v2

This scaffold tracks the upstream ZITADEL Login UI so we can layer local
overrides while still pulling upstream fixes and features.

## Upstream facts

- **Repository:** https://github.com/zitadel/typescript
- **App:** the ZITADEL Login UI v2 lives at the repository root as the
  `@zitadel/login` Next.js app (the repo is a pnpm workspace).
- **Base path:** `/ui/v2/login` (mirrored by `next.config.mjs` here).
- **License:** MIT.
- **Key env:** `ZITADEL_API_URL`, `ZITADEL_SERVICE_USER_TOKEN` (a service-user
  PAT used to call the ZITADEL API).

> Always confirm the current structure and env contract for the version you are
> vendoring — upstream evolves. `npm run upstream:check` resolves the pinned ref
> to a commit SHA so you know exactly what you're importing.

## Strategy: git subtree

We use **git subtree** (not a submodule, not a raw copy):

- history is preserved and merges are reviewable;
- the vendored code lives in a normal directory (`vendor/`), so builds and edits
  are straightforward;
- local overrides can be committed on top and re-merged on the next pull.

The pin lives in [`upstream.json`](./upstream.json):

```json
{
  "repo": "https://github.com/zitadel/typescript.git",
  "ref": "main",
  "subdir": ".",
  "vendorDir": "vendor",
  "pinnedCommit": null,
  "lastVendoredAt": null
}
```

**Pin `ref` to a tag or commit SHA** before vendoring for reproducible builds.

## Commands

```bash
# See whether upstream has moved past our pin (resolves ref -> SHA)
npm run upstream:check

# Show commits since the pinned SHA
npm run upstream:diff

# Import/refresh the upstream app into vendor/ and update the pin
npm run upstream:vendor
```

`upstream:vendor` refuses to run on a dirty working tree, adds the upstream
remote (`zitadel-login-upstream`), fetches the pinned ref, and performs a
`git subtree add`/`pull --squash` into `vendor/`. It then records the resolved
commit SHA and timestamp back into `upstream.json`.

## One-time manual import (documented, not executed here)

In this environment the upstream is intentionally **not** vendored (it is a
large pnpm/Nx-style app with gRPC/Connect codegen that won't build in a
lightweight sandbox, and would bloat the repo). To vendor it in your own
environment:

```bash
cd zitadel-login

# 1. Pin a known-good upstream tag/SHA in upstream.json (edit "ref").
# 2. Import it:
npm run upstream:vendor

# 3. Install & build within vendor/ per upstream instructions
#    (upstream uses pnpm; follow its README for codegen + build steps).
```

By default `vendor/` is gitignored (see `.gitignore`) to keep this repo lean.
If your team prefers to commit the subtree, remove `vendor/` from `.gitignore`
before running `upstream:vendor`.

## Applying local overrides

Keep local changes **outside** `vendor/` where possible (e.g. env, config,
routing in the Main App). When you must patch vendored files, commit those
changes as separate commits after the subtree import so the next
`upstream:vendor` merge surfaces conflicts you can resolve deliberately.
