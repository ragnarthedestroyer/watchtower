# Web status panel foundation

Batch 25 improves the browser app from a basic landing/status page into an operational Watchtower status panel.

## Added UI sections

- Server connection status
- Sanitized runtime configuration status
- Route catalog grouped by server/status, live-read, and demo routes
- Latest snapshot status
- Live snapshot warnings/errors when available
- Watchlist wallet state table
- Snapshot-blocking reasons

## Safety behavior

The web app still does not write snapshots. It only reads through the shared API client.

When the app is connected to a server through `VITE_WATCHTOWER_API_BASE_URL`, it attempts to load:

- `/config/status`
- `/routes`
- `/snapshots/live`

If `/snapshots/live` is unavailable because the server is still in demo mode or live-read config is incomplete, the app falls back to `/snapshots/latest` and displays a notice.

## Manual action after upload

Required:

1. Commit the files.
2. Check the latest GitHub Actions Typecheck run.

Optional later, when using Codespaces or a local terminal:

```bash
npm install
npm run typecheck
npm run dev:server
```

Then the web app can later be pointed to the server with:

```bash
VITE_WATCHTOWER_API_BASE_URL=http://localhost:8787 npm run dev:web
```
