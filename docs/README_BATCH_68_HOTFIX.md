# Batch 68 Hotfix — avoid dashboard type export collision

This hotfix fixes the Batch 68 TypeScript errors caused by two separate modules exporting the same public type names.

## Files changed

- `packages/core/src/token-movement-on-the-fly-frontend-dashboard.ts`
- `packages/core/src/index.ts`
- `apps/web/src/features/token-movement/tokenMovementOnTheFlyFrontendDashboardPanel.ts`
- `apps/telegram/src/features/token-movement/tokenMovementOnTheFlyFrontendDashboardPanel.ts`

## What changed

Batch 64 already exported public types named:

- `TokenMovementFrontendDashboard`
- `TokenMovementFrontendDashboardOptions`
- `TokenMovementFrontendDashboardRow`
- `TokenMovementFrontendDashboardSection`

Batch 68 accidentally reused those names, causing ambiguous barrel exports from `packages/core/src/index.ts`.

This hotfix renames the Batch 68 exported types to the more specific on-the-fly names:

- `TokenMovementOnTheFlyFrontendDashboard`
- `TokenMovementOnTheFlyFrontendDashboardOptions`
- `TokenMovementOnTheFlyFrontendDashboardRow`
- `TokenMovementOnTheFlyFrontendDashboardSection`
- `TokenMovementOnTheFlyFrontendDashboardSourceLike`

It also updates the Web and Telegram panels to import the renamed types, so `watchedAddress` is resolved from the correct options interface.

## Safety boundary

The feature remains read-only and on-the-fly. It does not persist wallet history, searched addresses, browser storage, analytics, keys, signatures, or transactions.

## Validation

After applying this hotfix, run:

```bash
npm run typecheck
```

## Commit message

```text
Batch 68 hotfix: avoid frontend dashboard type export collision
```
