# Batch 55 — Web token movement history panel

Batch 55 adds the first web-facing presentation layer for Token Movement History.

It is intentionally conservative. The panel displays movement candidates from the Batch 54 normalizer, but it keeps proof status, uncertainty, warnings, and review needs visible.

## What this batch adds

- A core view-model builder for token movement history.
- A dependency-free web panel renderer.
- Summary counters for visible movements, confirmed rows, candidate rows, unknown-token rows, and rows needing review.
- Row-level labels for time, direction, token, amount, from, to, likely action, proof status, uncertainty count, warnings, and tags.
- A safety banner so candidate rows are not confused with confirmed transaction history.

## What this batch does not add

- No live transaction fetching.
- No token decoding claims.
- No wallet connection.
- No signing, custody, trading, bridge operation, or PrivateNote operation.
- No route integration yet.

## Intended flow

```text
Batch 53 raw transaction/message observations
→ Batch 54 token movement candidates
→ Batch 55 web-friendly view model + panel rendering
→ Batch 56 Telegram panel
→ Batch 57 visual asset-flow summary
```

## Safety rule

Any row with `proofStatus` other than `confirmed` must remain visually marked as a candidate or unresolved observation.

The SHELL accumulator incident must remain unresolved until Watchtower can attach real transaction/message evidence.
