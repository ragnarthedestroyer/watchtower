# Balance Decoder Candidate Foundation

Batch 18 adds the first conservative balance-candidate decoder.

This is not a confirmed wallet-balance decoder yet. It is a research layer that finds balance-like fields in normalized and raw account responses, marks them with confidence levels, and keeps snapshot safety conservative.

## Added behavior

- Detects raw `account.balance` as an unresolved account-balance candidate.
- Searches raw GraphQL response objects for balance/reward-like fields.
- Detects `_rewards` / `rewards` paths as possible PopitGame locked/mining NACKL candidates.
- Detects `_balance` / balance-like paths as possible PrivateNote or generic balance candidates.
- Adds candidate details to the account inspection route.
- Adds candidate balances to live snapshot wallet entries.

## Safety rules

- No candidate is treated as confirmed.
- PopitGame reward candidates are marked `partial`, not `confirmed`.
- Raw account balances remain `UNKNOWN` and `unresolved`.
- Snapshot saving remains blocked while decoder confidence is unresolved.
- ABI/BOC decoding is still required before production balance claims.

## Why this step exists

The previous batches could read raw accounts and build live snapshots, but they could not identify useful balance signals. This batch creates a safe bridge between raw account reads and future real decoder work.

It allows Watchtower to show where possible balance values were found without pretending they are final wallet balances.

## Routes affected

### `GET /accounts/inspect`

Now includes:

- `balanceCandidates`
- candidate paths
- candidate source
- candidate confidence
- decoder warnings

### `GET /snapshots/live`

Wallet entries may now include balance candidates, but they remain partial/unresolved unless future decoder work confirms them.
