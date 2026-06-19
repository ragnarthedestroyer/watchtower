# Token movement dashboard quick filters

Batch 70 adds quick-filter definitions for the on-the-fly token movement frontend dashboard.

The filters are presentation controls only. They are generated from the already-built in-memory visual-card model and must not cause wallet movement data, searched addresses, selected filters, exports, or user-linked analytics to be stored.

## Filters

- All movement cards
- NACKL mining rewards
- Direct transfers in
- Direct transfers out
- Direct NACKL
- Direct SHELL
- Direct USDC
- Needs review
- Unresolved or contract-routed

## Product purpose

The frontend can now show clear controls for the visual sections the project needs:

- NACKL mining rewards
- SHELL / USDC / NACKL direct transfers in
- SHELL / USDC / NACKL direct transfers out
- unresolved or contract-routed flows

## Safety rules

- NACKL mining rewards stay separate from direct inbound transfers.
- Accumulator, bridge, PrivateNote, DEX, unknown-token, unknown-direction, and decoder-needed rows stay out of simple direct-transfer filters.
- A filter only changes visibility; it does not prove final token ownership, recovery, or settlement.

## Privacy boundary

Quick-filter state must remain on-the-fly UI state. It should not be persisted in browser storage, server storage, analytics, logs, or user profiles.
