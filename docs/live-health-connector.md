# Live health connector

Batch 11 adds the first real read-only Acki Nacki network connector.

## What it does

The server can now use live-read mode for:

```text
GET /health
```

When `WATCHTOWER_MODE=live-read` and at least one endpoint is configured, `/health` checks the configured Acki Nacki endpoint and converts the result into the existing Watchtower API trust model.

## What it does not do yet

This batch does not decode balances, read Mobile Verifier epoch data, save snapshots, or validate Telegram users.

It only checks endpoint reachability and safety signals.

## Runtime behavior

In demo mode:

```text
WATCHTOWER_MODE=demo
```

`GET /health` continues to use the demo route.

In live-read mode:

```text
WATCHTOWER_MODE=live-read
WATCHTOWER_GRAPHQL_ENDPOINT=<configured endpoint>
```

`GET /health` performs a read-only GraphQL health request.

If only `WATCHTOWER_REST_ENDPOINT` is configured, the connector performs a simple read-only GET request to that endpoint.

## Snapshot safety

Even with a successful live health check, snapshots remain blocked because epoch data and decoder confidence are still unresolved. This is intentional.

The next steps are:

1. Add a raw account read connector.
2. Add Mobile Verifier root read/epoch decoding.
3. Add snapshot builder protection using live API trust + epoch status.
