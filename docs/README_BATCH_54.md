# README — Batch 54

## Batch

Batch 54: Token movement normalizer

## Files included

```text
packages/core/src/token-movement-normalizer.ts
packages/core/src/index.ts
docs/token-movement-normalizer.md
docs/README_BATCH_54.md
```

## What it adds

Adds the conservative core normalizer that converts Batch 53 transaction/message observations into Batch 51 `TokenMovement` candidates.

It uses Batch 52 known-contract labels when available and keeps unresolved or undecoded cases visible through proof status, warnings, uncertainty, and normalization decisions.

## Safety boundary

Batch 54 does not perform live reads, decode balances, sign, broadcast, recover funds, operate wallets, or claim custody.

It does not mark movements as confirmed unless the provided transaction/message evidence is already decoded, confirmed, and safe.

## Required action after upload

Upload/unzip into the repository root while preserving paths.

## Terminal command

```bash
npm run typecheck
```

## Commit message

```text
Batch 54: add token movement normalizer
```
