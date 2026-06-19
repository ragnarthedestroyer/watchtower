# Batch 78 — Token Movement Live Raw History Route Foundation

Batch 78 starts the transition from deterministic synthetic dashboard preview data to real on-chain evidence.

It adds a read-only live raw history route for token movement research:

```text
GET /api/token-movements/live-raw-history
```

Supported query parameters:

```text
address=0:<64hex>
account_id=<64hex>
dapp_id=<64hex>
limit=<number>
include_raw_payloads=true|false
```

## What this route does

The route performs an on-the-fly GraphQL request using the configured Watchtower live-read endpoint and attempts to extract raw transaction/message candidates.

It returns the existing `AccountHistoryResponse` structure from the transaction history foundation.

## What this route does not do

It does not:

- store searched addresses;
- store transaction history;
- use browser storage;
- use wallet keys;
- sign transactions;
- broadcast messages;
- operate PrivateNote;
- interact with DEX;
- claim decoded NACKL/SHELL/USDC transfers.

## Why this is needed

The visible dashboard currently uses synthetic preview rows. Before the dashboard can show real NACKL mining rewards or direct SHELL/USDC/NACKL transfers, Watchtower needs a live, read-only transaction/message evidence source.

This batch provides that first source.

## Safety wording

Returned rows are raw evidence only. They are not yet confirmed token transfers until later decoder and normalizer batches classify them.
