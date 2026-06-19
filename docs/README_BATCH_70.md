# Batch 70 — Token movement dashboard quick filters

## Files

- `packages/core/src/token-movement-dashboard-quick-filters.ts`
- `packages/core/src/index.ts`
- `apps/web/src/features/token-movement/tokenMovementDashboardQuickFiltersPanel.ts`
- `apps/telegram/src/features/token-movement/tokenMovementDashboardQuickFiltersPanel.ts`
- `docs/token-movement-dashboard-quick-filters.md`
- `docs/README_BATCH_70.md`

## What this batch adds

This batch adds quick-filter controls for the on-the-fly token movement dashboard.

It supports filters for:

- all movement cards;
- NACKL mining rewards;
- direct transfers in;
- direct transfers out;
- direct NACKL;
- direct SHELL;
- direct USDC;
- needs review;
- unresolved or contract-routed flows.

## Safety boundary

This batch is read-only and UI-only. It does not fetch chain data, persist wallet history, store searched addresses, use analytics, sign transactions, custody assets, operate PrivateNote, trade, or decode token transfers.

## Validation

Run:

```bash
npm run typecheck
```

## Commit message

```text
Batch 70: add token movement dashboard quick filters
```
