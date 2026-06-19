# README — Batch 71

## Name

Token movement dashboard drilldown foundation

## Files included

```text
packages/core/src/token-movement-dashboard-drilldown.ts
packages/core/src/index.ts
apps/web/src/features/token-movement/tokenMovementDashboardDrilldownPanel.ts
apps/telegram/src/features/token-movement/tokenMovementDashboardDrilldownPanel.ts
docs/token-movement-dashboard-drilldown.md
docs/README_BATCH_71.md
```

## What this batch adds

Batch 71 adds the read-only frontend drilldown model for token movement dashboard cards and quick filters.

It lets the UI show focused detail previews for:

- a selected dashboard card;
- a selected quick filter;
- a selected row preview;
- all current in-memory visual-card rows.

## What this batch does not add

This batch does not add live chain reads, token decoding, transaction signing, message broadcasting, wallet operations, custody, DEX actions, PrivateNote operations, analytics, or persisted wallet history.

## Privacy rule

Drilldown state must remain on-the-fly UI state. It must not be stored with wallet addresses or movement history.

## Required check

Run:

```bash
npm run typecheck
```

## Commit message

```text
Batch 71: add token movement dashboard drilldown foundation
```
