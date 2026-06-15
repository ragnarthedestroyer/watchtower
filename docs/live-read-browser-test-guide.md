# Live-read browser testing guide

This guide explains how to test Watchtower without needing to understand a full local development workflow.

## Goal

The current project can already expose safe backend routes. The next useful validation is to open those routes in a browser and inspect the returned JSON.

This does not confirm balances. It only proves whether the server can reach the configured Acki Nacki endpoint and whether the raw account inspection flow returns useful evidence.

## Required environment values

For demo-only testing, no live endpoint is required.

For live-read testing, set at least one endpoint:

```env
WATCHTOWER_RUNTIME_MODE=live-read
WATCHTOWER_GRAPHQL_ENDPOINT=<acki-nacki-graphql-endpoint>
WATCHTOWER_REST_ENDPOINT=<optional-rest-endpoint>
WATCHTOWER_DAPP_ID=<optional-state-v2-dapp-id>
```

Do not commit `.env`.

## Routes to test first

Start with the safe non-wallet routes:

```text
GET /health
GET /config/status
GET /routes
```

Then test read-only account routes:

```text
GET /accounts/inspect?address=0:<64hex>
GET /accounts/raw?address=0:<64hex>
```

For State V2:

```text
GET /accounts/inspect?account_id=<64hex>&dapp_id=<64hex>
GET /accounts/raw?account_id=<64hex>&dapp_id=<64hex>
```

## Expected result

A healthy test does not need to show confirmed balances yet.

At this phase, success means:

- the server responds;
- config status is understandable;
- account inspection returns a structured response;
- decoder hints and warnings are visible;
- balance candidates, if present, are clearly marked as research evidence only.

## Unsafe result

Treat the result as unsafe if:

- the API is rate-limited;
- the endpoint is unreachable;
- every wallet suddenly appears as zero;
- Mobile Verifier epoch is unknown or stale;
- decoder confidence remains unresolved.

Unsafe data must not be used as a confirmed wallet snapshot.
