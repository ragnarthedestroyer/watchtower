# Telegram account inspection panel

Batch 40 adds an account inspection panel to the Telegram Mini App.

The panel calls the existing server-backed route:

```text
GET /accounts/inspect?address=0:<64hex>
```

It displays normalized account fields, account classification, decoder confidence, decoder hints, warnings, and balance candidates.

The panel remains research-only. It does not confirm wallet NACKL, does not save production snapshots, and does not bypass the existing snapshot policy.
