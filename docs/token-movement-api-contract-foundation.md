# Batch 62 — Token Movement API Contract Foundation

Batch 62 defines the read-only API contract layer for Watchtower token movement features.

It does not add live reads, transaction decoding, signing, wallet control, custody, PrivateNote operations, or persistence.

## Purpose

The API contract layer prepares Watchtower to expose token movement features through server routes while preserving the conservative safety model.

It defines contracts for:

- token movement query responses;
- token movement history payloads;
- movement evidence bundles;
- export payloads;
- accumulator / bridge / USDC incident reports;
- API route descriptors and safety metadata.

## Planned routes

| Route id | Method | Path | Purpose |
|---|---:|---|---|
| `token-movements.query` | POST | `/api/token-movements/query` | Filter existing movement candidates. |
| `token-movements.history` | GET | `/api/token-movements/history` | Return movement history once a reader is connected. |
| `token-movements.evidence` | GET | `/api/token-movements/:movementId/evidence` | Return evidence for one movement candidate. |
| `token-movements.export` | POST | `/api/token-movements/export` | Build JSON, CSV, or Markdown export artifacts. |
| `token-movements.incident-report` | GET | `/api/token-movements/incident-report` | Return accumulator / bridge / USDC tracing reports. |

## Safety policy

Every route is read-only.

The API contract explicitly states that Watchtower must not:

- accept seed phrases;
- accept private keys;
- sign transactions;
- broadcast messages;
- offer custody;
- present unresolved rows as proof.

## Why this matters

The SHELL accumulator / USDC recovery incident requires a clean reporting surface. Watchtower must be able to show what is known, what is suspected, and what remains unresolved without overstating evidence.

Batch 62 creates the API vocabulary for that surface before wiring any live route handlers.

## Next batch suggestion

Batch 63 should connect this API contract to server route handler stubs that return deterministic demo/read-only responses only.
