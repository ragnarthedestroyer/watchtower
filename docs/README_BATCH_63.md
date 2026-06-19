# README — Batch 63

## Batch

Batch 63: Token movement API route stub foundation

## Files included

- `packages/core/src/token-movement-api-stubs.ts`
- `packages/core/src/index.ts`
- `apps/server/src/features/token-movement/tokenMovementApiRouteStubs.ts`
- `docs/token-movement-api-route-stubs.md`
- `docs/README_BATCH_63.md`

## What it adds

Adds deterministic read-only API route stubs for the token movement API contract.

The stubs cover:

- query;
- history;
- evidence bundle;
- export;
- accumulator / bridge / USDC incident report.

## Safety boundary

This batch does not add live chain reads, token decoding, persistence, signing, custody, wallet operations, PrivateNote operations, DEX operations, or transaction broadcasting.

## Required action

Upload/unzip into the repository root, preserving paths.

Then run:

```bash
npm run typecheck
```

## Commit message

```text
Batch 63: add token movement API route stubs
```
