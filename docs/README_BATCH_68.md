# Batch 68 — On-the-fly frontend dashboard composer

## Files included

- `packages/core/src/token-movement-on-the-fly-frontend-dashboard.ts`
- `packages/core/src/index.ts`
- `apps/web/src/features/token-movement/tokenMovementOnTheFlyFrontendDashboardPanel.ts`
- `apps/telegram/src/features/token-movement/tokenMovementOnTheFlyFrontendDashboardPanel.ts`
- `docs/token-movement-on-the-fly-frontend-dashboard.md`
- `docs/README_BATCH_68.md`

## What it adds

Batch 68 adds the unified frontend dashboard composer for the token movement workstream.

It composes the previous classifiers into four frontend sections:

- NACKL mining rewards
- Direct transfers in
- Direct transfers out
- Unresolved or contract-routed flows

It also exposes Web and Telegram renderers for the composed dashboard.

## Safety notes

This batch is read-only and on-the-fly only. It does not persist wallet movement history, searched addresses, browser storage, server storage, analytics, exports, wallet operations, signing, broadcasting, DEX operations, or PrivateNote operations.

## Required command

Run:

```bash
npm run typecheck
```

## Commit message

```text
Batch 68: add on-the-fly frontend token movement dashboard
```
