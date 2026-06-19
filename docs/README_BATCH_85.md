# README — Batch 85

## Name

Batch 85: Live raw history State V2 query guard

## Files included

```text
packages/api/src/live-token-movement-history.ts
packages/api/src/http.ts
docs/live-raw-history-state-v2-query-guard.md
docs/README_BATCH_85.md
```

## Purpose

Batch 85 fixes the next live-history blocker after Batch 84.

The route now works, but the GraphQL endpoint reported:

```text
Unknown field "transactions" on type "Account".
```

That means the root `accounts` query can see account objects, but it does not expose transaction history there.

Batch 85 changes the route so:

- plain legacy `address=0:<64hex>` is treated as a safe schema probe;
- legacy `address=0:<64hex>&dapp_id=<64hex>` is upgraded into State V2 history mode;
- `account_id=<64hex>&dapp_id=<64hex>` uses the State V2 history path;
- the route avoids querying unsupported `accounts.transactions`.

## Test command

```bash
npm run typecheck
```

Then restart the backend:

```bash
WATCHTOWER_MODE=live-read WATCHTOWER_GRAPHQL_ENDPOINT=https://mainnet.ackinacki.org/graphql npm run server:dev
```

Legacy probe test:

```bash
curl -i "http://localhost:8787/api/token-movements/live-raw-history?address=0:099e09156b6b0dcc840a815baf279e71e50736c3e81ff1e7fde788ad1780b4c1&limit=25"
```

State V2 history test, if DApp ID is known:

```bash
curl -i "http://localhost:8787/api/token-movements/live-raw-history?address=0:099e09156b6b0dcc840a815baf279e71e50736c3e81ff1e7fde788ad1780b4c1&dapp_id=<64hex>&limit=25"
```

## Commit message

```text
Batch 85: add live raw history State V2 query guard
```
