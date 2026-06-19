# Token movement live decoder worklist

Batch 81 adds a read-only decoder worklist for live raw token movement history.

## Purpose

The live dashboard can now show real raw evidence, but raw messages are still not safe token movement claims. This batch turns those live raw rows into a practical checklist of what needs to be decoded or reviewed before Watchtower can classify movement as:

- NACKL mining rewards;
- direct NACKL/SHELL/USDC transfers in;
- direct NACKL/SHELL/USDC transfers out;
- unresolved contract-routed flows.

## Worklist categories

- `body-decoder-needed` — message body or hash exists and needs ABI/body decoding.
- `decoded-method-review` — method/partial decoding exists but still needs token/contract context.
- `contract-route-review` — known contract labels or route hints require safety review.
- `mining-reward-proof-needed` — inbound value evidence needs mining-source proof before being called a reward.
- `native-value-review` — value exists but native-unit meaning still needs confirmation.
- `unusable-evidence` — not enough message-level evidence to classify.

## Safety boundary

This batch does not decode tokens, confirm balances, confirm rewards, persist wallet history, store searched addresses, use analytics, sign transactions, operate wallets, operate PrivateNote, or touch DEX flows.

The output remains on-the-fly and evidence-first.
