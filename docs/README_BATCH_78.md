# README — Batch 78

## Batch name

Token movement live raw history route foundation

## Files included

```text
packages/api/src/live-token-movement-history.ts
packages/api/src/types.ts
packages/api/src/client.ts
packages/api/src/index.ts
apps/server/src/routes.ts
docs/token-movement-live-raw-history-route.md
docs/README_BATCH_78.md
```

## Purpose

Batch 78 starts the real-data transition for the token movement dashboard.

It adds a read-only server/API route that can request live raw transaction/message history on the fly through the configured GraphQL endpoint.

## New route

```text
GET /api/token-movements/live-raw-history
```

Example legacy address request:

```text
/api/token-movements/live-raw-history?address=0:<64hex>&limit=25
```

Example State V2 request:

```text
/api/token-movements/live-raw-history?account_id=<64hex>&dapp_id=<64hex>&limit=25
```

## Safety boundary

This batch still does not decode confirmed token transfers. It only returns raw transaction/message observations.

No storage is introduced. The route uses no-store headers through the existing server response helper.

## After upload

Run:

```bash
npm run typecheck
```

## Commit message

```text
Batch 78: add live raw token movement history route
```
