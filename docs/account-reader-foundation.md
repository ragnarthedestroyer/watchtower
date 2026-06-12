# Account Reader Foundation

Batch 12 introduces the first read-only raw account reader.

## Added route

```text
GET /accounts/raw?address=0:<64hex>
```

The route also accepts the future State V2-style input shape:

```text
GET /accounts/raw?account_id=<64hex>&dapp_id=<64hex>
```

If `dapp_id` is omitted, the server tries to use `WATCHTOWER_DAPP_ID` from configuration.

## Safety rules

- The route only works when `WATCHTOWER_MODE=live-read`.
- A valid GraphQL endpoint must be configured.
- The reader returns raw account data only.
- It does not decode balances yet.
- It does not save snapshots.
- It does not mark NACKL balances as confirmed.

## Why raw first

The first live-read milestone should prove that Watchtower can safely request account state without pretending to understand every token or contract layout. Balance decoding, Mobile Verifier epoch interpretation, and snapshot saving remain separate later steps.

## Known limitation

The GraphQL account query may need adjustment once tested against the active Acki Nacki endpoint schema. If the endpoint rejects the query, this is a connector/schema issue, not a product logic issue.
