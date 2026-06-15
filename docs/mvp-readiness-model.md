# MVP readiness model

Batch 45 adds a small provider-neutral readiness model in `packages/core`.

The goal is to keep a clear internal record of where Watchtower stands without mixing project-management notes into the UI, server, or database layers.

## Added file

```text
packages/core/src/mvp-readiness.ts
```

## What it tracks

The model tracks each major Watchtower area as one of:

```text
done
partial
blocked
not_started
```

Current areas include:

```text
project foundation
CI/typecheck
web app
Telegram app
server
live-read
snapshot policy
research persistence
account inspection
balance decoding
database persistence
Telegram auth
deployment
```

## Why this matters

Watchtower is now large enough that progress needs to be visible inside the codebase, not only in chat.

This model can later be used by the web or Telegram UI to show a built-in implementation status panel, but for now it is only a shared core source of truth.

## Safety note

The readiness model does not claim confirmed NACKL balances.

Balance decoding remains marked as blocked until live account evidence proves the decoder is reliable.
