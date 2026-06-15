# Web snapshot history panel

Batch 34 adds a browser-visible snapshot history panel.

## What changed

The shared API client now supports the server history endpoints:

- `GET /snapshots/history`
- `GET /snapshots/history/detail?snapshot_id=<snapshotId>`
- `POST /snapshots/live/research-save`

The web app now loads the latest in-memory snapshot history when it is connected to the Watchtower server.

## Safety position

Snapshot history is still research/history evidence only.

Stored entries may include blocked snapshots saved through explicit research mode. They must not be treated as confirmed balances or portfolio data.

The current in-memory history resets when the server restarts.

## Required action after upload

No terminal command is required.

After uploading this batch:

1. Commit the files.
2. Check GitHub Actions Typecheck.
