# README — Batch 56

## Batch

Batch 56: Telegram token movement history panel

## Files

- `packages/core/src/token-movement-telegram-view.ts`
- `packages/core/src/index.ts`
- `apps/telegram/src/features/token-movement/tokenMovementHistoryPanel.ts`
- `docs/token-movement-telegram-panel.md`
- `docs/README_BATCH_56.md`

## What it adds

Adds the Telegram presentation foundation for Token Movement History.

The panel can render compact Telegram-safe summaries for token movement history candidates, including:

- movement direction;
- token and amount;
- from/to short addresses;
- proof status;
- confidence;
- unresolved warnings;
- read-only safety footer.

## What it does not add

- No live transaction fetching.
- No token transfer decoding.
- No wallet operation.
- No signing.
- No seed phrase/private key handling.

## Required command

```bash
npm run typecheck
```

## Commit message

```text
Batch 56: add telegram token movement history panel
```
