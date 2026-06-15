# Batch 42 — live test preparation

## What this batch adds

This batch adds a small helper script and documentation for live-read testing.

It does not change the TypeScript application source.

## Files

```text
apps/server/scripts/print-test-urls.mjs
docs/live-read-browser-test-guide.md
docs/test-addresses-and-safety.md
docs/batch-42-live-test-preparation.md
```

## Required action after upload

1. Commit the files.
2. Check GitHub Actions → latest Typecheck run.

No terminal command is required.

## Optional command later

After the server is running, this command prints useful test URLs:

```bash
node apps/server/scripts/print-test-urls.mjs
```

With test values:

```bash
WATCHTOWER_TEST_ADDRESS="0:<64hex>" \
WATCHTOWER_TEST_MV_ROOT_ADDRESS="0:<64hex>" \
node apps/server/scripts/print-test-urls.mjs
```
