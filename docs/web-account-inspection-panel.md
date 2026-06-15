# Web account inspection panel

Batch 39 adds a Web UI panel for the existing safe account-inspection route.

The panel calls:

```text
GET /accounts/inspect?address=0:<64hex>
```

The inspection result shows normalized account fields, raw response shape, decoder hints, account classification, balance-candidate count, and candidate evidence paths.

This remains a research feature only. Raw account balances and balance candidates are not displayed as confirmed NACKL.

## Safety behavior

- Only works when the Web app is connected to the Watchtower server.
- Does not save snapshots.
- Does not confirm balances.
- Does not require a database provider.
- Keeps the distinction between evidence and confirmed portfolio values.
