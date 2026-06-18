# Batch 57 — Asset-flow visual summary

## Files included

- packages/core/src/asset-flow-visual-summary.ts
- packages/core/src/index.ts
- apps/web/src/features/token-movement/assetFlowVisualSummaryPanel.ts
- apps/telegram/src/features/token-movement/assetFlowVisualSummaryPanel.ts
- docs/asset-flow-visual-summary.md
- docs/README_BATCH_57.md

## What it adds

Adds a conservative asset-flow visual summary foundation for token movement records.

It groups TokenMovement candidates into graph-style nodes and edges and provides simple Web and Telegram renderers.

## Safety

This is read-only. It does not fetch live data, decode balances, sign transactions, request keys, or prove undecoded token transfers.

## Required command

```bash
npm run typecheck
```

## Commit message

```text
Batch 57: add asset-flow visual summary
```
