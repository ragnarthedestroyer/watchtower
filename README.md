# Acki Watchtower

Acki Watchtower is a web and Telegram-first monitoring project for selected Acki Nacki wallet/account states, Mobile Verifier epoch visibility, API health, and snapshot reliability.

This project is being built from scratch. It does not migrate the old Xubuntu/local CSV implementation as production architecture. The earlier local Watchtower work is treated only as research and proof-of-concept material.

## Purpose

Watchtower exists to provide a clean, cautious, and transparent view of selected Acki Nacki monitoring data.

The first product goals are:

- show selected watchlist accounts or wallets;
- display API/network health before trusting data;
- show Mobile Verifier epoch status when available;
- avoid saving snapshots when the data source is degraded, stale, rate-limited, or incomplete;
- prepare for State V2 account addressing from the beginning.

## Current strategic decision

Watchtower will be built as:

```text
web app + Telegram app + backend API + database
```

It will not be built as:

```text
Linux-local-first monitor + CSV-first production dashboard
```

The old local tool may still be useful for experiments, but the production direction is now web and Telegram.

## State V2 readiness

Acki Nacki State V2 is expected to move account addressing away from the old address-only format and toward a DApp ID + Account ID model. Because of this, Watchtower must not treat a wallet identity as equal to a legacy `0:<hex>` address.

The core model should distinguish:

```text
wallet identity
resolved account identity
current address/account format
snapshot data
```

A target account may therefore be represented as either a temporary legacy identity or a State V2 identity:

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

Legacy support should be treated as compatibility mode, not the long-term foundation.

## API trust and snapshot safety

Watchtower must behave as a respectful observer of public infrastructure.

A snapshot must not be saved when:

- the public API is unreachable;
- the API is rate-limited;
- the API is returning Cloudflare or gateway errors;
- the Mobile Verifier epoch source is stale or unavailable;
- the wallet/account resolver fails;
- decoded account data is incomplete;
- all balances are unexpectedly zero;
- fewer than the required accounts are successfully checked;
- decoder confidence is too low.

The application should support a read-only mode where it can still display health information but refuses to write historical snapshots.

## R4T separation rule

Watchtower is separate from Roll for Trouble / R4T.

The following must not be reused or mixed:

- R4T users;
- R4T votes;
- R4T campaigns;
- R4T episodes;
- R4T story content;
- R4T Telegram bot identity;
- R4T database tables;
- R4T analytics property;
- R4T secrets or environment variables;
- R4T audience funnel or product positioning.

Generic provider-level infrastructure may be reused only if it remains cleanly separated by project, database, bot, storage namespace, deployment target, and secrets.

## Initial repository structure

Recommended starting structure:

```text
acki-watchtower/
  README.md
  docs/
    architecture-v0.md
    snapshot-policy.md
    state-v2-risk-register.md
    r4t-separation-rules.md
    infrastructure-reuse-audit.md
  apps/
    web/
    telegram/
  packages/
    core/
    api/
    db/
    ui/
```

## Initial implementation order

1. Document the architecture and safety rules.
2. Define the account identity abstraction.
3. Define the API trust model.
4. Define the snapshot policy gate.
5. Build a minimal backend health endpoint.
6. Build a minimal web dashboard shell.
7. Build Telegram app entry point.
8. Add account resolving and monitoring only after the safety model exists.

## Non-goals for the first version

The first version should not attempt to solve everything.

Postpone:

- SDK migration implementation;
- Block Manager license integration;
- heavy account scanning;
- PrivateNote / RootPN / PMP decoder research;
- reward economics projections;
- public user onboarding;
- alerts and automation;
- R4T integration.

## Development posture

Watchtower should be conservative by default.

If data cannot be trusted, the system should say so clearly and refuse to save it.

