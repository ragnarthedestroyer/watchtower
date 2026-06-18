# Batch 60 — Token Movement Evidence Bundle

Batch 60 adds a read-only evidence bundle layer for token movement candidates.

The goal is to make every movement explainable before Watchtower shows it as part of a user-facing conclusion.

It answers:

- What facts do we have?
- Which evidence supports the movement?
- What is missing?
- What still needs review?
- Is this confirmed, probable, possible, or unresolved?

This is especially important for the SHELL accumulator / USDC recovery incident, where Watchtower must show what can be proven and what remains uncertain.

## Safety boundary

This batch does not fetch live history, decode transfers, recover funds, sign messages, custody assets, operate PrivateNote, or make proof claims for unresolved movements.

## Main file

- `packages/core/src/token-movement-evidence-bundle.ts`

## Renderers

- `apps/web/src/features/token-movement/tokenMovementEvidenceBundlePanel.ts`
- `apps/telegram/src/features/token-movement/tokenMovementEvidenceBundlePanel.ts`
