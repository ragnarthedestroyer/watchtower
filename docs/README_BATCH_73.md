# Batch 73 — Token movement dashboard session state

## Files included

- `packages/core/src/token-movement-dashboard-session-state.ts`
- `packages/core/src/index.ts`
- `apps/web/src/features/token-movement/tokenMovementDashboardSessionStatePanel.ts`
- `apps/telegram/src/features/token-movement/tokenMovementDashboardSessionStatePanel.ts`
- `docs/token-movement-dashboard-session-state.md`
- `docs/README_BATCH_73.md`

## What this batch adds

Batch 73 adds an on-the-fly session state layer for the token movement dashboard.

It gives the frontend explicit states for:

- idle
- loading
- ready
- empty
- partial
- error
- rate-limited

It also adds a no-storage checklist for wallet-linked token movement views.

## What this batch intentionally does not add

- no live history fetch;
- no token-transfer decoding;
- no wallet signing;
- no transaction broadcast;
- no custody;
- no PrivateNote operation;
- no DEX operation;
- no persisted wallet history.

## Validation

Run:

```bash
npm run typecheck
```

## Commit message

```text
Batch 73: add token movement dashboard session state
```
