# Batch 72 — Token movement dashboard timeline foundation

Batch 72 adds a frontend-ready timeline model for Watchtower token movement views.

The goal is to support a clear visual table/timeline answering:

- what moved;
- from where;
- to where;
- when;
- how much;
- whether the row is safe, needs review, or is unresolved.

## Scope

This batch consumes the existing in-memory Batch 68 frontend dashboard model and creates timeline groups by observed date.

The timeline keeps the existing section boundaries:

- NACKL mining rewards;
- direct transfers in;
- direct transfers out;
- unresolved or contract-routed flows.

## Privacy boundary

The timeline is an on-the-fly view only.

It must not persist:

- wallet movement history;
- searched addresses;
- selected rows;
- selected filters;
- dashboard state;
- exports;
- wallet-linked analytics.

## Safety boundary

The timeline is a visual organization aid. It does not prove final token ownership, recovery, bridge completion, DEX state, or PrivateNote state.

Unresolved accumulator, bridge, PrivateNote, DEX, unknown-token, unknown-direction, and decoder-needed rows remain separated from direct transfer visuals.
