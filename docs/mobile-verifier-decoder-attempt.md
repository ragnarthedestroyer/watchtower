# Mobile Verifier Decoder Attempt

Batch 15 adds the first conservative Mobile Verifier epoch decoder layer.

## What it does

The decoder searches raw account responses for known epoch-like field names:

- `_epochStart`
- `_epochEnd`
- `_reward_last_time`
- `_reward_period`
- `_prevEpochDuration`

It also accepts common naming variants such as `epoch_start`, `epochEnd`, and `previousEpochDuration`.

## What it does not do yet

This batch does **not** perform full ABI/BOC decoding.

If the GraphQL account response does not already contain decoded fields, the decoder will remain `unresolved`. This is expected and safe.

## Safety rule

A decoder status of `unresolved` or `partial` must not be treated as a valid epoch for snapshot saving.

Only a confirmed epoch window should be considered for future snapshot policy decisions.

## New behavior

`GET /epoch/mobile-verifier` now returns additional research fields when available:

- `decoderStatus`
- `decodedFields`
- `matchedFieldPaths`
- `warnings`

This allows research without making false balance or epoch claims.
