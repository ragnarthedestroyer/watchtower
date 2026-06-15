# Telegram snapshot history detail panel

Batch 38 adds snapshot-history detail inspection to the Telegram Mini App.

## Added behavior

The Telegram app can now request and display details for research snapshots stored in the server in-memory store.

The panel shows:

- selected snapshot ID and creation time
- snapshot policy mode and safe-to-save flag
- stored policy reasons
- API health evidence
- Mobile Verifier epoch evidence
- stored wallet snapshot records
- stored balance candidates

## Safety position

The detail panel is still research-only. It does not confirm NACKL balances, does not promote candidates to trusted balances, and does not persist data beyond the in-memory server runtime.

## Required check

After applying this batch, confirm GitHub Actions Typecheck is green. No local terminal command is required.
