# Watchtower Batch 77 — Token movement dashboard visible demo entry

## Purpose

Batch 77 makes the token movement dashboard visible in the Web frontend using deterministic synthetic preview data.

This is the first frontend-facing integration point for reviewing the token movement UX before live chain reads, token-body decoding, or real wallet movement history are connected.

## What becomes visible

The Web app now includes a token movement preview panel with:

- dashboard cards for NACKL mining rewards;
- direct transfers in;
- direct transfers out;
- unresolved or contract-routed flows;
- timeline preview rows;
- preview QA status;
- protected classification and privacy rules.

## Why this matters

The project needs a visible and testable frontend before cosmetic UI/UX feedback can be handled properly.

This batch allows review of:

- section order;
- wording;
- spacing;
- density;
- card readability;
- timeline readability;
- safety labels;
- no-storage/privacy wording.

## Safety boundary

This batch still uses synthetic preview rows only.

It does not:

- fetch live chain data;
- decode token transfers;
- persist wallet history;
- store searched addresses;
- use wallet-linked analytics;
- sign transactions;
- broadcast messages;
- custody assets;
- operate PrivateNote;
- trade through DEX functionality.

## Protected rules

Cosmetic UI/UX changes are allowed later, but they must not weaken these rules:

- NACKL mining rewards must stay separate from ordinary inbound transfers.
- Accumulator, bridge, PrivateNote, DEX, unknown-token, unknown-direction, and decoder-needed rows must stay outside simple direct-transfer visuals.
- Synthetic preview rows must not be presented as real wallet history.
- On-the-fly/no-storage behavior must remain the default.

## Files

- `packages/core/src/token-movement-dashboard-visible-demo-entry.ts`
- `packages/core/src/index.ts`
- `apps/web/src/App.tsx`
- `apps/web/src/features/token-movement/tokenMovementDashboardVisibleDemoEntryPanel.ts`
- `apps/telegram/src/features/token-movement/tokenMovementDashboardVisibleDemoEntryPanel.ts`
- `docs/token-movement-dashboard-visible-demo-entry.md`
- `docs/README_BATCH_77.md`
