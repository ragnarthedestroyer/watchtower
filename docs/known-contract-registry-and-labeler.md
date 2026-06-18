# Watchtower Batch 52 — Known Contract Registry and Labeler

Batch 52 adds the read-only foundation for labeling known, suspected, or user-defined contracts before live transaction history is normalized.

## Why this matters

Token movement history is only useful if Watchtower can explain what an address probably represents.

The product should eventually say things like:

- `wallet -> suspected accumulator`
- `token wallet -> token wallet`
- `wallet -> bridge candidate`
- `wallet -> unknown contract`
- `contract -> user wallet`

This is especially important for the unresolved SHELL / USDC recovery incident, where almost 30k SHELL was reportedly sent to an accumulator and then disappeared from visible frontend history.

## What this batch adds

- A shared known-contract registry type.
- A conservative address normalizer.
- A labeler for individual addresses.
- A labeler for Token Movement parties and movements.
- Research-only templates for accumulator, TIP-3 root, and PrivateNote-related roles.

## Important safety rule

Batch 52 ships with **no enabled hard-coded contract addresses**.

That is intentional. A wrong label could make Watchtower look more certain than it really is.

Addresses should become enabled registry entries only when they are:

1. confirmed by official documentation;
2. confirmed by ABI and chain observation;
3. manually supplied by the user as a local label; or
4. clearly marked as possible/probable with evidence and warnings.

## Registry confidence is not movement proof

A contract label can help explain a flow, but it does not prove that funds moved, were received, were converted, or are recoverable.

Example:

```text
Address role: accumulator
Label confidence: possible
Movement proof: unknown
```

That means Watchtower may describe a likely path, but must still show uncertainty.

## Relationship to Batch 51

Batch 51 created the token movement model. Batch 52 lets those movements be enriched with address labels.

Batch 53 should add the transaction/message history reader foundation.

## Read-only boundary

This batch does not add wallet functionality, private-key handling, seed phrases, signing, broadcasting, trading, custody, DEX behavior, or PrivateNote operations.
