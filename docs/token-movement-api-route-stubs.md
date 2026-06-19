# Batch 63 — Token Movement API Route Stub Foundation

Batch 63 connects the Batch 62 API contracts to deterministic read-only route handler stubs.

It does not add live reads, token decoding, persistence, signing, broadcasting, custody, DEX functionality, or PrivateNote operations.

## Purpose

The goal is to make the API layer testable before any network reader is attached.

The route stubs can return predictable demo/in-memory responses for:

- movement query;
- movement history;
- movement evidence bundle;
- movement export;
- accumulator / bridge / USDC incident report.

## Safety behavior

The stubs preserve Watchtower's conservative model:

- no seed phrases;
- no private keys;
- no transaction signing;
- no message broadcasting;
- no custody;
- no live-chain claims;
- unresolved rows remain unresolved.

## Server integration

A dependency-free server-side helper is included at:

```text
apps/server/src/features/token-movement/tokenMovementApiRouteStubs.ts
```

This file does not modify the existing server route registry yet. It only prepares a typed route registry and handler function that can be wired deliberately in a later batch.

## Why this matters

The SHELL accumulator / USDC incident report should not be connected directly to live reads before the API response shape is stable. Batch 63 allows UI and server behavior to be tested with deterministic read-only responses first.

## Next batch suggestion

Batch 64 should expose these server stubs through the existing server routes index or route registry, still returning deterministic demo responses only.
