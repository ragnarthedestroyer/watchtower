# Batch 64 — On-the-fly token movement dashboard sections

Batch 64 adds a frontend grouping layer for the token movement workstream.

The dashboard separates movement candidates into four visual sections:

1. NACKL mining rewards
2. Direct transfers in
3. Direct transfers out
4. Other / unresolved / contract flows

The first three sections match the intended frontend experience:

- NACKL mining rewards should have their own visual area.
- SHELL, USDC and NACKL direct transfers in should have their own visual area.
- SHELL, USDC and NACKL direct transfers out should have their own visual area.

The fourth section is intentionally included as a safety area. It prevents Watchtower from hiding bridge, accumulator, PrivateNote, DEX, unknown-token, or decoder-needed records that should not be described as direct transfers yet.

## Privacy boundary

This batch is designed for on-the-fly rendering.

It does not add:

- localStorage
- cookies
- analytics
- server persistence
- user account profile storage
- transaction signing
- wallet custody
- key storage
- PrivateNote operation
- DEX operation

The dashboard receives movement candidates in memory, groups them for rendering, and returns a view model or HTML string.

## GDPR note

No-storage design reduces retention and minimization risk, but it does not automatically make the product outside GDPR. A blockchain address or transaction history can still become personal data if it is linked to an identifiable person.

## Files

- `packages/core/src/token-movement-dashboard-sections.ts`
- `apps/web/src/features/token-movement/tokenMovementDashboardSectionsPanel.ts`
- `packages/core/src/index.ts`
