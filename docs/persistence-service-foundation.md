# Persistence service foundation

Batch 31 adds the first persistence service layer on top of the provider-neutral schema store.

## Purpose

The persistence service converts Watchtower domain objects into database-shaped records and decides whether a snapshot should be stored.

It is still provider-neutral. It does not require Supabase, Neon, PostgreSQL, SQLite, Prisma, Drizzle, or any other database choice.

## Added file

```text
packages/db/src/persistence-service.ts
```

## Main functions

```ts
persistWatchlist(...)
persistSnapshot(...)
```

## Snapshot safety behavior

The default persistence mode is:

```text
save-only-safe
```

In this mode, a snapshot is not saved if `snapshot.policyDecision.safeToSave` is false.

There is also a research-only mode:

```text
save-research-even-if-blocked
```

This mode exists only for local/manual investigation. If it is used, the result explicitly warns that the saved snapshot is not confirmed portfolio data.

## Why this matters

Watchtower must not silently save misleading wallet data. This layer keeps the safety policy close to persistence so that blocked snapshots stay blocked by default.

## Still not implemented

This batch does not add:

```text
- real database provider
- server persistence routes
- snapshot history API
- UI snapshot history panel
- confirmed balance decoding
```

Those are later batches.
