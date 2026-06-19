# Batch 82 — Live raw token movement route registration hotfix

## Purpose

This hotfix ensures the live raw token movement endpoint is mounted in the server router:

```text
GET /api/token-movements/live-raw-history
```

The issue observed in Codespaces was that `/health` and `/config/status` worked, but the live token movement route fell through to the older demo-route fallback:

```text
Route not found: /api/token-movements/live-raw-history
Available demo routes: /health, /watchlists, /snapshots/latest.
```

That means the server process was alive, but the new route was not registered in the active `apps/server/src/routes.ts` file.

## Safety boundary

The route remains read-only and on-the-fly:

- no wallet history storage;
- no searched-address storage;
- no browser storage;
- no analytics;
- no signing;
- no custody;
- no PrivateNote operation;
- no DEX operation.

## Expected test

After applying this hotfix and restarting the backend, this URL should no longer return `Route not found`:

```text
/api/token-movements/live-raw-history?address=0:<64hex>&limit=25
```

It may still return a live-read, GraphQL, empty-history, rate-limit, or decoding-related response. That is acceptable. The goal of this hotfix is only to make sure the route is actually registered.
