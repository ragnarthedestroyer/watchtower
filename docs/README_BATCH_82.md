# Batch 82 — Live raw token movement route registration hotfix

## Files included

```text
packages/api/src/live-token-movement-history.ts
packages/api/src/types.ts
packages/api/src/client.ts
packages/api/src/index.ts
apps/server/src/routes.ts
apps/server/src/main.ts
docs/live-raw-token-movement-route-registration-hotfix.md
docs/README_BATCH_82.md
```

## What this fixes

This hotfix re-applies the live raw token movement API route registration to the actual server router:

```text
GET /api/token-movements/live-raw-history
```

It fixes the Codespaces symptom where `/health` and `/config/status` worked, but the live raw token movement route returned:

```text
Route not found: /api/token-movements/live-raw-history
```

## Required action

Upload/unzip into the repo root, preserving paths.

Then run:

```bash
npm run typecheck
```

Restart the server:

```bash
WATCHTOWER_MODE=live-read WATCHTOWER_GRAPHQL_ENDPOINT=https://mainnet.ackinacki.org/graphql npm run server:dev
```

Then test:

```text
/api/token-movements/live-raw-history?address=0:<64hex>&limit=25
```

## Commit message

```text
Batch 82: register live raw token movement server route
```
