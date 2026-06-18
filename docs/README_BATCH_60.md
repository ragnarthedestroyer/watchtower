# Watchtower Batch 60

## Name

Token movement evidence bundle foundation

## Files

- `packages/core/src/token-movement-evidence-bundle.ts`
- `packages/core/src/index.ts`
- `apps/web/src/features/token-movement/tokenMovementEvidenceBundlePanel.ts`
- `apps/telegram/src/features/token-movement/tokenMovementEvidenceBundlePanel.ts`
- `docs/token-movement-evidence-bundle.md`
- `docs/README_BATCH_60.md`

## What it adds

A read-only evidence bundle layer for token movement candidates.

It summarizes observed facts, evidence, uncertainty, missing proof, and recommended next checks before a movement is treated as a user-facing conclusion.

## Safety

No signing, no wallet operations, no trading, no custody, no recovery, no PrivateNote operations, and no proof claim for unresolved evidence.

## Required check

```bash
npm run typecheck
```

## Commit message

```text
Batch 60: add token movement evidence bundle foundation
```
