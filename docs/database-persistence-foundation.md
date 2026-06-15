# Database Persistence Foundation

Batch 28 adds a first database schema contract for Watchtower.

The goal is not to select a database provider yet. The goal is to stabilize the records that the future persistence adapter must support.

## Added file

```text
packages/db/src/schema.ts
```

## Main record groups

```text
users
watchlists
wallets
api_health_checks
mobile_verifier_epochs
snapshots
wallet_snapshots
balance_candidates
raw_inspections
```

## Current safety position

The schema supports snapshot persistence, but the application must still obey the existing snapshot policy.

That means a snapshot must not be saved when:

```text
- API trust is degraded, stale, rate-limited, or down
- Mobile Verifier epoch status is unknown or expired without an allowed grace rule
- decoder confidence is unresolved
- all wallet balances are suspiciously zero
- too many wallet reads fail
```

## Why raw inspections are separate

Raw account inspection data may be large and may contain network-specific structures that are useful for decoder research.

It is intentionally separated from normal snapshot records so Watchtower can later choose whether to store raw inspection output, redact it, or disable raw storage entirely.

## Provider-neutral design

This batch does not assume:

```text
- Supabase
- Neon
- PostgreSQL
- SQLite
- Prisma
- Drizzle
- any hosted database provider
```

Those choices can come later after the live-read and decoder logic is more stable.

## Required action after upload

```text
1. Commit the files.
2. Check GitHub Actions → latest Typecheck run.
```

No terminal command is required.
