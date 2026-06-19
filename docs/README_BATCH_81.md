# Batch 81 — Live raw decoder worklist foundation

## Files included

- `packages/core/src/token-movement-live-decoder-worklist.ts`
- `packages/core/src/index.ts`
- `apps/web/src/features/token-movement/tokenMovementLiveDecoderWorklistPanel.ts`
- `apps/telegram/src/features/token-movement/tokenMovementLiveDecoderWorklistPanel.ts`
- `apps/web/src/App.tsx`
- `docs/token-movement-live-decoder-worklist.md`
- `docs/README_BATCH_81.md`

## What this adds

Adds an on-the-fly decoder/review worklist for live raw token movement history.

The frontend can now show not only raw history and raw dashboard grouping, but also what must happen next before rows can become confirmed token movement:

- body decoder needed;
- decoded method review;
- contract-route review;
- mining reward proof needed;
- native value review;
- unusable/incomplete evidence.

## Safety notes

This does not decode token bodies, confirm NACKL/SHELL/USDC transfers, confirm mining rewards, persist wallet history, store searched addresses, sign transactions, or operate wallet/DEX/PrivateNote flows.

## Validation

Run:

```bash
npm run typecheck
```

## Commit message

```text
Batch 81: add live raw decoder worklist foundation
```
