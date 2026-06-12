# Live Snapshot Builder Foundation

Batch 17 adds the first live-read snapshot builder.

## New route

```text
GET /snapshots/live
```

Optional Mobile Verifier root override:

```text
GET /snapshots/live?mv_root_address=0:<64hex>
```

## What it does

- Runs the live health check.
- Reads the Mobile Verifier root account.
- Attempts the conservative MV epoch decoder.
- Reads each enabled wallet in the demo watchlist.
- Builds a `WatchtowerSnapshot` object.
- Applies the existing snapshot safety policy.

## What it does not do yet

- It does not save snapshots.
- It does not decode locked NACKL.
- It does not decode unlocked NACKL.
- It does not claim raw account `balance` is wallet NACKL.
- It does not use a real user-created watchlist yet.

## Expected safety result

For now, live snapshots should normally return `BLOCKED` or `READ_ONLY` because decoder confidence remains unresolved.

That is intentional. The purpose of this batch is to connect the live-read pipeline without creating false balances.
