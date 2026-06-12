# Mobile Verifier root foundation

Batch 13 adds the first safe Mobile Verifier root read path.

## New route

```text
GET /epoch/mobile-verifier
```

Optional override for research/testing:

```text
GET /epoch/mobile-verifier?address=0:<64hex>
```

## What it does now

- Uses the same live-read protection as raw account reads.
- Reads the Mobile Verifier root account as a raw legacy account.
- Returns a structured Mobile Verifier epoch object.
- Keeps the epoch status as `UNKNOWN` because ABI/BOC decoding is not implemented yet.
- Marks the decoder as `unresolved`.
- Keeps snapshots blocked until decoding becomes confirmed.

## Default root

The default Mobile Verifier root address is currently:

```text
0:2222222222222222222222222222222222222222222222222222222222222222
```

This came from earlier Watchtower prototype research and remains isolated in the API package as a constant.

## What this intentionally does not do

- It does not decode `_epochStart`.
- It does not decode `_epochEnd`.
- It does not save snapshots.
- It does not claim balance correctness.
- It does not mark the network epoch as active.

## Next step

The next batch should add a decoder research boundary: a dedicated module for raw account extraction and ABI/BOC decoding attempts, with strict confidence flags.
