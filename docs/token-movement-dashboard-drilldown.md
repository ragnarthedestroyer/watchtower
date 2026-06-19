# Batch 71 — Token movement dashboard drilldown foundation

Batch 71 adds the frontend drilldown layer for the on-the-fly token movement dashboard.

It is designed for the next UI step after visual cards and quick filters: when the user opens a card, filter, or row, Watchtower can show a focused detail preview without storing wallet history.

## Sections supported

- NACKL mining rewards
- Direct transfers in
- Direct transfers out
- Unresolved or contract-routed flows
- Filter-derived drilldowns for direct NACKL, SHELL, USDC, needs-review, and all cards

## Privacy boundary

The drilldown layer is still on-the-fly only:

- no wallet movement persistence;
- no searched-address storage;
- no browser storage requirement;
- no server-side history retention;
- no wallet-linked analytics;
- no automatic export storage.

Exporting or copying details should remain an explicit user action.

## Safety boundary

The drilldown explains why a row is visible in a section. It does not prove final token ownership, recovery, or decoded transfer truth.

Mining-looking NACKL rows remain separate from ordinary inbound transfers. Accumulator, bridge, PrivateNote, DEX, unknown-token, unknown-direction, and decoder-needed rows remain separated from simple direct transfers.
