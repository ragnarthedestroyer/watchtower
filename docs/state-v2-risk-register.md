# Acki Watchtower — State V2 Risk Register

Status: Draft v0  
Project: Acki Watchtower  
Scope: Web + Telegram monitoring app  

## Purpose

This document tracks the technical and operational risks created by the Acki Nacki transition to State V2, DApp ID + Account ID addressing, and tightened public API access limits.

Watchtower must be designed so that it does not depend permanently on the old `0:<hex>` address format and does not save misleading snapshots when network access is degraded, stale, rate-limited, or partially decoded.

## Core Assumptions

1. State V2 will replace the old account-addressing model.
2. Watchtower must support DApp ID + Account ID as the target identity model.
3. Legacy `0:<hex>` addresses may remain useful only during a compatibility period.
4. Public API access can become degraded, rate-limited, or unavailable.
5. Watchtower must operate safely in read-only mode when data trust is low.
6. Snapshot persistence must be governed by the snapshot policy, not by individual UI or monitoring components.
7. Wallet identity, account resolution, balance decoding, API health, and snapshot storage must be separate layers.

## Risk Register

| ID | Risk | Impact | Likelihood | Severity | Mitigation | Status |
|---|---|---:|---:|---:|---|---|
| SV2-001 | Old `0:<hex>` account addresses stop working after State V2 | Watchtower cannot resolve wallets or fetch account states | High | Critical | Abstract wallet identity from address format; support DApp ID + Account ID from the beginning | Open |
| SV2-002 | DApp ID + Account ID migration guide is not available or changes during implementation | Early implementation may use wrong assumptions | High | High | Keep resolver layer isolated; treat State V2 resolver as replaceable; document assumptions clearly | Open |
| SV2-003 | Existing wallet records are stored only as legacy addresses | Wallet migration becomes manual and error-prone | High | High | Store wallet identity separately from resolved account addresses; add migration fields now | Open |
| SV2-004 | Watchtower stores snapshots from stale or degraded API responses | Historical data becomes misleading or unusable | High | Critical | Enforce snapshot policy gate before any database write | Open |
| SV2-005 | Public API returns partial data during instability | Some wallets appear as zero or missing | High | Critical | Require completeness checks, stale checks, all-zero anomaly detection, and decoder confidence | Open |
| SV2-006 | Public API rate limits are hit by Watchtower polling | Watchtower becomes unreliable and may worsen public endpoint load | High | High | Use slow polling, backoff, request budgets, caching, and read-only mode on 429/rate-limit signals | Open |
| SV2-007 | Miner-related API limits affect Watchtower even though Watchtower is observational | Monitoring becomes blocked or inconsistent | Medium | High | Avoid miner-like behavior; avoid aggressive scans; separate diagnostic tools from normal monitoring | Open |
| SV2-008 | Block Manager license becomes necessary for reliable monitoring | Public deployment cannot provide stable data | Medium | High | Keep API provider strategy separate; support provider abstraction; track license dependency as a decision item | Open |
| SV2-009 | Mobile Verifier epoch root is expired or stale | Daily mining status is misaligned | High | High | Use MV root status as epoch source, but block or mark snapshots read-only when epoch is stale beyond grace | Open |
| SV2-010 | MV root epoch fields change under State V2 | Epoch validation breaks | Medium | High | Keep epoch decoder modular; version decoded root contracts; store raw decoded fields for diagnostics | Open |
| SV2-011 | Balance storage format changes after State V2 | Locked/unlocked balances decode incorrectly | High | Critical | Keep balance decoders modular; store decoder version and confidence; never silently treat unresolved as zero | Open |
| SV2-012 | PrivateNote / RootPN / PMP balance structures are mistaken for wallet balances | Watchtower reports wrong unlocked NACKL | Medium | High | Treat PrivateNote/RootPN/PMP as decoder research until confirmed; label unresolved balances clearly | Open |
| SV2-013 | Telegram Mini App users expect wallet ownership verification | Product scope expands into security-sensitive territory | Medium | High | Start with watchlist model; do not require ownership unless explicitly designed and reviewed | Open |
| SV2-014 | Telegram login identity is confused with wallet identity | Wrong accounts may be attached to users | Medium | High | Separate app user identity from watched wallet/account identity | Open |
| SV2-015 | R4T infrastructure or data is accidentally reused | Branding, data, and user-flow contamination | Medium | High | Use separate repo, bot, database, secrets, analytics, and storage namespace | Open |
| SV2-016 | Secrets from R4T or local Watchtower are copied into the new repo | Security exposure | Medium | Critical | Start from scratch; use `.env.example`; never commit real secrets | Open |
| SV2-017 | Dashboard displays stale data as current | Users make decisions based on outdated data | High | High | Display freshness, API trust state, epoch status, and last safe snapshot timestamp prominently | Open |
| SV2-018 | Snapshot policy is bypassed by a future script or admin action | Unsafe data enters database | Medium | Critical | Centralize snapshot writes behind one service that always calls policy evaluation | Open |
| SV2-019 | Historical snapshots from legacy and State V2 eras are mixed without schema versioning | Trend analysis becomes inaccurate | Medium | High | Store schema version, resolver version, address scheme, decoder version, and API source per snapshot | Open |
| SV2-020 | New SDK versions introduce breaking API behavior | Backend fails after dependency update | Medium | High | Pin SDK versions; test migration branch separately; document compatibility matrix | Open |

## Required Design Responses

### 1. Wallet Identity Abstraction

Watchtower must not use a raw address as the primary wallet identifier.

Target model:

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

A watched wallet/account should have a stable internal ID:

```ts
type WatchedAccount = {
  id: string;
  label: string;
  identity: WatchtowerAccountIdentity;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};
```

Resolved network accounts should be treated as derived data, not identity:

```ts
type ResolvedAccount = {
  watchedAccountId: string;
  scheme: "legacy" | "state_v2";
  dappId?: string;
  accountId?: string;
  legacyAddress?: string;
  displayAddress: string;
  resolvedAt: string;
  resolverVersion: string;
  status: "OK" | "UNRESOLVED" | "ERROR";
};
```

### 2. API Provider Abstraction

Watchtower should not hardcode one public GraphQL endpoint as the only possible source.

Required concept:

```ts
type ApiProviderStatus =
  | "OK"
  | "DEGRADED"
  | "RATE_LIMITED"
  | "STALE"
  | "DOWN";
```

Every API response should be evaluated for:

- HTTP status;
- rate-limit signals;
- Cloudflare or upstream errors;
- response time;
- stale block/account data;
- partial or missing account data;
- decoder completeness.

### 3. Snapshot Policy Gate

No monitoring result should be saved directly.

All writes must pass through:

```ts
type SnapshotDecision = {
  safeToSave: boolean;
  mode: "SAFE_TO_SAVE" | "READ_ONLY" | "BLOCKED";
  reasons: string[];
};
```

Blocked conditions include:

- API status is `RATE_LIMITED`, `DOWN`, or `STALE`;
- API status is `DEGRADED` and policy requires strict mode;
- MV root status is missing or stale;
- epoch is expired beyond the allowed grace window;
- wallet identities are unresolved;
- wallet batch is incomplete;
- all decoded balances are zero;
- decoder confidence is low;
- legacy address use is disallowed in current environment.

### 4. Decoder Versioning

Every saved balance should include decoder metadata:

```ts
type BalanceSnapshotMeta = {
  resolverVersion: string;
  decoderVersion: string;
  apiProvider: string;
  apiTrustState: ApiProviderStatus;
  epochStatus: string;
  addressScheme: "legacy" | "state_v2";
};
```

This protects historical data from being silently mixed across protocol changes.

## State V2 Migration Readiness Checklist

Before Watchtower can be considered State V2 ready:

- [ ] Wallet identity is not stored only as `0:<hex>`.
- [ ] State V2 identity shape exists in data model.
- [ ] Legacy resolver and State V2 resolver are separate modules.
- [ ] API client supports provider abstraction.
- [ ] Snapshot policy blocks unsafe writes.
- [ ] Dashboard displays API trust state.
- [ ] Dashboard displays epoch freshness.
- [ ] Dashboard distinguishes confirmed, unresolved, and unavailable balances.
- [ ] No unresolved balance is shown as zero.
- [ ] All snapshots store resolver version.
- [ ] All snapshots store decoder version.
- [ ] All snapshots store API trust state.
- [ ] All snapshots store address scheme.
- [ ] Legacy compatibility mode can be disabled.
- [ ] Diagnostic scans are separated from normal monitoring.
- [ ] Rate-limit backoff is implemented.
- [ ] Admin UI cannot bypass snapshot policy accidentally.

## Near-Term Implementation Order

1. Create project skeleton.
2. Define data model for watched account identity.
3. Define API trust model.
4. Define snapshot policy service.
5. Build read-only dashboard shell.
6. Add MV root / epoch status component.
7. Add legacy account resolver only as compatibility mode.
8. Add State V2 resolver placeholder.
9. Add database persistence only after snapshot policy exists.
10. Add Telegram app after core safety model is stable.

## Decisions Already Made

| Decision | Status |
|---|---|
| Watchtower starts from scratch | Accepted |
| Watchtower is web + Telegram first | Accepted |
| Xubuntu/local CSV Watchtower is reference only | Accepted |
| R4T code/data/secrets are not reused | Accepted |
| State V2 is treated as target architecture | Accepted |
| Legacy address format is temporary compatibility only | Accepted |
| Snapshot policy is mandatory before persistence | Accepted |
| Public API limits are a core design constraint | Accepted |
| PrivateNote/RootPN/PMP research is postponed | Accepted |

## Open Questions

1. What exact DApp ID should Watchtower use for wallet/account lookups?
2. How will the official migration guide define Account ID derivation?
3. Will public GraphQL expose DApp ID and Account ID as separate query fields?
4. Will Watchtower need a Block Manager license for reliable monitoring?
5. What is the minimum acceptable polling frequency for user-facing dashboards?
6. Should user-created watchlists be private, public, or admin-only at first?
7. Should Telegram login be required for all users or only for saved watchlists?
8. Which balances should be included in v0: locked mining, unlocked NACKL, SHELL, USDC, or only confirmed fields?

## Current Recommendation

Do not write monitoring logic first.

The first implementation layer should be:

1. identity model;
2. API trust model;
3. snapshot policy;
4. read-only dashboard shell.

Only after those exist should Watchtower fetch and persist balance snapshots.
