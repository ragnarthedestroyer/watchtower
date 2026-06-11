# API Client Foundation

This batch adds a shared client layer for the web app and the Telegram Mini App.

The client calls the framework-neutral API router through standard `Request` and `Response` objects. For now, the default transport is still local and demo-only, but the apps no longer import demo builders directly.

## Why this matters

The apps now depend on the API contract instead of internal demo functions. That makes it easier to replace the local demo transport with a real hosted backend later.

## Current client calls

- `getHealth()`
- `getWatchlists()`
- `getLatestSnapshot()`

## Current limitations

- No deployed backend URL yet.
- No Telegram init-data verification yet.
- No persistent database calls yet.
- Snapshot data remains blocked by policy until real API trust, epoch, and decoder confidence exist.

## Next target

Add wallet identity input validation and form-ready API helpers so users can create watchlists with legacy or State V2 account identifiers.
