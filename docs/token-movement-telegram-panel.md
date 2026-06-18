# Batch 56 — Telegram token movement history panel

Batch 56 adds a compact Telegram-oriented presentation layer for Token Movement History.

## Goal

Show movement candidates in Telegram without making them look more certain than they are.

The Telegram panel must answer the same user questions as the web model, but in a shorter format:

- what moved;
- direction;
- from / to;
- proof status;
- confidence;
- unresolved warnings.

## Safety rule

Telegram text must keep the same conservative safety boundary as the rest of Watchtower:

- read-only only;
- no signing;
- no wallet operation;
- no private keys or seed phrases;
- unresolved evidence is not presented as confirmed proof.

## Relationship to previous batches

- Batch 51 created the token movement model.
- Batch 52 created the contract registry and labeler.
- Batch 53 created transaction/message history evidence.
- Batch 54 created conservative movement normalization.
- Batch 55 created the web movement history panel.
- Batch 56 creates the Telegram movement history panel foundation.

## Implementation notes

This batch adds a dependency-free renderer that converts a movement history view into Telegram-safe text.

It does not fetch live data and does not decode token transfers directly. It only formats the movement view model prepared by the previous batches.
