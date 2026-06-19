# Batch 67 — Direct transfer classifier foundation

## Files included

- `packages/core/src/token-movement-direct-transfer-classifier.ts`
- `packages/core/src/index.ts`
- `apps/web/src/features/token-movement/tokenMovementDirectTransferClassifierPanel.ts`
- `apps/telegram/src/features/token-movement/tokenMovementDirectTransferClassifierPanel.ts`
- `docs/token-movement-direct-transfer-classifier.md`
- `docs/README_BATCH_67.md`

## What it adds

This batch adds a conservative on-the-fly classifier for direct NACKL, SHELL, and USDC transfers.

It separates:

- NACKL direct transfers in;
- SHELL direct transfers in;
- USDC direct transfers in;
- NACKL direct transfers out;
- SHELL direct transfers out;
- USDC direct transfers out;
- excluded unresolved or contract-routed rows.

## What it does not do

It does not add live reads, confirmed decoding, persistence, browser storage, analytics, transaction signing, wallet operations, custody, PrivateNote operations, DEX activity, or asset recovery claims.

## Required check

Run:

```bash
npm run typecheck
```

## Suggested commit message

```text
Batch 67: add direct transfer classifier foundation
```
