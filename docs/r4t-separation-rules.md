# R4T Separation Rules for Acki Watchtower

## Purpose

Acki Watchtower is a separate monitoring and transparency project. It may reuse generic infrastructure capacity, provider accounts, and technical lessons from Roll for Trouble (R4T), but it must not inherit R4T branding, story identity, audience funnel, data, secrets, or user flows.

R4T is paused and must remain clean, restartable, and understandable as its own project: a free episodic community-driven comedy-fantasy RPG story. Watchtower is a web and Telegram-based Acki Nacki monitoring tool.

These rules exist to prevent accidental contamination between the two projects.

---

## Core rule

R4T and Watchtower must be treated as separate products.

Watchtower may reuse:

- generic hosting provider knowledge;
- generic CI/CD patterns;
- generic UI/deployment lessons;
- generic provider accounts if billing separation is clear;
- unused generic infrastructure capacity if no R4T data or identity is attached.

Watchtower must not reuse:

- R4T production database;
- R4T user records;
- R4T votes;
- R4T nicknames/adventurer identities;
- R4T campaigns, episodes, choices, or story content;
- R4T Telegram bot token or bot identity;
- R4T domain or public funnel;
- R4T analytics property;
- R4T secrets or environment variables;
- R4T GitHub repository as the Watchtower repository.

---

## Product boundary

### R4T

R4T is a story/voting product. Its public identity is:

- fantasy;
- comedy;
- episodic;
- community voting;
- campaign/canon creation;
- non-technical audience experience.

R4T must not become a wallet-monitoring dashboard.

### Watchtower

Watchtower is a monitoring/transparency product. Its public identity is:

- Acki Nacki account monitoring;
- wallet/account watchlists;
- Mobile Verifier epoch status;
- API health status;
- snapshot reliability;
- blockchain-data transparency.

Watchtower must not present itself as a story game, R4T extension, or RPG voting tool.

---

## Data separation rules

Watchtower must use its own database or a fully isolated schema.

No R4T table may be read, joined, copied, imported, synchronized, or reused by Watchtower.

Forbidden data mixing includes:

- R4T user accounts with Watchtower users;
- R4T Telegram identities with Watchtower identities;
- R4T votes with Watchtower wallet activity;
- R4T nickname/adventurer identity with Watchtower account identity;
- R4T campaign/episode data with Watchtower dashboards;
- R4T analytics events with Watchtower analytics events.

Recommended Watchtower-specific data model names:

- `watchtower_users`
- `watchtower_watchlists`
- `watchtower_wallet_identities`
- `watchtower_resolved_accounts`
- `watchtower_snapshots`
- `watchtower_api_health`
- `watchtower_epoch_status`
- `watchtower_alerts`

---

## Secret and environment separation

Watchtower must use its own secrets.

Never copy R4T environment variables into Watchtower without review.

Forbidden secret reuse:

- R4T database URL;
- R4T Telegram bot token;
- R4T admin secret or admin PIN;
- R4T auth provider secret;
- R4T deployment token;
- R4T storage credentials;
- R4T analytics keys.

Watchtower environment variables should be named explicitly, for example:

```text
WATCHTOWER_DATABASE_URL=
WATCHTOWER_TELEGRAM_BOT_TOKEN=
WATCHTOWER_PUBLIC_APP_URL=
WATCHTOWER_ADMIN_SECRET=
WATCHTOWER_GRAPHQL_ENDPOINT=
WATCHTOWER_SNAPSHOT_POLICY_MODE=
WATCHTOWER_API_RATE_LIMIT_MODE=
```

Future variables should also remain Watchtower-specific:

```text
WATCHTOWER_DAPP_ID=
WATCHTOWER_BLOCK_MANAGER_ENDPOINT=
WATCHTOWER_API_KEY=
```

---

## Telegram separation

Watchtower needs its own Telegram bot and Mini App identity.

Do not reuse:

- R4T bot username;
- R4T bot token;
- R4T Mini App link;
- R4T channel funnel;
- R4T audience onboarding;
- R4T story update format.

Acceptable reuse:

- the general concept of a Telegram Mini App;
- technical knowledge from the R4T Telegram implementation;
- UI lessons from R4T, if branding and data are removed.

Watchtower Telegram entry point should clearly state that it is a monitoring tool, not a game.

---

## Domain and branding separation

Do not host Watchtower under an R4T-branded path or domain.

Avoid:

```text
r4t.example.com/watchtower
roll4trouble.example.com/watchtower
```

Prefer:

```text
watchtower.example.com
acki-watchtower.example.com
an-watchtower.example.com
```

Watchtower branding should not use R4T fantasy names, story characters, episode language, campaign labels, or comedic RPG framing.

---

## Repository separation

Watchtower must have a new GitHub repository.

Recommended name:

```text
acki-watchtower
```

The R4T repository must not become the Watchtower repository.

Allowed:

- copying small generic utility patterns after removing R4T-specific code;
- copying deployment lessons into documentation;
- referencing R4T only in separation/audit documentation.

Not allowed:

- importing R4T app code wholesale;
- sharing R4T database migrations;
- sharing R4T auth/session logic without redesign;
- sharing R4T secrets;
- using R4T issues, releases, or roadmap as Watchtower tracking.

---

## Infrastructure reuse decision matrix

| Resource | Default decision | Rule |
|---|---:|---|
| Hosting provider account | Reuse | Only provider/billing-level reuse. Create a new app/project. |
| Existing R4T app deployment | Keep reserved or shut down | Do not convert directly into Watchtower. |
| R4T domain | Keep reserved | Do not use for Watchtower. |
| R4T database | Do not touch | No data or schema mixing. |
| Database provider account | Reuse | Only with a new database or isolated schema. |
| R4T Telegram bot | Keep reserved | Create a new Watchtower bot. |
| Storage provider | Reuse | Use new bucket/folder namespace. |
| R4T storage folders | Do not touch | Keep R4T content/logs separate. |
| R4T CI/CD workflow | Copy pattern only | Do not reuse secrets or deployment target. |
| R4T analytics property | Keep reserved or shut down | Create separate Watchtower analytics if needed. |
| R4T GitHub repo | Do not touch | Create a new Watchtower repo. |
| R4T secrets/env vars | Do not touch | Create Watchtower-specific secrets. |

---

## R4T restart protection

R4T may restart later. Watchtower decisions must not make that harder.

Therefore:

- keep R4T domain ownership intact;
- keep R4T repo intact;
- keep R4T database backups intact if needed;
- keep R4T bot identity reserved;
- document any infrastructure shutdowns before executing them;
- do not delete R4T data unless there is a separate, explicit decision.

---

## Watchtower build boundary

The Watchtower build should start clean and carry forward only lessons learned:

- web + Telegram-first deployment;
- State V2-aware identity abstraction;
- API trust gate before snapshot saving;
- Mobile Verifier epoch validation;
- clear snapshot policy;
- rate-limit-respectful design.

Do not carry forward:

- R4T data;
- R4T branding;
- R4T user journey;
- R4T campaign mechanics;
- R4T story identity.

---

## Checklist before using any R4T-related resource

Before reusing any resource, answer:

1. Is this generic infrastructure, or is it product-specific R4T identity?
2. Does it contain R4T user, vote, story, campaign, or analytics data?
3. Does it contain R4T secrets or environment variables?
4. Would reusing it confuse R4T users or Watchtower users?
5. Would reusing it make a future R4T restart harder?
6. Can Watchtower use a fresh project/database/bot instead?

If any answer is unclear, do not reuse it.

---

## Final rule

Watchtower can reuse infrastructure capacity.

Watchtower cannot reuse R4T identity.

R4T remains paused, clean, and separate.
