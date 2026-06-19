# Batch 83 — Live raw route defensive fallback hotfix

Batch 83 hardens the live raw token movement route registration.

## Problem fixed

The server was running in `live-read` mode and `/config/status` showed `graphqlEndpointConfigured: true`, but this route still returned the legacy demo-router error:

```text
Route not found: /api/token-movements/live-raw-history
Available demo routes: /health, /watchlists, /snapshots/latest.
```

That means the request reached the API fallback router instead of the live route handler.

## What this batch changes

This batch registers the live raw token movement route in two places:

1. the server router, and
2. the API fallback router used by `handleWatchtowerRequest`.

This makes the route more robust while the server/frontend wiring is still evolving.

## Route

```text
GET /api/token-movements/live-raw-history?address=0:<64hex>&limit=25
```

## Safety boundary

The route remains read-only and on-the-fly.

It does not store wallet history, searched addresses, decoded transfers, browser data, analytics, keys, signatures, custody data, PrivateNote operations, or DEX operations.

Returned rows remain raw chain evidence until later decoder batches classify them.
