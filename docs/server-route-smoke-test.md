# Server Route Smoke Test

This document describes the first manual smoke-test layer for the Watchtower server.

## Purpose

The smoke test checks whether the server is reachable and whether the current safe routes respond with JSON.

It does **not** prove that balances are decoded correctly.
It does **not** prove that snapshots are safe to save.
It does **not** bypass the snapshot policy.

## File added

```text
apps/server/scripts/smoke-test.mjs
```

## How to run

Start the server first:

```bash
npm run dev:server
```

Then, in another terminal:

```bash
node apps/server/scripts/smoke-test.mjs
```

By default it tests:

```text
http://localhost:8787
```

To test another server URL:

```bash
WATCHTOWER_API_BASE_URL=https://your-server.example node apps/server/scripts/smoke-test.mjs
```

## Routes checked

```text
GET /health
GET /config/status
GET /routes
GET /watchlists
GET /snapshots/latest
GET /epoch/mobile-verifier
GET /snapshots/live
```

## Expected result in demo mode

The basic server routes should respond.

Live-read routes may still return blocked, partial, unresolved, or warning-heavy responses. That is acceptable at this stage. The point is to confirm that the server route exists and returns a structured response.

## Safety rule

A successful smoke test means:

```text
The server route is reachable.
```

It does not mean:

```text
The wallet balance is confirmed.
The Mobile Verifier epoch is decoded.
The snapshot is safe to save.
```

Those confirmations must still come from the decoder confidence and snapshot policy layers.
