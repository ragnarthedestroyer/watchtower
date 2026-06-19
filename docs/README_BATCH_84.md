# Batch 84 — Live raw history GraphQL schema hotfix

## Files included

- `packages/api/src/live-token-movement-history.ts`
- `docs/live-raw-history-graphql-schema-hotfix.md`
- `docs/README_BATCH_84.md`

## Purpose

Fixes the live raw token movement history route after it started responding but returned GraphQL schema errors.

The route was registered correctly after Batch 83. The remaining issue was the query shape:

- legacy reads were using `blockchain.account(address: ...)`, but the public schema requires a different account access style;
- transaction field `hash` was not available;
- camelCase `inMessage` / `outMessages` were not available;
- snake_case `in_msg` / `out_msgs` are the supported names indicated by the GraphQL error.

## Expected test after upload

Run:

```bash
npm run typecheck
```

Restart server:

```bash
WATCHTOWER_MODE=live-read WATCHTOWER_GRAPHQL_ENDPOINT=https://mainnet.ackinacki.org/graphql npm run server:dev
```

Then test:

```text
/api/token-movements/live-raw-history?address=0:<64hex>&limit=25
```

Expected improvement: the previous GraphQL schema errors for `blockchain.account(address)`, `hash`, `inMessage`, and `outMessages` should disappear.

The response may still contain no decoded token transfers. That is expected until decoder batches are added.

## Commit message

```text
Batch 84: fix live raw history GraphQL schema query
```
