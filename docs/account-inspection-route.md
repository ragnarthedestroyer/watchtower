# Account Inspection Route

Batch 16 adds a safe account inspection endpoint for decoder research.

## Route

```text
GET /accounts/inspect?address=0:<64hex>
```

Future State V2 shape is also accepted:

```text
GET /accounts/inspect?account_id=<64hex>&dapp_id=<64hex>
```

## Purpose

The route reads the same raw account data as `/accounts/raw`, but returns a safer research summary:

- normalized account fields;
- raw GraphQL response shape;
- detected account container path;
- account record keys;
- decoder hints;
- warnings when BOC is missing or raw balance is not safe to interpret.

## Safety rule

This route does not decode balances and does not save snapshots. It is a research/debug endpoint only.

Raw account `balance` must not be treated as confirmed wallet NACKL until account semantics and decoder logic are verified.
