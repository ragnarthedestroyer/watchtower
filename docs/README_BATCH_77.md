# Batch 77 — Token movement dashboard visible demo entry

## Summary

Adds the first visible Web frontend entry for the token movement dashboard using deterministic synthetic preview rows.

## Files included

- `packages/core/src/token-movement-dashboard-visible-demo-entry.ts`
- `packages/core/src/index.ts`
- `apps/web/src/App.tsx`
- `apps/web/src/features/token-movement/tokenMovementDashboardVisibleDemoEntryPanel.ts`
- `apps/telegram/src/features/token-movement/tokenMovementDashboardVisibleDemoEntryPanel.ts`
- `docs/token-movement-dashboard-visible-demo-entry.md`
- `docs/README_BATCH_77.md`

## What it adds

- A core visible-demo entry model combining:
  - synthetic dashboard preview;
  - preview QA;
  - no-storage session state.
- A Web HTML panel renderer for the visible demo dashboard.
- A Telegram text renderer for the same preview status.
- A Web app integration in `apps/web/src/App.tsx` so the token movement dashboard preview appears in the main frontend.

## Safety

The preview is synthetic and read-only. It does not fetch live data, decode real transfers, persist wallet history, store searched addresses, use analytics, sign transactions, custody assets, operate PrivateNote, or trade.

## Required check

Run:

```bash
npm run typecheck
```

## Commit message

```text
Batch 77: add visible token movement dashboard demo entry
```
