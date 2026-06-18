# Batch 51 — Token Movement Model Foundation

## Files included

- `packages/core/src/token-movement.ts`
- `packages/core/src/index.ts`
- `docs/token-movement-model-foundation.md`

## What it adds

Adds the shared Token Movement History model for NACKL, SHELL, USDC, TIP-3, and unknown assets.

It adds conservative types for:

- amount
- token
- sender/source
- recipient/destination
- contract / via account
- evidence
- proof status
- uncertainty
- warnings
- tags

It also adds research fixtures for:

- unresolved SHELL accumulator / USDC recovery incident
- generic NACKL movement
- generic USDC / TIP-3 movement

## Required action after upload

Copy the files into the repository root, preserving paths.

## Terminal command needed

```bash
npm run typecheck
```

## Commit message

```text
Batch 51: add token movement model foundation
```
