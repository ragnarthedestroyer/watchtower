# Telegram status panel foundation

Batch 26 upgrades the Telegram Mini App shell from a compact demo view into a status panel that mirrors the most important parts of the web status panel.

## Added

- Server/client mode visibility.
- Telegram runtime visibility.
- Sanitized server config panel when connected to the backend.
- Live snapshot/fallback snapshot source visibility.
- Wallet snapshot status list.
- Route catalog preview.
- Snapshot-blocking safety reasons.

## Safety posture

This is still a read-only UI layer. It does not decode balances, write snapshots, validate Telegram user identity, or persist watchlists.

## Required action after upload

1. Commit the files.
2. Check GitHub Actions → latest Typecheck run.

No local command is required.
