# Batch 59 — Token movement query foundation

Batch 59 adds the first query/filter layer for Watchtower Token Movement History.

It does not fetch live history and does not decode token transfers. It takes movement candidates produced by the existing foundation and lets the UI/API layer filter them safely.

## Why this matters

After Batch 58, Watchtower can model token movements, labels, visual summaries, and incident reports. The next step is to let the user narrow the evidence without losing uncertainty.

For example:

- show only unresolved SHELL movements;
- show only USDC / TIP-3 candidates;
- show only movements that still need a decoder;
- show only incident-relevant candidates;
- sort by time, token, proof status, confidence, or direction.

## Safety rule

Filtering is display-only. A query must never trigger a transaction, wallet action, DEX action, bridge action, PrivateNote action, or signer flow.

## Added pieces

- `packages/core/src/token-movement-query.ts`
  - query model;
  - preset model;
  - filtering;
  - sorting;
  - pagination;
  - warning generation.

- `apps/web/src/features/token-movement/tokenMovementQueryPanel.ts`
  - simple dependency-free HTML renderer for query status and presets.

- `apps/telegram/src/features/token-movement/tokenMovementQueryPanel.ts`
  - compact Telegram-safe text renderer.

## Presets

Batch 59 defines these default presets:

1. All recent movement candidates
2. Unresolved SHELL movements
3. USDC / bridge review
4. Decoder needed

## What this still does not do

- It does not query the blockchain.
- It does not decode TIP-3 transfers.
- It does not prove that an accumulator or bridge action happened.
- It does not decide ownership or custody.
- It does not claim that an unresolved incident is solved.
