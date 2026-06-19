# Batch 75 — Token movement dashboard demo preview foundation

## Files included

- `packages/core/src/token-movement-dashboard-demo-preview.ts`
- `packages/core/src/index.ts`
- `apps/web/src/features/token-movement/tokenMovementDashboardDemoPreviewPanel.ts`
- `apps/telegram/src/features/token-movement/tokenMovementDashboardDemoPreviewPanel.ts`
- `docs/token-movement-dashboard-demo-preview.md`
- `docs/README_BATCH_75.md`

## What this batch adds

This batch adds deterministic synthetic preview data for the token movement dashboard so the frontend can become visible and testable before live transaction history and token decoding are connected.

The preview covers:

- NACKL mining rewards;
- direct transfers in for NACKL, SHELL, and USDC;
- direct transfers out for NACKL, SHELL, and USDC;
- unresolved accumulator / bridge / USDC recovery-route style review.

## Safety and privacy notes

This batch is read-only and synthetic-only. It does not fetch chain data, persist wallet history, use browser storage, store searched addresses, use wallet-linked analytics, sign transactions, custody assets, operate PrivateNote, trade, or decode token transfers.

## Validation

Run:

```bash
npm run typecheck
```

## Commit message

```text
Batch 75: add token movement dashboard demo preview foundation
```
