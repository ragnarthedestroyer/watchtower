# Snapshot History Route Foundation

Batch 33 adds read-only snapshot history routes for the server-side in-memory schema store.

## New routes

```text
GET /snapshots/history
GET /snapshots/history/detail?snapshot_id=<snapshotId>
```

## Purpose

The previous batch added `POST /snapshots/live/research-save`, which can store blocked live snapshots as research evidence in server memory.

This batch makes that stored evidence visible through safe read-only routes.

## Important limitations

- The store is still in memory only.
- Data resets when the server restarts.
- Stored blocked snapshots are research/history evidence only.
- Stored balance candidates are not confirmed wallet balances.
- This is not yet production persistence.

## Why this matters

Watchtower needs to preserve the difference between:

```text
confirmed safe snapshots
```

and:

```text
research evidence from blocked or unresolved snapshots
```

This history layer supports that distinction before choosing a real database provider.
