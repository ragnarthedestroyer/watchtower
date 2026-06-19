# Token movement dashboard UI/UX review foundation

Batch 74 adds a safe way to capture cosmetic UI and UX feedback after the token movement frontend becomes visible and testable.

The goal is to make UI iteration possible without mixing cosmetic changes into decoder, API, privacy, or classification work.

## What this supports

- layout comments;
- visual density comments;
- copy and label comments;
- mobile comments;
- accessibility comments;
- card, quick-filter, drilldown, timeline and session-state feedback;
- explicit routing for privacy, safety-labeling and classification-sensitive comments.

## Protected boundaries

Cosmetic changes are allowed, but they must not weaken these rules:

- NACKL mining rewards stay separate from direct inbound transfers.
- Accumulator, bridge, PrivateNote, DEX, unknown and decoder-needed rows stay out of simple direct-transfer visuals.
- Wallet history, searched addresses, movement rows and wallet-linked analytics are not persisted.
- The UI must not look like a wallet, exchange, betting client, signer or custody interface.
- Unresolved rows must not look confirmed unless decoder/evidence layers support that conclusion.

## Status

Read-only frontend-review foundation only. No persistence, no analytics, no live reads, no decoding, no signing and no wallet operation.
