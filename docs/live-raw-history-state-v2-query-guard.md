# Batch 85 — Live Raw History State V2 Query Guard

This batch fixes the next live raw history failure discovered after Batch 84.

## Problem

The route is registered and running, but the legacy address request still cannot return transaction history because the current GraphQL endpoint does not expose `transactions` under the root `accounts` query.

The observed response was:

```text
GraphQL error: Unknown field "transactions" on type "Account".
```

## What changed

Batch 85 makes the live raw history reader more conservative and schema-aware:

- legacy `address=0:<64hex>` without a DApp ID becomes a schema probe instead of an invalid transaction-history query;
- `address=0:<64hex>&dapp_id=<64hex>` is upgraded to the State V2 path automatically;
- `account_id=<64hex>&dapp_id=<64hex>` uses the State V2 `blockchain.account` history path;
- the reader uses `in_message` and `out_messages` fields instead of older camelCase message fields;
- the response now explains that live history needs `account_id + dapp_id` on State V2 endpoints.

## Safety boundary

This remains read-only and on-the-fly only:

- no wallet history is persisted;
- no searched address is stored;
- no signing;
- no custody;
- no PrivateNote operation;
- no DEX operation;
- returned records are raw observations, not confirmed token transfers.
