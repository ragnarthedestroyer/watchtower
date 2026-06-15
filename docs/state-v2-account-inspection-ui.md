# State V2 account inspection UI

Batch 41 adds State V2 input support to the existing account inspection panels in both the Web app and Telegram Mini App.

## What changed

- The account inspection panel now supports two modes:
  - Legacy address: `0:<64hex>`
  - State V2: `account_id=<64hex>` plus `dapp_id=<64hex>`
- Both modes call the existing safe server route:
  - `GET /accounts/inspect`
- The State V2 UI is intentionally inspection-only.
- Balance candidates remain research evidence only.
- No snapshot saving policy is relaxed.
- No confirmed NACKL balance claim is added.

## Why this matters

State V2 migration requires Watchtower to stop treating `0:<account>` as the only account identity format. This UI change makes it possible to manually inspect State V2-shaped identifiers once real values are available, while keeping the old legacy address workflow available.

## Safety notes

- The app does not infer or invent a DApp ID.
- The user must enter both `account_id` and `dapp_id` for State V2 inspection.
- Missing fields are blocked before the server request is sent.
- Inspection results remain evidence, not confirmed portfolio data.
