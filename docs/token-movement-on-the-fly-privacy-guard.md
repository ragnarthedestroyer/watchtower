# Batch 65 — On-the-fly privacy guard foundation

Batch 65 adds a small read-only privacy guard for the token movement frontend workstream.

## Goal

Watchtower token movement views should be rendered on the fly without retaining user-specific movement history.

The intended boundary is:

- live/read-only input only;
- in-memory normalization only;
- in-memory frontend rendering only;
- no stored searched wallet addresses;
- no stored movement history;
- no browser storage for wallet movement rows;
- no analytics tied to wallet addresses, transaction IDs, or movement rows;
- no server-side export retention unless the user explicitly changes the product scope later.

## Why this matters

The frontend target is to have separate visuals for:

- NACKL mining rewards;
- direct NACKL / SHELL / USDC transfers in;
- direct NACKL / SHELL / USDC transfers out;
- unresolved or contract-routed flows that still need review.

Those views can provide value without Watchtower becoming a user-history database.

## GDPR positioning

This design reduces data retention risk, but it must not be described as a blanket GDPR exemption. Wallet addresses and transaction history can still become personal data if they are linkable to an identifiable person.

The safer claim is:

> Watchtower is designed to minimise retained user data by rendering wallet-specific token movement views on the fly and not storing wallet movement history.

## Added files

- `packages/core/src/token-movement-on-the-fly-privacy-guard.ts`
- `apps/web/src/features/token-movement/tokenMovementNoStorageNoticePanel.ts`
- `apps/telegram/src/features/token-movement/tokenMovementNoStorageNoticePanel.ts`
- `docs/token-movement-on-the-fly-privacy-guard.md`
- `docs/README_BATCH_65.md`
