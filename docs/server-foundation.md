# Server Foundation

This batch adds the first real backend application under `apps/server`.

The server is intentionally small and dependency-light. It uses Node's built-in HTTP server and delegates route behavior to the framework-neutral API router in `@watchtower/api`.

## Current routes

- `GET /health`
- `GET /watchlists`
- `GET /snapshots/latest`
- `OPTIONS *` for basic CORS preflight support

## Current behavior

The server still returns demo Watchtower data. This is deliberate. The goal of this batch is to prove that Web, Telegram, and backend can share one API contract before replacing demo data with live Acki Nacki network reads.

## Local run

After installing dependencies:

```bash
npm run server:dev
```

Default local URL:

```text
http://localhost:8787
```

Optional environment variables:

```env
HOST=0.0.0.0
PORT=8787
WATCHTOWER_ALLOWED_ORIGIN=*
```

## Next target

The next batch should add a real environment/config validation layer for Acki Nacki endpoints, followed by a real API health probe that can detect:

- endpoint reachable/unreachable
- slow response
- HTTP 429 rate limit
- Cloudflare/API outage signals
- stale or unusable data responses
