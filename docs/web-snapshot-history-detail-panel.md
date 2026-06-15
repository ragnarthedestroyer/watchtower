# Web Snapshot History Detail Panel

Batch 37 adds a detail view for research-saved snapshots in the Web UI.

## What changed

The Web app can now load details for a selected saved research snapshot by calling:

```text
GET /snapshots/history/detail?snapshot_id=<snapshotId>
```

The panel displays:

- stored snapshot metadata;
- policy mode and policy reasons;
- API health evidence;
- Mobile Verifier epoch evidence;
- wallet snapshot records;
- balance candidates.

## Safety behavior

This panel does not confirm balances. It only exposes the evidence already stored by the research snapshot persistence path.

The existing warning remains valid: in-memory research history is temporary and resets when the server restarts.

## Why this matters

This makes research snapshots inspectable from the browser without requiring terminal commands or direct API calls.
