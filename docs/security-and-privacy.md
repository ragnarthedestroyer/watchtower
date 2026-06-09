# Watchtower Security and Privacy

## Purpose

Watchtower is a monitoring and transparency tool. It must not become a wallet custody tool or a secret-handling system unless explicitly redesigned for that purpose.

## Security Principles

1. No private keys.
2. No seed phrases.
3. No wallet signing in MVP.
4. No token transfers in MVP.
5. No R4T secrets.
6. No shared R4T database.
7. No hidden financial claims.
8. No snapshot saving when trust is degraded.

## Secrets

Watchtower may use operational secrets such as:

- database URL;
- Telegram bot token;
- admin session secret;
- API token if available;
- deployment credentials.

These must be separate from R4T secrets.

## User Data

Potential Watchtower user data:

- Telegram user ID if Telegram login is used;
- watchlist preferences;
- admin activity logs;
- dashboard access logs.

Do not collect more than necessary.

## Wallet Data

Wallet/account monitoring data may be public on-chain data, but user-created watchlists can still be sensitive.

Treat watchlist ownership as private unless the user explicitly makes it public.

## Admin Access

Admin operations should require authentication.

Examples:

- adding/removing watch targets;
- enabling public views;
- changing API endpoint;
- changing snapshot policy thresholds;
- triggering manual checks.

## Data Separation from R4T

Watchtower must not read or write:

- R4T users;
- R4T votes;
- R4T campaigns;
- R4T episodes;
- R4T nicknames;
- R4T admin actions;
- R4T Telegram bot interactions.

## Logging Rules

Logs should not contain:

- seed phrases;
- private keys;
- full secrets;
- Telegram bot token;
- database credentials;
- API tokens.

Logs may contain:

- shortened account references;
- status codes;
- blocked reasons;
- resolver status;
- snapshot attempt IDs.

## Public Dashboard Rule

A public dashboard must not expose private watchlists unless explicitly configured.
