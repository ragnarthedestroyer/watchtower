# Watchtower Data Model v0

## Purpose

This document defines the first database-oriented model for the new web and Telegram Watchtower.

## Core Entities

### Watch Target

A logical thing the user wants to monitor.

Fields:

- `id`;
- `label`;
- `enabled`;
- `visibility`;
- `identity_scheme`;
- `legacy_address`;
- `dapp_id`;
- `account_id`;
- `tags`;
- `created_at`;
- `updated_at`.

### Resolved Account

A resolved account reference derived from a watch target.

Fields:

- `id`;
- `watch_target_id`;
- `role` (`main`, `linked_mining`, `mv_root`, `private_note`, `other`);
- `scheme`;
- `legacy_address`;
- `dapp_id`;
- `account_id`;
- `resolver_version`;
- `status`;
- `resolved_at`;
- `expires_at`;
- `error`.

### API Health Event

Fields:

- `id`;
- `checked_at`;
- `endpoint`;
- `status`;
- `http_status`;
- `latency_ms`;
- `rate_limited`;
- `stale`;
- `reasons`.

### Epoch Status

Fields:

- `id`;
- `checked_at`;
- `source`;
- `status`;
- `root_scheme`;
- `root_legacy_address`;
- `root_dapp_id`;
- `root_account_id`;
- `epoch_start`;
- `epoch_end`;
- `seconds_until_epoch_end`;
- `reward_last_time`;
- `reward_period`;
- `raw_json`.

### Snapshot Attempt

A snapshot attempt exists even when no snapshot is saved.

Fields:

- `id`;
- `started_at`;
- `finished_at`;
- `mode` (`SAFE_TO_SAVE`, `READ_ONLY`, `BLOCKED`);
- `api_trust_status`;
- `epoch_status`;
- `targets_checked`;
- `targets_ok`;
- `targets_error`;
- `safe_to_save`;
- `blocked_reasons`.

### Saved Snapshot

Only created if snapshot policy approves.

Fields:

- `id`;
- `snapshot_attempt_id`;
- `saved_at`;
- `total_confirmed_nackl`;
- `locked_nackl_confirmed`;
- `unlocked_nackl_confirmed`;
- `unresolved_balance_count`;
- `decoder_confidence`.

### Snapshot Account Row

Fields:

- `id`;
- `snapshot_id`;
- `watch_target_id`;
- `account_role`;
- `status`;
- `confirmed_locked_nackl`;
- `confirmed_unlocked_nackl`;
- `usdc`;
- `raw_values`;
- `decoder_version`;
- `confidence`;
- `error`.

## Data Integrity Rules

1. A blocked attempt may be stored, but not as a saved financial snapshot.
2. Missing data must be stored as `null`, not zero.
3. Decoder version must be stored with decoded values.
4. Identity scheme must be stored with account references.
5. Legacy and State V2 references must not be merged into one ambiguous string.
