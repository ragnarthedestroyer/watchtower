# Environment config validation

Batch 10 adds a first validation layer for Watchtower runtime configuration.

The server now reads environment values through `apps/server/src/env.ts` and normalizes them into a shared `WatchtowerEndpointConfig` from `@watchtower/core`.

## Runtime modes

`WATCHTOWER_MODE=demo`

Uses built-in demo data. This is the safe default.

`WATCHTOWER_MODE=live-read`

Prepares the server for real Acki Nacki reads. In this mode the server expects at least one of:

- `WATCHTOWER_GRAPHQL_ENDPOINT`
- `WATCHTOWER_REST_ENDPOINT`

## Config status route

The server exposes:

```text
GET /config/status
```

This route reports only safe configuration status, not secret values.

It shows whether these are configured:

- GraphQL endpoint
- REST endpoint
- DApp ID
- API key
- Block Manager endpoint

It also returns warnings and errors.

## Why this exists before real network calls

Watchtower must not silently switch from demo data to live chain reads. The configuration layer makes runtime mode explicit and blocks unsafe live-read startup conditions before the network connector is added.

This is also aligned with the State V2 transition: Watchtower must be ready for DApp ID + Account ID reads instead of relying only on legacy `0:<account>` addresses.
