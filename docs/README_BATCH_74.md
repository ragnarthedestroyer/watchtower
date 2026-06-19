# Batch 74 — Token movement dashboard UI/UX review foundation

## Files included

- `packages/core/src/token-movement-dashboard-ux-review.ts`
- `packages/core/src/index.ts`
- `apps/web/src/features/token-movement/tokenMovementDashboardUxReviewPanel.ts`
- `apps/telegram/src/features/token-movement/tokenMovementDashboardUxReviewPanel.ts`
- `docs/token-movement-dashboard-ux-review.md`
- `docs/README_BATCH_74.md`

## What this batch adds

This batch adds the UI/UX review foundation for the token movement dashboard.

It allows cosmetic and UX comments to be captured after the frontend is visible and testable, while preserving the important product boundaries:

- no wallet-history persistence;
- no searched-address storage;
- no wallet-linked analytics;
- no false confirmation of unresolved movement rows;
- no mixing of NACKL mining rewards with normal inbound transfers;
- no display of accumulator, bridge, PrivateNote, DEX, unknown, or decoder-needed records as simple transfers.

## Terminal command

Run:

```bash
npm run typecheck
```

## Commit message

```text
Batch 74: add token movement dashboard UX review foundation
```
