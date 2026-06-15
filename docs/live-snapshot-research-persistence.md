# Live snapshot research persistence

Batch 32 adds the first server-side persistence path for live snapshot evidence.

## New server file

```text
apps/server/src/server-store.ts
```

This creates a process-local in-memory schema store and seeds it with the demo watchlist. It is intentionally not a production database.

## Updated server route

```text
POST /snapshots/live/research-save
```

Optional test parameter:

```text
POST /snapshots/live/research-save?mv_root_address=0:<64hex>
```

## What the route does

```text
1. Verifies live-read mode and endpoint configuration.
2. Builds a live snapshot using the current demo watchlist.
3. Applies the existing snapshot safety policy.
4. Persists the snapshot bundle into the in-memory schema store using research mode.
5. Returns the snapshot, Mobile Verifier read result, persistence result, warnings, and errors.
```

## Safety behavior

The route uses:

```text
save-research-even-if-blocked
```

That means blocked snapshots may be stored only as research/history evidence. They are not confirmed portfolio data.

This is useful because Watchtower needs to preserve decoder evidence while balance decoding is still being researched. However, the UI and future persistence layers must continue to show blocked snapshots as blocked.

## What is not implemented yet

```text
- no real database provider
- no snapshot history route yet
- no UI history panel yet
- no confirmed balance decoding
- no production save behavior
```

## Required action after upload

```text
1. Commit the files.
2. Check GitHub Actions → latest Typecheck run.
```

No terminal command is required.
