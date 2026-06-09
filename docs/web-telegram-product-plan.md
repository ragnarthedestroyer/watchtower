# Watchtower Web and Telegram Product Plan

## Purpose

Acki Watchtower will be a web and Telegram-based monitoring product, not a Linux-local-first tool.

The old local Watchtower prototype is a source of lessons, not the production architecture.

## Product Shape

Watchtower provides:

- web dashboard;
- Telegram Mini App;
- backend API;
- database-backed snapshots;
- API health and trust status;
- Mobile Verifier epoch status;
- watched account list;
- snapshot history;
- read-only transparency views.

## First User Flow

1. User opens Watchtower web app or Telegram Mini App.
2. User sees API trust status.
3. User sees Mobile Verifier epoch status.
4. User sees configured watchlist.
5. User can add a watched account identity.
6. System resolves account identity.
7. System collects data only if API trust is acceptable.
8. System saves snapshot only if snapshot policy approves.

## Admin Flow

Admin can:

- configure watched targets;
- mark targets public/private;
- run health check;
- run identity resolution;
- view blocked snapshot reasons;
- inspect API trust events;
- export data.

## Telegram Mini App Rules

Telegram should be a control and viewing surface, not a wallet custody layer.

Initial Telegram functions:

- open dashboard;
- show current status;
- notify when API is degraded;
- notify when epoch status changes;
- notify when snapshot is blocked;
- later, allow authenticated admin actions.

## Non-Goals for MVP

Do not implement in MVP:

- token transfers;
- wallet signing;
- miner operation;
- Block Manager integration;
- SDK write actions;
- private key handling;
- R4T user migration;
- public social campaign funnel.

## UX Principles

Watchtower must clearly separate:

- observed data;
- decoded data;
- inferred data;
- unresolved data;
- blocked snapshots.

Never show missing data as zero.

Use labels such as:

- `confirmed`;
- `unresolved`;
- `not available`;
- `blocked due to API trust`;
- `read-only mode`.
