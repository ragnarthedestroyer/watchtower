# Batch 83 — Live raw route defensive fallback hotfix

## Files included

- `packages/api/src/http.ts`
- `packages/api/src/live-token-movement-history.ts`
- `packages/api/src/types.ts`
- `packages/api/src/client.ts`
- `packages/api/src/index.ts`
- `apps/server/src/routes.ts`
- `apps/server/src/main.ts`
- `docs/live-raw-route-defensive-fallback-hotfix.md`
- `docs/README_BATCH_83.md`

## Purpose

Fixes the situation where the server is running in live-read mode but `/api/token-movements/live-raw-history` still falls through to the legacy demo router and returns `Route not found`.

## Expected test after upload

Restart the server in live-read mode and open:

```text
/api/token-movements/live-raw-history?address=0:<64hex>&limit=25
```

The route should no longer return the old demo-router route-not-found message.

## Command

```bash
npm run typecheck
```

## Commit message

```text
Batch 83: add defensive live raw route fallback
```
