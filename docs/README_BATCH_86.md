# README — Batch 86: DApp ID missing-state diagnostics

## Purpose

Batch 86 improves the live token movement flow while waiting for Acki Nacki developers
to confirm where the production DApp ID is exposed.

It makes the current blocker explicit:

- the legacy account address is known;
- the State V2 `account_id` can be extracted;
- the `dapp_id` is still missing;
- a multifactor address is not automatically a DApp ID;
- Watchtower must not guess.

## Files

- `packages/core/src/token-movement-dapp-id-diagnostics.ts`
- `packages/core/src/index.ts`
- `apps/web/src/features/token-movement/tokenMovementDappIdDiagnosticsPanel.ts`
- `apps/web/src/App.tsx`
- `apps/telegram/src/features/token-movement/tokenMovementDappIdDiagnosticsPanel.ts`
- `docs/token-movement-dapp-id-diagnostics.md`
- `docs/README_BATCH_86.md`

## Behavior

The web dashboard now shows a State V2 diagnostics panel inside the live token movement
section. It can:

- derive the 64-hex `account_id` from `0:<64hex>`;
- validate a typed `dapp_id`;
- show whether State V2 can be attempted;
- show why legacy probing is not enough;
- show a clear curl template waiting for the real DApp ID;
- accept a public multifactor address as contextual evidence only.

## Validation

Run:

```bash
npm run typecheck
```

Then restart the server:

```bash
WATCHTOWER_MODE=live-read WATCHTOWER_GRAPHQL_ENDPOINT=https://mainnet.ackinacki.org/graphql npm run server:dev
```

Open the web dashboard and enter:

```text
0:099e09156b6b0dcc840a815baf279e71e50736c3e81ff1e7fde788ad1780b4c1
```

The diagnostics should show `account_id` extracted and `dapp_id` missing.

## Commit message

```text
Batch 86: add DApp ID missing-state diagnostics
```
