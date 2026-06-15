# Manual Testing Without Local Setup

This project can be developed through GitHub web uploads first. A local computer setup is not required for every step.

## What can be checked without local setup

The following can be checked through GitHub Actions:

- TypeScript compilation
- Package dependency installation
- Import/export mistakes
- Most strict typing problems

## What cannot be fully checked without running the app

The following require Codespaces, a local terminal, or deployment:

- Whether the server responds in the browser
- Whether the web app can reach the server
- Whether Telegram WebApp runtime detection works in Telegram
- Whether real Acki Nacki endpoints respond correctly
- Whether live account reads return useful account state
- Whether Mobile Verifier root decoding finds the expected fields

## Recommended testing order

1. Keep GitHub Actions green.
2. Use Codespaces for server smoke tests.
3. Use Codespaces or deployment for web app testing.
4. Only then test Telegram Mini App behavior.
5. Only then connect live Acki Nacki endpoints.

## Safety note

Watchtower should not save snapshots while any of these are unresolved:

- API health
- Mobile Verifier epoch decoding
- balance decoder confidence
- account classification
- State V2 address handling

A blocked snapshot is a safe result during early development.
