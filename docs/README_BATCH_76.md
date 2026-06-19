# Batch 76 — Token movement dashboard preview QA foundation

## Files

- `packages/core/src/token-movement-dashboard-preview-qa.ts`
- `packages/core/src/index.ts`
- `apps/web/src/features/token-movement/tokenMovementDashboardPreviewQaPanel.ts`
- `apps/telegram/src/features/token-movement/tokenMovementDashboardPreviewQaPanel.ts`
- `docs/token-movement-dashboard-preview-qa.md`
- `docs/README_BATCH_76.md`

## Purpose

Adds deterministic QA checks for the synthetic token movement dashboard preview introduced in Batch 75.

The report confirms that frontend preview data keeps the expected visual boundaries:

- NACKL mining rewards;
- direct transfers in;
- direct transfers out;
- unresolved or contract-routed flows.

## Safety

This batch is read-only and synthetic-preview-only.

It does not fetch chain data, decode live token transfers, store wallet history, store searched addresses, use browser storage, use analytics, sign transactions, custody assets, operate PrivateNote, or interact with DEX flows.

## After upload

Run:

```bash
npm run typecheck
```

## Commit message

```text
Batch 76: add token movement dashboard preview QA foundation
```
