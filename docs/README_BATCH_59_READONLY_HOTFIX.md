# Batch 59 readonly-property hotfix

Fixes the TypeScript error in `packages/core/src/token-movement-query.ts` caused by assigning to readonly optional properties `limit` and `offset` after object construction.

The query normalizer now builds the normalized readonly query object in one return expression using conditional spreads.

## Files

- `packages/core/src/token-movement-query.ts`
- `docs/README_BATCH_59_READONLY_HOTFIX.md`

## Command

```bash
npm run typecheck
```

## Commit message

```text
Batch 59 hotfix: fix readonly query normalization
```
