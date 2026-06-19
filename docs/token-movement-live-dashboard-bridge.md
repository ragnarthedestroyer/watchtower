# Batch 80 — Live raw dashboard bridge foundation

Batch 80 connects live raw account history to a dashboard-shaped view without pretending that token movement has been decoded.

## Purpose

After Batch 79, the web app can load live raw transaction/message history. Batch 80 projects that same live data into the frontend dashboard structure so the user can start seeing real evidence in the same visual pattern as the synthetic preview.

## What this adds

- A read-only live dashboard bridge view model.
- A Web panel for raw evidence grouped into dashboard sections.
- A Telegram renderer for compact review output.
- Web frontend integration below the live raw evidence panel.

## Sections

- NACKL mining rewards — reserved until decoder/source evidence can prove mining rewards.
- Raw transfer-in candidates — incoming live message evidence, not confirmed token transfer.
- Raw transfer-out candidates — outgoing live message evidence, not confirmed token transfer.
- Unresolved or contract-routed — unknown, self-directed, contract-routed, or unsafe rows.

## Safety boundary

This batch does not decode token bodies, classify SHELL/USDC/NACKL, infer mining rewards, store wallet history, store searched addresses, use analytics, sign transactions, custody assets, operate PrivateNote, or interact with DEX functionality.

## Privacy boundary

The view is on-the-fly only. Rows are generated from the current request and should be discarded when the page/session is closed or refreshed.
