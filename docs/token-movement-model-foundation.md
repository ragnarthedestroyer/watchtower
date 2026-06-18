# Watchtower Batch 51 — Token Movement Model Foundation

Batch 51 starts the shift from simple balance monitoring to asset traceability.

The goal is to model token movement history before we attempt unsafe or incomplete live decoding.

## Product questions covered by the model

Watchtower should eventually answer:

- What moved?
- From where?
- To where?
- When?
- How much?
- Which token?
- Which contract?
- What likely happened?
- Can we prove it?
- What is still uncertain?

## Asset scope

The model supports:

- NACKL
- SHELL
- USDC
- future TIP-3 assets
- unknown / undecoded assets

## Safety boundary

This batch is read-only. It does not add wallet functionality, signing, trading, DEX behavior, PrivateNote operation, custody, seed phrase handling, or transaction broadcasting.

## Why this is foundation-only

Confirmed balance decoding is not solved yet. Because of that, Batch 51 intentionally creates conservative domain types and research fixtures only.

The model includes proof status, evidence, uncertainty, and warnings so the UI can clearly separate confirmed facts from likely interpretations and unresolved research.

## SHELL accumulator incident

The included SHELL accumulator fixture represents a real user-value scenario: almost 30k SHELL was reportedly sent to an accumulator to recover/get USDC, then disappeared from visible frontend history.

This fixture is not proof. It is a target for later investigation and for Batch 58 reporting.

## Expected next batch

Batch 52 should add a known contract registry and labeler so addresses can be classified as wallet, token wallet, accumulator, bridge, DEX, PrivateNote, unknown contract, or other known roles.
