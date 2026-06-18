# Batch 61 — Token movement export foundation

Batch 61 adds a read-only export layer for token movement evidence.

The goal is to let Watchtower turn movement candidates and evidence records into reusable export bundles without claiming that unresolved records are confirmed.

## Supported export views

- JSON
- CSV
- Markdown

## Supported scopes

- all
- confirmed
- unresolved
- decoder-needed
- incident-review

## Safety boundary

The export layer is read-only. It does not fetch live history, decode token transfers, sign messages, store keys, request seed phrases, or operate wallets.

Unresolved rows must remain visibly unresolved. Candidate rows must not be used as proof of asset loss, recovery, bridge execution, or token receipt without stronger evidence.

## Why this matters

For the SHELL accumulator / USDC recovery incident, the user needs a clear evidence package that separates:

- what was observed;
- what is suspected;
- what is missing;
- what still requires decoder or contract-level confirmation.
