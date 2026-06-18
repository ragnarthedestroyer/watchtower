# Batch 54 — Token movement normalizer

Batch 54 converts Batch 53 transaction/message observations into conservative Token Movement candidates.

It still does **not** solve live token decoding, confirmed balance decoding, recovery, custody, wallet operations, or transaction submission.

## Product purpose

The normalizer prepares Watchtower to show asset-flow rows like:

```text
Observed outgoing message to suspected accumulator
Token: SHELL candidate
Amount: reported/observed but unconfirmed
Proof: possible
Status: decoder review required
```

Instead of unsafe claims like:

```text
30,000 SHELL confirmed lost or recovered
```

## What this batch adds

New core file:

```text
packages/core/src/token-movement-normalizer.ts
```

It adds:

- account-history to token-movement normalization;
- message-to-movement candidate conversion;
- confidence and proof-status classification;
- direction mapping: incoming, outgoing, internal, unknown;
- token inference from amount unit and known-contract labels;
- uncertainty generation for token, amount, decode state, safety, and parties;
- decisions explaining why a candidate was created, skipped, or still needs decoder work.

## Safety model

The normalizer creates candidates only when there is enough observational evidence.

A candidate can be created from:

- a source or destination address;
- an observed amount;
- a decoded method;
- message evidence attached to a transaction.

Candidates remain visibly uncertain unless the transaction, message, token, and amount are all confirmed.

## SHELL accumulator incident relevance

This batch prepares the model needed for the reported incident where almost 30k SHELL was sent to an accumulator for a USDC recovery/get-back flow and then disappeared from the visible frontend.

The normalizer can represent this as an unresolved candidate flow, but it must not claim final proof until later batches can attach real transaction/message IDs, contract labels, decoded payloads, and cross-check evidence.

## Relationship to other batches

- Batch 51: Token movement model.
- Batch 52: Known contract registry and labeler.
- Batch 53: Transaction/message history evidence model.
- Batch 54: Normalized token movement candidates.
- Batch 55: Web panel for token movement history.

## Read-only boundary

This batch does not:

- sign messages;
- ask for seed phrases;
- store private keys;
- submit transactions;
- operate PrivateNote;
- recover assets;
- trade or interact with DEX contracts;
- become a wallet or custody tool.
