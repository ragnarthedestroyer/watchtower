# Batch 59 Hotfix — align token movement panels with Batch 51 model

This hotfix repairs the TypeScript errors introduced by later token movement UI/report files that expected an older/different TokenMovement shape.

It keeps the read-only safety boundary and does not add live reads, token decoding, signing, custody, bridge operations, DEX actions, or key handling.

## Files

- packages/core/src/token-movement-telegram-view.ts
- packages/core/src/asset-flow-visual-summary.ts
- packages/core/src/incident-tracing-report.ts
- packages/core/src/token-movement-query.ts
- apps/telegram/src/features/token-movement/tokenMovementHistoryPanel.ts
- docs/README_BATCH_59_HOTFIX.md

## Required check

```bash
npm run typecheck
```

## Commit message

```text
Batch 59 hotfix: align movement panels with core model
```
