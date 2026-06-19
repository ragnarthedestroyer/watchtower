# README — Batch 64

## Title

Batch 64: add on-the-fly token movement dashboard sections

## Purpose

Add the frontend foundation for separate visual sections:

- NACKL mining rewards
- direct NACKL / SHELL / USDC transfers in
- direct NACKL / SHELL / USDC transfers out
- other unresolved or contract-routed flows

## Safety boundary

This batch is read-only and on-the-fly. It does not store user information, persist movement history, use browser storage, sign transactions, custody assets, operate PrivateNote, or connect to DEX functionality.

## Files included

- `packages/core/src/token-movement-dashboard-sections.ts`
- `packages/core/src/index.ts`
- `apps/web/src/features/token-movement/tokenMovementDashboardSectionsPanel.ts`
- `docs/token-movement-dashboard-sections.md`
- `docs/README_BATCH_64.md`

## Required check

```bash
npm run typecheck
```

## Commit message

```text
Batch 64: add on-the-fly token movement dashboard sections
```
