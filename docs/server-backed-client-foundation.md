# Server-backed client foundation

Batch 21 connects the frontend API client shape to the real server routes without removing the local demo transport.

## What changed

- The shared API client now supports two transport modes:
  - local demo transport
  - real HTTP/fetch transport
- The client now includes methods for:
  - `GET /config/status`
  - `GET /accounts/raw`
  - `GET /accounts/inspect`
  - `GET /epoch/mobile-verifier`
  - `GET /snapshots/live`
- Web and Telegram apps now choose their API client mode from:
  - `VITE_WATCHTOWER_API_BASE_URL`

## Runtime behavior

If `VITE_WATCHTOWER_API_BASE_URL` is missing, the apps keep using the local demo transport.

If `VITE_WATCHTOWER_API_BASE_URL` is set, the apps use real HTTP requests against the server.

Example:

```env
VITE_WATCHTOWER_API_BASE_URL=http://localhost:8787
```

## Safety status

This does not enable snapshot saving.

Live snapshots remain read-only and remain blocked unless the snapshot policy allows saving.
