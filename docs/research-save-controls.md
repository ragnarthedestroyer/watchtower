# Research save controls

Batch 36 adds UI controls for saving the current live snapshot as temporary research evidence.

## Added behavior

- Web UI shows a button in the Research snapshot history panel.
- Telegram Mini App shows a compact save button in the Research history card.
- The button calls `POST /snapshots/live/research-save` through the shared API client.
- After saving, the apps refresh `/snapshots/history`.
- Saved snapshots remain temporary in-memory research evidence only.

## Safety boundary

This does not confirm balances, does not enable production persistence, and does not mark blocked snapshots as safe. The saved records exist only so decoder and API behavior can be inspected during development.

## Required action after upload

1. Commit the files.
2. Check GitHub Actions → latest Typecheck run.

No terminal command is required.
