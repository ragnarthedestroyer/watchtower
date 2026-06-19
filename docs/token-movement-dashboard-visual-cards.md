# Token movement dashboard visual cards

Batch 69 adds a presentation layer on top of the Batch 68 on-the-fly dashboard.

It converts the four dashboard sections into frontend-friendly visual cards:

- NACKL mining rewards
- Direct transfers in
- Direct transfers out
- Unresolved or contract-routed flows

## Purpose

The user-facing frontend should not show one generic list of movements only. It should clearly separate different asset-flow meanings so a user can quickly answer:

- Did I receive NACKL mining rewards?
- Did I receive direct NACKL, SHELL, or USDC transfers?
- Did I send direct NACKL, SHELL, or USDC transfers?
- Which rows are still unresolved, routed through a contract, or unsafe to call a direct transfer?

## Privacy boundary

The visual cards are generated from the current in-memory dashboard only.

They must not persist:

- wallet movement history
- searched wallet addresses
- exports
- report files
- browser storage
- wallet-linked analytics

## Safety boundary

The visual-card layer is read-only. It does not fetch live data, decode token transfers, sign messages, broadcast transactions, operate wallets, custody assets, operate PrivateNote, or trade on DEX.

Unresolved or contract-routed rows remain separated from simple direct transfers.
