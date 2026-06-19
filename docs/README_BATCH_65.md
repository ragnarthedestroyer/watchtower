# README — Batch 65

## Batch

Batch 65: On-the-fly privacy guard foundation

## Purpose

Add an explicit no-storage boundary for token movement frontend views.

## What it adds

- Core no-storage policy model.
- Runtime assessment helper for frontend/server/API/export surfaces.
- Recommended no-store HTTP headers for future wallet-specific responses.
- Web no-storage notice renderer.
- Telegram no-storage notice renderer.
- Documentation explaining the GDPR-safe wording.

## Safety boundary

This batch does not fetch chain data, store user data, use browser storage, sign transactions, custody assets, operate PrivateNote, trade, or decode token transfers.

## Required command

```bash
npm run typecheck
```

## Commit message

```text
Batch 65: add on-the-fly privacy guard foundation
```
