# R4T Infrastructure Reuse Audit for Acki Watchtower

## Purpose

This audit identifies which currently configured or paid Roll for Trouble (R4T) infrastructure resources may be safely reused for Acki Watchtower without mixing branding, data, secrets, user flows, or future R4T restart options.

Acki Watchtower is a separate product. It may reuse generic provider capacity, but it must not inherit R4T identity, audience positioning, story content, community funnel, database data, bot credentials, or secrets.

## Boundary Decision

R4T remains paused and clean. Watchtower is not an R4T feature, not an R4T relaunch, and not an R4T audience funnel.

Allowed reuse is limited to:

- same hosting provider account;
- same billing account;
- same database provider, with a separate database or schema;
- same DNS provider, with a separate domain/subdomain;
- same CI/CD pattern, with new secrets and new deploy target;
- same technical knowledge from the R4T build.

Not allowed:

- R4T production database;
- R4T user, nickname, vote, story, episode, campaign, or admin data;
- R4T bot token or bot identity;
- R4T public URL as the Watchtower URL;
- R4T repo as the Watchtower repo;
- R4T analytics property;
- R4T secrets or environment variables.

## Checklist

| Resource | Decision | Notes |
|---|---:|---|
| Hosting provider account | Reuse | Provider-level reuse is acceptable. Create a new app/project for Watchtower. |
| Existing R4T hosting app | Keep reserved or shut down | Do not convert the R4T app into Watchtower unless R4T is permanently abandoned. |
| R4T domain | Keep reserved | Do not point R4T domain to Watchtower. |
| New Watchtower domain/subdomain | Reuse generic DNS capacity | Use a clearly separate name such as `watchtower`, `acki-watchtower`, or `an-watchtower`. |
| R4T production database | Do not touch | Never mix R4T users/votes/content with wallet-monitor data. |
| Database provider account | Reuse | Create a new database or a strictly isolated schema. |
| R4T Telegram bot | Keep reserved | Do not reuse bot token, username, menu, or Mini App URL. |
| New Watchtower Telegram bot | Reuse Telegram Mini App pattern | Separate bot identity and separate user flow. |
| R4T storage bucket/folders | Do not touch | Keep story/content/logs separate. |
| Storage provider account | Reuse | Create `watchtower/` namespace or a new bucket. |
| R4T GitHub repo | Do not touch | Watchtower gets a new repo. |
| CI/CD pattern | Reuse pattern only | Copy structure if useful, but remove R4T secrets, names, and deploy targets. |
| R4T CI/CD workflow as-is | Do not touch | No shared deploy pipeline. |
| R4T analytics property | Keep reserved or shut down | Watchtower analytics must be separate. |
| R4T secrets/env vars | Do not touch | Secrets must not cross products. |
| R4T audience channels | Keep reserved | Do not use R4T channel as Watchtower funnel. |

## Required Separation Controls

Watchtower must have separate:

- GitHub repository;
- deployment project;
- database;
- Telegram bot;
- environment variables;
- admin credentials;
- analytics property if analytics are used;
- storage namespace;
- public URL;
- product name and UI copy.

## Watchtower Data Classes

Watchtower may store:

- watched wallet/account identities;
- resolved legacy or State V2 account references;
- API health checks;
- Mobile Verifier epoch status;
- snapshot metadata;
- balance or mining metrics only when safe to save;
- user-specific watchlists if the app later supports accounts.

Watchtower must not store or import:

- R4T votes;
- R4T episode views;
- R4T nicknames/adventurer identities;
- R4T campaign content;
- R4T admin logs;
- R4T Telegram user interactions.

## Decision

Reuse generic infrastructure first. Postpone SDK migration, wallet identity abstraction implementation, and API strategy decisions to Watchtower technical work.
