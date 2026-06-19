# Batch 69 — Token movement dashboard visual cards

## Files included

- `packages/core/src/token-movement-dashboard-visual-cards.ts`
- `packages/core/src/index.ts`
- `apps/web/src/features/token-movement/tokenMovementDashboardVisualCardsPanel.ts`
- `apps/telegram/src/features/token-movement/tokenMovementDashboardVisualCardsPanel.ts`
- `docs/token-movement-dashboard-visual-cards.md`
- `docs/README_BATCH_69.md`

## What this batch adds

This batch adds visual-card data derived from the Batch 68 on-the-fly frontend dashboard.

It prepares frontend sections for:

- NACKL mining rewards
- Direct transfers in
- Direct transfers out
- Unresolved or contract-routed flows

Each card includes:

- title
- subtitle
- severity
- row count
- unresolved count
- token breakdown
- row previews
- empty state
- safety note
- privacy note

## Privacy boundary

The cards are derived from the current in-memory dashboard only. The feature must not persist wallet movement history, searched addresses, reports, exports, browser storage, or wallet-linked analytics.

## Safety boundary

This batch is read-only. It does not fetch chain data, decode token transfers, sign transactions, broadcast messages, operate wallets, custody assets, operate PrivateNote, or trade.

## Validation

Run:

```bash
npm run typecheck
```

## Commit message

```text
Batch 69: add token movement dashboard visual cards
```
