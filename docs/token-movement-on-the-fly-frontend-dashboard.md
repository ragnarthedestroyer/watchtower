# Token movement on-the-fly frontend dashboard

Batch 68 adds a frontend-ready dashboard composer for token movement visuals.

## Purpose

The dashboard combines the previous mining-reward and direct-transfer classifiers into one view model that can power the Web UI and Telegram summaries.

It provides four top-level visual sections:

1. NACKL mining rewards
2. Direct transfers in
3. Direct transfers out
4. Unresolved or contract-routed flows

## Why this matters

NACKL mining rewards should not be mixed with ordinary inbound transfers.

Direct SHELL, USDC, and NACKL transfers should be visible separately for incoming and outgoing movement.

Accumulator, bridge, PrivateNote, DEX, unknown-token, unknown-direction, and decoder-needed flows must remain in the unresolved/routed section until there is stronger evidence.

## Privacy posture

The dashboard is designed for on-the-fly rendering only. It does not store wallet history, searched addresses, movement rows, exports, browser storage, or wallet-linked analytics.

This is a data-minimisation and no-retention design. It is not a claim that GDPR can be ignored.

## Safety boundary

This batch is read-only. It does not fetch live chain data, decode token transfers, sign transactions, broadcast messages, operate wallets, custody assets, trade, or operate PrivateNote.
