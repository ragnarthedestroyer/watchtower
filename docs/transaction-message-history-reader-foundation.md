# Batch 53 — Transaction/message history reader foundation

Batch 53 adds the read-only foundation for account transaction and message history.

It does **not** decode final token movements yet. It prepares the evidence layer that Batch 54 can normalize into token movement rows.

## Product purpose

Watchtower needs to answer asset-flow questions without overstating certainty:

- What transactions/messages were observed?
- Which account were they attached to?
- Which direction did the messages move?
- Which source/destination addresses were visible?
- Was any amount visible?
- Was the payload decoded, partially decoded, or still raw?
- Can this be used as proof, or is it only a clue?

## What this batch adds

New core file:

```text
packages/core/src/transaction-history.ts
```

It defines:

- account history request and response types;
- account identity with legacy address plus optional `dappId` and `accountId`;
- transaction observations;
- inbound/outbound message observations;
- amount observations;
- decode-state and safety classifications;
- reader capability declarations;
- a fixture for the reported SHELL accumulator / USDC recovery incident.

## Safety model

The batch separates raw history from confirmed token movement.

A transaction can be classified as:

```text
safe-observation
partial-observation
unsafe-to-claim
invalid
```

This means the UI can eventually show a raw row like:

```text
Observed outgoing message to suspected accumulator
Token movement: not confirmed yet
Evidence: transaction/message observed
Status: unresolved
```

It must not say:

```text
30,000 SHELL confirmed recovered/lost
```

unless later decoding and proof support that claim.

## Relation to Batch 54

Batch 53 produces the evidence model.

Batch 54 should convert history evidence into normalized `TokenMovement` records only when there is enough decoded and labeled evidence.

## Read-only boundary

This batch does not:

- sign messages;
- ask for seed phrases;
- store private keys;
- submit transactions;
- recover funds;
- operate PrivateNote;
- trade or interact with DEX contracts;
- claim custody or wallet control.
