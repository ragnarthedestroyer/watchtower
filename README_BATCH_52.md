# Batch 52 — Known Contract Registry and Labeler

## Files included

- `packages/core/src/known-contract-registry.ts`
- `packages/core/src/index.ts`
- `docs/known-contract-registry-and-labeler.md`

## What it adds

Adds a read-only known-contract registry and labeler foundation for Token Movement History.

It supports labels for roles such as:

- wallet
- token wallet
- token root
- accumulator
- bridge
- DEX
- PrivateNote-related contract
- multifactor/account-control contract
- generic contract
- unknown address

It also adds disabled research templates for:

- SHELL accumulator / USDC recovery candidate
- TIP-3 token root candidate
- PrivateNote-related contract candidate

No enabled hard-coded contract addresses are included in this batch.

## Required action after upload

Copy the files into the repository root, preserving paths.

## Terminal command needed

```bash
npm run typecheck
```

## Commit message

```text
Batch 52: add known contract registry and labeler
```
