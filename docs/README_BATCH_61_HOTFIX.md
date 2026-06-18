# Batch 61 Hotfix: exact optional generatedAt handling

## Files

- `apps/web/src/features/token-movement/tokenMovementExportPanel.ts`
- `apps/telegram/src/features/token-movement/tokenMovementExportPanel.ts`

## Fix

TypeScript with `exactOptionalPropertyTypes` does not allow passing `generatedAt: undefined` to `TokenMovementExportOptions`.

This hotfix changes the Web and Telegram export panels to only include `generatedAt` in the options object when it is actually defined.

## Verify

```bash
npm run typecheck
```

## Commit message

```text
Batch 61 hotfix: fix optional export generatedAt
```
