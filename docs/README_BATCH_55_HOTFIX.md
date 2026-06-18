# Batch 55 Hotfix: Restore core barrel exports

## Problem

Batch 55 overwrote `packages/core/src/index.ts` with only the new Batch 55 export(s). This removed the older core exports used by `apps/server`, `apps/web`, `apps/telegram`, `packages/api`, `packages/db`, and `packages/ui`.

## Fix

Restore the full core barrel export list and append the token movement history modules from Batches 51-55.

## Files

- `packages/core/src/index.ts`
- `docs/README_BATCH_55_HOTFIX.md`

## Validation

Run:

```bash
npm run typecheck
```

## Commit message

```text
Batch 55 hotfix: restore core barrel exports
```
