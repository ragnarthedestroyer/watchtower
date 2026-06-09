# Watchtower Environment Template

## Purpose

This document defines the first environment variable set for a clean Watchtower deployment.

Do not reuse R4T environment variables or secrets.

## Core Variables

```bash
WATCHTOWER_APP_ENV=development
WATCHTOWER_PUBLIC_APP_URL=
WATCHTOWER_DATABASE_URL=
WATCHTOWER_ADMIN_SECRET=
```

## Telegram

```bash
WATCHTOWER_TELEGRAM_BOT_TOKEN=
WATCHTOWER_TELEGRAM_BOT_USERNAME=
WATCHTOWER_TELEGRAM_WEBAPP_URL=
```

## Acki Nacki / API

```bash
WATCHTOWER_GRAPHQL_ENDPOINT=
WATCHTOWER_API_TIMEOUT_MS=30000
WATCHTOWER_API_DELAY_BETWEEN_REQUESTS_MS=2500
WATCHTOWER_API_MAX_RETRIES=2
```

## State V2 / SDK

These are placeholders until the official migration path is implemented.

```bash
WATCHTOWER_DEFAULT_DAPP_ID=
WATCHTOWER_ENABLE_STATE_V2=false
WATCHTOWER_ALLOW_LEGACY_ADDRESS_MODE=true
```

## Snapshot Policy

```bash
WATCHTOWER_MIN_SUCCESSFUL_TARGETS=8
WATCHTOWER_BLOCK_ALL_ZERO_SNAPSHOTS=true
WATCHTOWER_MAX_EPOCH_STATUS_AGE_MINUTES=30
WATCHTOWER_ALLOW_EXPIRED_EPOCH_GRACE_MINUTES=20
WATCHTOWER_BLOCK_ON_RATE_LIMIT=true
WATCHTOWER_BLOCK_ON_CLOUDFLARE_OUTAGE=true
```

## Optional Future Variables

```bash
WATCHTOWER_BLOCK_MANAGER_ENDPOINT=
WATCHTOWER_BLOCK_MANAGER_API_KEY=
WATCHTOWER_DEDICATED_API_ENDPOINT=
WATCHTOWER_ANALYTICS_KEY=
```

## Forbidden Reuse

Do not use variables named for R4T, Roll4Trouble, campaign voting, story, adventurer identity, or R4T admin credentials.
