# Database schema mapper foundation

Batch 29 adds a small mapping layer between Watchtower domain objects and the provider-neutral database schema.

## Why this exists

The core package should stay focused on Watchtower business rules. The database package should translate those rules into records that can later be stored in PostgreSQL, Supabase, Neon, SQLite, Prisma, Drizzle, or another provider.

This batch does not choose a provider and does not persist anything yet.

## Added file

```text
packages/db/src/schema-mapper.ts
```

The mapper currently supports:

```text
Watchlist              -> WatchtowerWatchlistRecord
WatchlistWallet         -> WatchtowerWalletRecord
WatchtowerSnapshot      -> WatchtowerSnapshotRecord
WatchtowerWalletSnapshot -> WatchtowerWalletSnapshotRecord
WatchtowerBalance       -> WatchtowerBalanceCandidateRecord
```

## Safety rule

The mapper only converts already-created objects. It does not confirm balances, does not decode BOC, and does not override snapshot policy decisions.

If a snapshot is blocked by the safety policy, the mapped database record must still show it as blocked.

## Next step

The next database step should be a write interface that saves a full snapshot bundle as one unit:

```text
snapshot
wallet snapshots
balance candidates
policy reasons
API health reference
epoch reference
```

That write interface should be added before choosing a real database provider.
