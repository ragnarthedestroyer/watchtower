# Watchtower Batch 72 — Token movement dashboard timeline foundation

## Files included

- `packages/core/src/token-movement-dashboard-timeline.ts`
- `packages/core/src/index.ts`
- `apps/web/src/features/token-movement/tokenMovementDashboardTimelinePanel.ts`
- `apps/telegram/src/features/token-movement/tokenMovementDashboardTimelinePanel.ts`
- `docs/token-movement-dashboard-timeline.md`
- `docs/README_BATCH_72.md`

## What this batch adds

Batch 72 adds an on-the-fly token movement timeline layer for the frontend.

It prepares a visual timeline/table that can show:

- when a movement was observed;
- which token moved;
- how much moved;
- direction;
- from;
- to;
- status/review classification.

## Product behavior

The timeline keeps separate:

- NACKL mining rewards;
- direct transfers in;
- direct transfers out;
- unresolved or contract-routed flows.

## Privacy and safety

This batch is read-only and no-storage by design.

It does not:

- fetch live chain data;
- persist wallet movement history;
- store searched addresses;
- use browser storage;
- use wallet-linked analytics;
- sign or broadcast transactions;
- custody assets;
- operate PrivateNote;
- trade through DEX;
- claim token transfer decoding is confirmed.

## After applying

Run:

```bash
npm run typecheck
```

## Commit message

```text
Batch 72: add token movement dashboard timeline foundation
```
