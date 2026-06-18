# Watchtower Batch 55

## Name

Web token movement history panel

## Files

```text
packages/core/src/token-movement-history-view.ts
packages/core/src/index.ts
apps/web/src/features/token-movement/tokenMovementHistoryPanel.ts
docs/token-movement-history-panel.md
docs/README_BATCH_55.md
```

## Purpose

Add the first web-facing display foundation for Token Movement History.

## What it adds

- Core view model for token movement history.
- Web panel HTML renderer.
- Summary counters.
- Candidate/confirmed proof visibility.
- Review and uncertainty indicators.
- Safety banner for unresolved evidence.

## What it does not do

- Does not fetch live history.
- Does not decode token balances.
- Does not claim unresolved movements are confirmed.
- Does not sign, broadcast, trade, bridge, custody, or operate wallets.

## Required command

```bash
npm run typecheck
```

## Commit message

```text
Batch 55: add web token movement history panel
```
