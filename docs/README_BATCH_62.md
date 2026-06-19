# README — Batch 62

## Batch

Batch 62: Token movement API contract foundation

## Files included

- `packages/core/src/token-movement-api-contract.ts`
- `packages/core/src/index.ts`
- `docs/token-movement-api-contract-foundation.md`
- `docs/README_BATCH_62.md`

## What it adds

Adds read-only API request/response contracts and route descriptors for the token movement workstream.

This prepares future server routes for:

- movement query;
- movement history;
- evidence bundles;
- export bundles;
- accumulator / bridge / USDC incident reports.

## Safety boundary

This batch does not add live chain reads, decoding, signing, custody, wallet operations, PrivateNote operations, DEX operations, or transaction broadcasting.

## Required action

Upload/unzip into the repository root, preserving paths.

Then run:

```bash
npm run typecheck
```

## Commit message

```text
Batch 62: add token movement API contract foundation
```
