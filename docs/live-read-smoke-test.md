# Live-read smoke test

This document describes the optional live-read smoke test script added in Batch 24.

The script is intentionally separate from CI. It is for local/manual validation after the server is running.

## Script

```text
apps/server/scripts/live-read-smoke-test.mjs
```

## Purpose

The script calls the current safe Watchtower routes and prints a compact status summary.

It checks:

```text
GET /health
GET /config/status
GET /routes
GET /watchlists
GET /snapshots/latest
GET /epoch/mobile-verifier
GET /snapshots/live
```

When a test wallet address is provided, it also checks:

```text
GET /accounts/raw?address=0:<64hex>
GET /accounts/inspect?address=0:<64hex>
```

## Usage

Start the server first:

```bash
npm run dev:server
```

In another terminal, run:

```bash
node apps/server/scripts/live-read-smoke-test.mjs
```

To test a specific legacy account:

```bash
WATCHTOWER_TEST_ADDRESS="0:<64hex>" node apps/server/scripts/live-read-smoke-test.mjs
```

To test a specific Mobile Verifier root override:

```bash
WATCHTOWER_TEST_MV_ROOT_ADDRESS="0:<64hex>" node apps/server/scripts/live-read-smoke-test.mjs
```

To test a non-default server URL:

```bash
WATCHTOWER_API_BASE_URL="http://localhost:8787" node apps/server/scripts/live-read-smoke-test.mjs
```

## Safety

This script only performs read requests against Watchtower server routes.

It does not save snapshots, submit transactions, connect wallets, or decode balances as confirmed values.

## Expected result in demo mode

Most routes should return HTTP 200.

Live-read routes may still return blocked/read-only responses depending on configuration and endpoint availability.

A blocked snapshot is acceptable at this stage because decoder confidence is still intentionally conservative.
