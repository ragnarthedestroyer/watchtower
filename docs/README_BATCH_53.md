# README — Batch 53

## Batch

Batch 53: Transaction/message history reader foundation

## Files included

```text
packages/core/src/transaction-history.ts
packages/core/src/index.ts
docs/transaction-message-history-reader-foundation.md
docs/README_BATCH_53.md
```

## What it adds

Adds the read-only core model for account transaction/message history.

This is the foundation for showing raw evidence before Watchtower claims a decoded token movement.

## Safety boundary

Batch 53 does not perform live reads by itself and does not decode final NACKL, SHELL, USDC, or TIP-3 movement. It only defines the structures needed to safely represent observed transactions and messages.

## Required action after upload

Upload/unzip into the repository root while preserving paths.

## Terminal command

```bash
npm run typecheck
```

## Commit message

```text
Batch 53: add transaction history reader foundation
```
