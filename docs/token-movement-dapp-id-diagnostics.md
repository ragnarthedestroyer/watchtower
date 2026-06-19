# Batch 86 — Token movement DApp ID diagnostics

Batch 86 adds a user-facing diagnostic layer for the current live-history blocker:
legacy `0:<64hex>` account history can be probed, but production live history requires
State V2 `account_id + dapp_id`.

The feature does not guess the DApp ID. It converts the missing value into an explicit
blocked state and gives the user actionable next steps.

## What it adds

- Extracts `account_id` from a legacy `0:<64hex>` address.
- Validates whether `dapp_id` is exactly 64 lowercase hex characters.
- Treats a multifactor address as useful public context, but not as proof of `dapp_id`.
- Detects live-history warnings such as deprecated legacy API and missing transactions on
  the root account query.
- Produces curl templates for both legacy probe and State V2 live-history retry.
- Adds web and Telegram renderers.
- Adds the diagnostic panel to the live token movement web section.

## Safety boundary

This batch remains read-only and on-the-fly only. It does not:

- store searched addresses;
- store wallet history;
- operate wallets;
- sign messages;
- request private keys or seed phrases;
- infer the DApp ID from a multifactor address without confirmation.

## Why this matters

The user may have the account address and multifactor address but still not know the
production DApp ID. Without this panel, the UI can look like “no transactions found”.
With this panel, Watchtower explains that live history is blocked by missing State V2
namespace information.
