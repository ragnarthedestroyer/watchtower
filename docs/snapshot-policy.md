# Snapshot Policy

## Purpose

Acki Watchtower must never save a historical snapshot unless the data is trustworthy enough to become part of the long-term record.

The snapshot policy exists to protect the dashboard, reports, Telegram views, and future analytics from false data caused by degraded APIs, stale epoch state, partial wallet resolution, State V2 migration issues, or decoder uncertainty.

This policy applies to all future snapshot writers, including web backend jobs, Telegram-triggered refreshes, scheduled monitors, and manual admin refreshes.

## Core rule

A snapshot may be collected in memory during degraded conditions, but it must not be saved as historical truth unless the policy returns:

```text
SAFE_TO_SAVE
```

When the policy does not approve saving, Watchtower enters:

```text
READ_ONLY
```

or:

```text
BLOCKED
```

In those modes, the app may show the latest cached values, health warnings, and diagnostic output, but it must not append new balance, epoch, or KPI snapshot rows.

## Why this exists

Acki Nacki is moving toward State V2 addressing, where applications must support DApp ID + Account ID instead of relying only on the old address format. Public API rate limits were also tightened after miner bot activity, and miner applications may need a Block Manager license to avoid those limits. This means Watchtower must be defensive by design rather than assuming every API response is reliable.

## Snapshot states

### SAFE_TO_SAVE

The snapshot can be saved.

Minimum conditions:

```text
- API status is OK.
- No rate-limit condition is detected.
- No Cloudflare or public endpoint outage is detected.
- Epoch data is fresh enough.
- Wallet identities resolved successfully.
- Required accounts were reachable.
- Decoder confidence is sufficient.
- Snapshot is not all-zero unless explicitly expected.
```

### READ_ONLY

The snapshot should not be saved, but the app may still show diagnostic information.

Typical reasons:

```text
- API status is degraded.
- Mobile Verifier epoch is expired but still readable.
- Some wallet/account data is missing.
- Decoder confidence is incomplete.
- Public API latency is high.
- State V2/legacy fallback mismatch is detected.
```

### BLOCKED

The refresh should stop early and avoid further load on public infrastructure.

Typical reasons:

```text
- HTTP 429 / rate limit.
- Cloudflare 502/503 or origin outage.
- Public API returns repeated partial or invalid responses.
- State V2 account resolver fails for most configured wallets.
- Required health checks fail before wallet polling begins.
```

## API trust classification

Watchtower should classify API access before saving snapshots.

```text
OK
DEGRADED
RATE_LIMITED
STALE
DOWN
UNKNOWN
```

### OK

The API is reachable, responsive, and returns complete account data.

Saving may proceed if other policy checks also pass.

### DEGRADED

The API answers, but reliability is questionable.

Examples:

```text
- Slow responses.
- Intermittent errors.
- Some accounts fail while others pass.
- Epoch/root data is readable but delayed.
```

Default behavior: read-only, no saved snapshot.

### RATE_LIMITED

The API returns rate-limit signals, such as HTTP 429 or retry-after style behavior.

Default behavior: blocked. Stop the batch early.

### STALE

The API answers, but returned state appears old or not updated.

Examples:

```text
- Epoch is expired beyond grace period.
- Root status was last refreshed too long ago.
- Account last transaction/update markers do not change while the network is expected to progress.
```

Default behavior: read-only, no saved snapshot.

### DOWN

The API cannot be used.

Examples:

```text
- HTTP 502 / 503.
- Cloudflare origin errors.
- Non-JSON API responses.
- Repeated connection failures.
```

Default behavior: blocked.

## Required policy inputs

A snapshot decision should include at least these inputs:

```ts
type SnapshotPolicyInput = {
  checkedAt: string;

  api: {
    status: "OK" | "DEGRADED" | "RATE_LIMITED" | "STALE" | "DOWN" | "UNKNOWN";
    httpStatus?: number;
    responseMs?: number;
    retryAfterSeconds?: number;
    errors: string[];
  };

  epoch: {
    source: "mobile_verifiers_root" | "manual" | "unknown";
    status: "ACTIVE" | "EXPIRED" | "FUTURE" | "UNKNOWN" | "ERROR";
    checkedAt?: string;
    epochStart?: string;
    epochEnd?: string;
    secondsUntilEpochEnd?: number;
  };

  walletResolution: {
    configuredWallets: number;
    resolvedWallets: number;
    failedWallets: number;
    identitySchemes: string[];
  };

  snapshot: {
    successfulWallets: number;
    errorWallets: number;
    skippedWallets: number;
    totalNackl?: string;
    totalConfirmedNackl?: string;
    allZero: boolean;
    decoderConfidence: "CONFIRMED" | "PARTIAL" | "UNRESOLVED" | "ERROR";
  };
};
```

## Required policy output

```ts
type SnapshotPolicyResult = {
  decision: "SAFE_TO_SAVE" | "READ_ONLY" | "BLOCKED";
  safeToSave: boolean;
  apiStatus: string;
  epochStatus: string;
  reasons: string[];
  warnings: string[];
  recommendedNextAction: string;
};
```

## Blocking rules

The policy must return `BLOCKED` when any of these conditions are true:

```text
- API status is RATE_LIMITED.
- API status is DOWN.
- HTTP status is 429.
- HTTP status is 502 or 503 after retry.
- Cloudflare/origin outage is detected.
- Configured wallets cannot be resolved at all.
- Successful wallet count is below the hard minimum.
- Snapshot is all-zero and all-zero snapshots are blocked.
```

## Read-only rules

The policy must return `READ_ONLY` when any of these conditions are true and no blocking rule applies:

```text
- API status is DEGRADED.
- API status is STALE.
- Epoch status is EXPIRED beyond grace period.
- Epoch status is UNKNOWN.
- MV root status cache is too old.
- Wallet identity uses legacy fallback during a State V2-required period.
- Decoder confidence is PARTIAL or UNRESOLVED.
- Some configured wallets failed but enough data exists for display.
```

## Safe-save rules

The policy may return `SAFE_TO_SAVE` only when all of these are true:

```text
- API status is OK.
- Epoch status is ACTIVE, or expired only within an explicitly allowed grace window.
- MV root status is fresh.
- Wallet resolver status is healthy.
- Successful wallet count meets configured threshold.
- Snapshot is not suspiciously all-zero.
- Decoder confidence is CONFIRMED.
- No rate-limit or outage signal occurred during the run.
```

## Default thresholds

Initial recommended defaults:

```json
{
  "snapshotPolicy": {
    "minSuccessfulWallets": 8,
    "blockAllZeroSnapshots": true,
    "maxMvrootAgeMinutes": 30,
    "allowExpiredEpochGraceMinutes": 20,
    "blockOnRateLimit": true,
    "blockOnCloudflareOutage": true,
    "requireResolvedWallets": true,
    "requiredDecoderConfidence": "CONFIRMED"
  },
  "api": {
    "delayBetweenRequestsMs": 2500,
    "maxRetries": 2,
    "retryAfter429Ms": 120000,
    "retryAfterOutageMs": 60000,
    "stopBatchOnRateLimit": true,
    "stopBatchOnCloudflareOutage": true
  }
}
```

These values should be configurable and may become stricter once Watchtower is public.

## State V2 impact

Snapshot policy must not assume a wallet is identified by a legacy address.

A snapshot row should reference a stable Watchtower identity first:

```text
wallet_id
identity_scheme
resolved_account_id
resolved_dapp_id
legacy_address_optional
```

The legacy address may appear as compatibility metadata, but it must not be the primary identity key in the new web/Telegram app.

## Save behavior

When saving is allowed, Watchtower may write:

```text
- wallet/account snapshot rows
- portfolio summary rows
- epoch status rows
- API health rows
```

When saving is not allowed, Watchtower may write only operational diagnostics, clearly marked as non-snapshot health data:

```text
- API health check result
- policy decision log
- dashboard warning cache
```

It must not write balance history or KPI history.

## Dashboard behavior

The dashboard must clearly distinguish:

```text
Latest saved snapshot
Current read-only diagnostic result
API trust status
Epoch trust status
Snapshot save decision
```

If the current refresh is blocked or read-only, the dashboard should say so explicitly.

Example:

```text
Current mode: READ_ONLY
Reason: API status DEGRADED; MV root epoch EXPIRED
Latest saved snapshot: 2026-05-21T07:16:01Z
No new snapshot was saved.
```

## Telegram behavior

Telegram users should never be shown a degraded diagnostic as if it were a confirmed balance update.

Recommended wording:

```text
Watchtower is in read-only mode. The latest confirmed snapshot is still shown, but no new snapshot was saved because API health is degraded.
```

## Non-goals

This policy does not define:

```text
- how State V2 accounts are resolved;
- how Block Manager licensing is obtained;
- how PrivateNote / RootPN / PMP balances are decoded;
- how wallet ownership is proven;
- how alerts are monetized or exposed to users.
```

Those belong to separate architecture and implementation documents.

## Implementation priority

The first code implementation should be:

```text
packages/core/src/policy/snapshot-policy.ts
```

Then:

```text
packages/core/src/policy/api-trust.ts
packages/core/src/identity/account-identity.ts
packages/core/src/identity/account-resolver.ts
```

No snapshot writer should be implemented before this policy exists in code.

