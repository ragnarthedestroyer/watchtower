# Decoder research report UI

Batch 49 adds decoder research report panels to both the Web app and the Telegram Mini App.

## Added UI behavior

Both apps can now generate a decoder research report from the same account identity used by the account inspection panel:

- legacy address mode: `0:<64hex>`
- State V2 mode: `account_id=<64hex>` plus `dapp_id=<64hex>`

The UI calls the existing server route:

```text
GET /decoder/research-report
```

## What the report shows

The report displays:

- report status
- report ID and generation time
- account mode
- BOC availability
- account classification
- candidate group count
- blockers
- suggested next steps
- candidate groups by kind
- candidate paths
- sample raw amounts
- confidence levels
- warnings

## Safety position

This panel is explicitly a research tool. It does not confirm balances and does not turn balance candidates into trusted NACKL totals.

The purpose is to compare evidence across known accounts and decide which decoder paths are worth testing next.

## Required action after upload

1. Commit files.
2. Check GitHub Actions → latest Typecheck run.

No terminal command is required.
