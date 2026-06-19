# README — Batch 66

## Batch

Batch 66: NACKL mining reward classifier foundation

## Purpose

Add an on-the-fly classifier that keeps NACKL mining rewards separate from direct transfers in/out and unresolved contract-routed flows.

## What it adds

- Core mining reward classifier model.
- Separate section model for:
  - NACKL mining rewards;
  - direct transfers in;
  - direct transfers out;
  - unresolved or contract-routed flows.
- Web renderer for the classified dashboard sections.
- Telegram renderer for compact classified output.
- Documentation for the frontend classification boundary.

## Safety boundary

This batch does not fetch chain data, store user data, use browser storage, use analytics, sign transactions, custody assets, operate PrivateNote, trade, or decode token transfers.

## Required command

```bash
npm run typecheck
```

## Commit message

```text
Batch 66: add NACKL mining reward classifier foundation
```
