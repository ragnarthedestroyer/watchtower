# README — Batch 80

## Batch name

Batch 80: Live raw dashboard bridge foundation

## Files included

```text
packages/core/src/token-movement-live-dashboard-bridge.ts
packages/core/src/index.ts
apps/web/src/features/token-movement/tokenMovementLiveDashboardBridgePanel.ts
apps/telegram/src/features/token-movement/tokenMovementLiveDashboardBridgePanel.ts
apps/web/src/App.tsx
docs/token-movement-live-dashboard-bridge.md
docs/README_BATCH_80.md
```

## What it adds

This batch takes the live raw transaction/message history loaded in Batch 79 and projects it into a dashboard-shaped view.

It helps the frontend start showing real request data in the same product structure as the synthetic dashboard preview, while keeping the data explicitly raw and undecoded.

## Important limitation

Rows are still raw evidence only. They are not confirmed NACKL, SHELL, USDC, TIP-3, or mining-reward movements until decoder evidence is implemented.

## Required command

```bash
npm run typecheck
```

## Commit message

```text
Batch 80: add live raw dashboard bridge foundation
```
