# API Route Foundation

This batch adds a framework-neutral demo API router.

The router is intentionally based on the standard `Request` and `Response` objects instead of a specific server framework. This keeps the project flexible for later deployment through Next.js, Vercel functions, Cloudflare Workers, a Node server, or another web runtime.

## Demo routes

- `GET /health`
- `GET /watchlists`
- `GET /snapshots/latest`

## Current limitations

- Routes return demo data only.
- There is no authentication yet.
- There is no persistent database connection yet.
- Snapshot data remains policy-blocked until real API trust, epoch, and decoder confidence are implemented.

## Next target

The next implementation step is to connect the web and Telegram shells to this API contract through a shared client layer, while keeping the current demo fallback available for local development.
