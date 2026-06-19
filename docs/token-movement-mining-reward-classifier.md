# Batch 66 — NACKL mining reward classifier foundation

Batch 66 adds a read-only, on-the-fly classifier that keeps NACKL mining rewards visually separate from normal transfers.

## Goal

The frontend should not show one generic transaction list only. It should separate:

- NACKL mining rewards;
- direct NACKL / SHELL / USDC transfers in;
- direct NACKL / SHELL / USDC transfers out;
- unresolved or contract-routed flows.

## Why this matters

NACKL mining rewards are not the same user story as direct transfers. A user trying to understand wallet activity needs to see rewards separately from assets sent or received manually.

The unresolved section remains important because Watchtower must not incorrectly classify accumulator, bridge, PrivateNote, DEX, unknown-token, or decoder-needed records as simple transfers.

## Privacy boundary

The classifier is designed for in-memory rendering only. It should not store searched addresses, movement rows, wallet histories, or classification results.

## Added files

- `packages/core/src/token-movement-mining-reward-classifier.ts`
- `apps/web/src/features/token-movement/tokenMovementMiningRewardClassifierPanel.ts`
- `apps/telegram/src/features/token-movement/tokenMovementMiningRewardClassifierPanel.ts`
- `docs/token-movement-mining-reward-classifier.md`
- `docs/README_BATCH_66.md`

## Safety boundary

This batch does not fetch live data, decode token transfers, persist user data, use browser storage, use analytics, sign transactions, custody assets, operate PrivateNote, trade, or provide DEX functionality.
