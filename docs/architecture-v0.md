# Acki Watchtower — Architecture v0

Status: Draft v0  
Scope: Fresh start for the new web + Telegram Watchtower application  
Decision: Do not migrate the old Xubuntu-local implementation as production code

---

## 1. Purpose

Acki Watchtower is a web and Telegram-based monitoring tool for selected Acki Nacki wallet/account states, Mobile Verifier epoch status, API health, and snapshot reliability.

The project is being restarted from scratch. The previous Xubuntu Watchtower remains useful as research and proof-of-concept work, but the new implementation must be designed for:

- Web app usage.
- Telegram Mini App usage.
- Database-backed snapshots.
- API health validation before saving data.
- State V2 account identity from the beginning.
- Clear separation from Roll for Trouble (R4T).

---

## 2. Non-goals

This first version does **not** attempt to:

- Reuse R4T product identity, users, voting data, story data, campaigns, bot identity, or analytics.
- Reuse the old Xubuntu CSV-first architecture as production architecture.
- Build miner automation.
- Compete with public API users through aggressive polling.
- Depend on old `0:<hex>` account addressing as the long-term model.
- Implement full PrivateNote / RootPN / PMP decoding in the first milestone.
- Decide whether a Block Manager license is required.

---

## 3. Key external constraints

### 3.1 State V2 addressing

Acki Nacki State V2 changes the account identity model. Applications should prepare for DApp ID + Account ID addressing instead of assuming the legacy `0:<hex>` format.

The working architecture must therefore treat wallet identity as an abstract identity object, not as a raw legacy address.

Target identity model:

```ts
type WatchtowerAccountIdentity =
  | {
      scheme: "legacy";
      legacyAddress: string;
    }
  | {
      scheme: "state_v2";
      dappId: string;
      accountId: string;
    };
```

The normalized resolved account object should look like:

```ts
type ResolvedWatchtowerAccount = {
  walletId: string;
  label: string;
  identityScheme: "legacy" | "state_v2";
  dappId?: string;
  accountId?: string;
  legacyAddress?: string;
  displayAddress: string;
  resolvedAt: string;
  resolverVersion: string;
};
```

### 3.2 Public API limits

Public endpoint rate limits are now a core design constraint. Watchtower must behave as a respectful read-only observer:

- Slow polling.
- Backoff on errors.
- Stop early on rate-limit signals.
- No aggressive scans in normal operation.
- Separate diagnostic tools from production monitoring.
- Never save snapshots during degraded API conditions.

---

## 4. Product boundary from R4T

Watchtower may reuse generic provider-level infrastructure, but not product-level R4T assets.

Allowed reuse:

- Same hosting provider account.
- Same database provider account.
- Same deployment knowledge.
- Same general Telegram Mini App implementation pattern.

Forbidden reuse:

- R4T database tables.
- R4T user identities.
- R4T votes.
- R4T campaigns or story content.
- R4T Telegram bot token or bot identity.
- R4T domain or public funnel.
- R4T analytics property.
- R4T secrets or environment variables.

Rule:

> No R4T user, voting, story, campaign, or content data may be mixed with Watchtower wallet-monitor data.

---

## 5. System overview

Initial system shape:

```text
apps/
  web/
    Public/admin dashboard

  telegram/
    Telegram Mini App entry point

packages/
  core/
    Identity model
    API trust model
    Snapshot policy
    Epoch model
    Decoder interfaces

  api/
    Backend routes
    API clients
    Rate-limit handling
    Snapshot orchestration

  db/
    Database schema
    Migrations
    Snapshot storage

  ui/
    Shared UI components
```

---

## 6. Core data flow

Normal monitoring flow:

```text
1. User or scheduled job requests Watchtower refresh.
2. API trust check runs first.
3. Mobile Verifier root / epoch status is checked.
4. Wallet identities are resolved.
5. Account data is read with rate-limit-safe API client.
6. Decoders produce normalized observations.
7. Snapshot policy decides whether data is safe to save.
8. If safe: save snapshot.
9. If unsafe: display read-only status and reasons, but do not save.
10. Dashboard shows latest trusted snapshot plus current trust state.
```

Important rule:

> Data collection and data saving are separate. A script or API route may collect data, but only the snapshot policy may approve saving it.

---

## 7. API trust model

Watchtower must classify API state before snapshot saving.

Suggested states:

```ts
type ApiTrustStatus =
  | "OK"
  | "DEGRADED"
  | "RATE_LIMITED"
  | "STALE"
  | "DOWN"
  | "UNKNOWN";
```

Snapshot saving requires:

```text
ApiTrustStatus = OK
```

All other states should put Watchtower into read-only mode.

Examples of blocked conditions:

- HTTP 429.
- HTTP 502 / 503.
- Cloudflare errors.
- GraphQL errors.
- Partial account results.
- Stale root/epoch cache.
- Too many unresolved wallets.
- All-zero decoded balance anomaly.
- Decoder confidence below threshold.

---

## 8. Snapshot policy

The snapshot policy is the central safety gate.

Example result:

```ts
type SnapshotPolicyDecision = {
  safeToSave: boolean;
  mode: "SAVE" | "READ_ONLY" | "BLOCKED";
  apiStatus: ApiTrustStatus;
  epochStatus: "ACTIVE" | "EXPIRED" | "UNKNOWN" | "ERROR";
  reasons: string[];
};
```

Example blocked result:

```json
{
  "safeToSave": false,
  "mode": "READ_ONLY",
  "apiStatus": "RATE_LIMITED",
  "epochStatus": "EXPIRED",
  "reasons": [
    "Public API returned rate-limit response",
    "Mobile Verifier root epoch is expired",
    "Snapshot would be unsafe to save"
  ]
}
```

Initial policy defaults:

```json
{
  "requiredApiStatus": "OK",
  "minSuccessfulWallets": 8,
  "blockAllZeroSnapshots": true,
  "maxEpochStatusAgeMinutes": 30,
  "allowExpiredEpochGraceMinutes": 20,
  "blockOnRateLimit": true,
  "blockOnCloudflareOutage": true
}
```

---

## 9. Epoch validation

The previous Watchtower research showed that the Mobile Verifier root contract can expose useful epoch fields such as:

- Epoch start.
- Epoch end.
- Previous epoch duration.
- Reward timing fields.

The new Watchtower should keep epoch validation as a first-class health signal.

Initial epoch states:

```ts
type EpochStatus =
  | "ACTIVE"
  | "EXPIRED"
  | "FUTURE"
  | "UNKNOWN"
  | "ERROR";
```

If the epoch is expired beyond the configured grace period, Watchtower may still display data, but must not save a new snapshot unless the policy explicitly allows it.

---

## 10. Wallet identity and resolution

The wallet list should store human-meaningful IDs and labels, not only addresses.

Example:

```json
{
  "walletId": "lompra",
  "label": "lompra",
  "enabled": true,
  "identity": {
    "scheme": "state_v2",
    "dappId": "",
    "accountId": ""
  },
  "legacy": {
    "address": ""
  }
}
```

The resolver returns normalized accounts. This allows Watchtower to support:

- Legacy addresses during transition.
- DApp ID + Account ID after State V2.
- Future wallet-provider APIs.
- Multiple account types per wallet.

---

## 11. Decoder strategy

Decoders should be modular and confidence-based.

Initial decoder categories:

```text
decoders/
  mobile-verifier-root
  multifactor-wallet
  popit-game
  generic-account-state
  privatenote-research
  rootpn-research
```

The old research found that PrivateNote-style contracts may use a `map(uint32,uint128)` balance model. That is useful, but it should not be part of the first production milestone.

Decoder output should include:

```ts
type DecodedObservation = {
  decoder: string;
  confidence: "confirmed" | "probable" | "experimental" | "unknown";
  values: Record<string, string | number | null>;
  warnings: string[];
};
```

Only confirmed or policy-approved probable values should be included in saved snapshots.

---

## 12. Database model v0

Suggested first tables:

```text
watchtower_wallets
  id
  label
  enabled
  identity_scheme
  dapp_id
  account_id
  legacy_address
  created_at
  updated_at

watchtower_api_health
  id
  checked_at
  status
  endpoint
  latency_ms
  error_code
  error_message

watchtower_epoch_status
  id
  checked_at
  root_identity
  status
  epoch_start
  epoch_end
  raw_json

watchtower_snapshots
  id
  created_at
  trust_status
  safe_to_save
  policy_reasons
  source

watchtower_snapshot_accounts
  id
  snapshot_id
  wallet_id
  account_identity
  decoder
  confidence
  values_json
```

---

## 13. Telegram and web model

The web app and Telegram Mini App should use the same backend and same snapshot policy.

Telegram should not perform direct blockchain polling from the client.

Recommended flow:

```text
Telegram Mini App
  → backend API
    → trust gate
    → cached latest trusted snapshot
    → optional refresh request, rate limited
```

The UI must clearly distinguish:

```text
Latest trusted snapshot
Current live API/epoch health
Read-only degraded mode
```

---

## 14. First milestones

### Milestone 1 — Repository foundation

Deliverables:

- `README.md`
- `docs/architecture-v0.md`
- `docs/r4t-separation-rules.md`
- `docs/snapshot-policy.md`
- `docs/state-v2-risk-register.md`

### Milestone 2 — Core model

Deliverables:

- Identity model.
- API trust model.
- Snapshot policy module.
- Basic database schema.

### Milestone 3 — Health-only web dashboard

Deliverables:

- Web dashboard showing API trust and epoch status.
- No wallet balance saving yet.
- No aggressive polling.

### Milestone 4 — Wallet watchlist MVP

Deliverables:

- Add wallet identity records.
- Resolve legacy and State V2-ready account identities.
- Display read-only account status.
- Save snapshots only when policy allows.

---

## 15. Open questions

- What is the official State V2 migration guide for applications?
- How should Watchtower obtain DApp ID and Account ID from user-facing wallet data?
- Will public API access be sufficient for a low-rate observer dashboard?
- Will a Block Manager license be needed for reliable production Watchtower operation?
- Which endpoint should be considered authoritative for epoch status?
- Which balance decoders are confirmed enough for saved snapshots?

---

## 16. Current decision summary

The new Watchtower starts clean.

It will be:

```text
web + Telegram first
State V2-aware from day one
snapshot-policy gated
API-limit respectful
R4T-separated
decoder-modular
```

It will not be:

```text
a port of the old Linux folder
a CSV-first local tool
an R4T subproject
a miner bot
a high-frequency scanner
```
