# Watchtower Implementation Roadmap

## Phase 0 — Documentation and Repository Foundation

Goal: create the repo with clear boundaries before coding.

Deliverables:

- README;
- architecture v0;
- snapshot policy;
- State V2 risk register;
- R4T separation rules;
- infrastructure reuse audit;
- identity model;
- API trust model;
- epoch model;
- data model;
- repo structure.

## Phase 1 — App Skeleton

Goal: web + Telegram shell with no blockchain writes.

Deliverables:

- web app placeholder;
- Telegram Mini App placeholder;
- backend API placeholder;
- database connection;
- health endpoint;
- environment variable template;
- deployment target.

## Phase 2 — Trust and Health Foundation

Goal: implement safety before monitoring.

Deliverables:

- API trust checker;
- epoch status checker;
- snapshot policy evaluator;
- health dashboard;
- blocked snapshot reason view.

## Phase 3 — Identity and Resolver Layer

Goal: support account abstraction before balance decoding.

Deliverables:

- watch target CRUD;
- legacy identity model;
- State V2 identity model;
- resolver interface;
- resolver cache;
- stale resolution policy.

## Phase 4 — Read-Only Monitoring MVP

Goal: collect safe read-only data.

Deliverables:

- controlled polling;
- request throttling;
- rate-limit handling;
- account status fetch;
- Mobile Verifier epoch display;
- snapshot attempts;
- no-save behavior under degraded conditions.

## Phase 5 — Balance Decoders

Goal: add decoders only after identity and trust are stable.

Deliverables:

- Mvmultifactor decoder;
- PopitGame decoder;
- MobileVerifiers root decoder;
- PrivateNote research decoder;
- decoder confidence labels;
- unresolved balance handling.

## Phase 6 — Telegram Alerts

Goal: notify about status changes.

Deliverables:

- API degraded alert;
- epoch expired/stale alert;
- snapshot blocked alert;
- watch target error alert.

## Phase 7 — State V2 Upgrade

Goal: move from compatibility mode to native DApp ID + Account ID.

Deliverables:

- SDK v3 / State V2 integration;
- account reference migration;
- admin migration tool;
- legacy deprecation warning;
- final State V2 resolver.

## Phase 8 — Optional API Strategy Upgrade

Goal: reduce dependence on public API limits.

Possible deliverables:

- Block Manager endpoint support;
- authenticated API access;
- endpoint priority/fallback;
- stricter rate-limit budget;
- background job queue.
