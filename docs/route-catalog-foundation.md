# Route Catalog Foundation

Batch 22 adds a safe route catalog endpoint:

```text
GET /routes
```

The endpoint returns the currently supported Watchtower server routes, expected query parameters, runtime mode, and safety notes.

## Why this exists

Watchtower now has several read-only diagnostic routes. Before adding more live decoding or persistence, the project needs a simple way to discover what the server supports and how each route should be used.

This helps with:

- manual testing in the browser;
- Telegram/Web client integration;
- deployment smoke tests;
- keeping dangerous assumptions visible;
- separating demo routes from live-read routes.

## Safety model

The route catalog does not expose secrets. It only describes route behavior.

The catalog explicitly marks routes as:

- `demo`
- `live-read`
- `server`

Live-read routes are still read-only. They do not save snapshots and do not confirm balances unless the decoder confidence layer supports it.

## Current route groups

```text
GET /routes
GET /config/status
GET /health
GET /watchlists
GET /snapshots/latest
GET /accounts/raw
GET /accounts/inspect
GET /epoch/mobile-verifier
GET /snapshots/live
```

## Next step

The next implementation step should be a server smoke-test checklist or a small UI diagnostics panel that calls:

```text
/routes
/config/status
/health
/snapshots/live
```

This will make deployment and local testing easier before adding persistence.
