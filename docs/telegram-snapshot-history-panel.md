# Telegram Snapshot History Panel

Batch 35 adds a compact research-history panel to the Telegram Mini App.

## What changed

The Telegram UI now loads the same server-backed status data as the Web UI when a backend URL is configured:

- sanitized server config status;
- route catalog preview;
- live snapshot source;
- research snapshot history from `/snapshots/history`;
- notices when server-only panels are unavailable or fail to load.

## Safety position

The Telegram Mini App still does not confirm wallet balances. Saved history remains temporary in-memory research evidence until a real database provider and confirmed decoder path are added.

Blocked snapshots may appear in the history only when they were explicitly saved through the research-save route. They must not be presented as confirmed portfolio snapshots.

## Required action after upload

1. Commit the files.
2. Check GitHub Actions → latest Typecheck run.

No terminal command is required.
