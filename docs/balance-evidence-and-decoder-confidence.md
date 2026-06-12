# Balance Evidence and Decoder Confidence

Batch 19 adds a conservative evidence summary layer for balance candidates.

## Why this exists

The balance decoder can now find candidate fields such as:

- raw account balance
- possible PopitGame `_rewards` values
- possible PrivateNote-style `_balance` values
- generic balance/reward-like numeric values

These are useful for research, but they are not the same as confirmed wallet balances.

## New behavior

The API now summarizes candidates into a decoder-confidence decision:

- `confirmed` — only when all relevant candidates are confirmed. This is not expected yet.
- `partial` — when useful candidate evidence exists but decoding is not fully confirmed.
- `unresolved` — when no useful balance evidence exists or the evidence is too weak.

Live snapshots now pass this calculated confidence into the snapshot policy instead of hardcoding `unresolved`.

## Safety rule

This does not enable snapshot saving.

A partial decoder may make the live snapshot more informative, but balances must still be shown as research candidates only until ABI/BOC decoding confirms token source, decimals, and wallet ownership semantics.

## New inspector output

`GET /accounts/inspect` now includes:

- `balanceCandidates`
- `balanceEvidence`

The evidence summary helps decide what decoder work should happen next.
