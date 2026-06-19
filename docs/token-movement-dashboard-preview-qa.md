# Token movement dashboard preview QA foundation

Batch 76 adds a deterministic QA layer for the synthetic token movement dashboard preview.

The goal is to make the visible frontend safer to review before live account history, message-body decoding, and API route wiring are connected.

## What it checks

The QA report verifies that:

- the preview is explicitly synthetic and no-storage;
- NACKL mining reward rows exist;
- direct inbound NACKL, SHELL, and USDC rows exist;
- direct outbound NACKL, SHELL, and USDC rows exist;
- unresolved or contract-routed rows exist;
- mining rewards are not mixed into direct transfers in;
- accumulator / recovery-route examples are not shown as direct transfers;
- accumulator / recovery-route examples remain visible in the unresolved review section;
- visual card counts match dashboard sections;
- timeline rows match visible dashboard rows;
- privacy and synthetic-preview notes are present.

## Privacy boundary

This batch remains on-the-fly and no-storage.

It does not persist wallet history, searched addresses, selected rows, filters, exports, or analytics.

## Safety boundary

Passing this QA report only means the synthetic preview structure is internally consistent.

It does not prove any real token movement, real mining reward, real transfer, USDC recovery, SHELL loss, or bridge outcome.
