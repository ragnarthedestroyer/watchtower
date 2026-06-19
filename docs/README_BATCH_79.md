# README — Batch 79

## Batch

Batch 79: Live raw token movement history frontend

## Files included

```text
packages/core/src/token-movement-live-raw-history-view.ts
packages/core/src/index.ts
apps/web/src/features/token-movement/tokenMovementLiveRawHistoryPanel.ts
apps/telegram/src/features/token-movement/tokenMovementLiveRawHistoryPanel.ts
apps/web/src/App.tsx
docs/token-movement-live-raw-history-frontend.md
docs/README_BATCH_79.md
```

## Purpose

This batch connects the visible Web frontend to the live raw token movement history route introduced in Batch 78.

It is the first step from the synthetic token movement dashboard preview toward real on-the-fly account history.

## User-visible behavior

The Web app now includes a live token movement panel where the user can enter:

```text
Legacy address: 0:<64hex>
```

or:

```text
State V2: account_id + dapp_id
```

The panel calls:

```text
GET /api/token-movements/live-raw-history
```

and renders raw transaction/message evidence.

## Safety

This batch remains read-only.

It does not:

- store wallet history;
- store searched addresses;
- use browser storage;
- use analytics;
- sign transactions;
- custody assets;
- decode token bodies as confirmed token transfers;
- operate PrivateNote;
- operate DEX functionality.

## Required command

```bash
npm run typecheck
```

## Commit message

```text
Batch 79: add live raw token movement history frontend
```
