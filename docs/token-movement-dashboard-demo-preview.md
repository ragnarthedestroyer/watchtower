# Token movement dashboard demo preview

Batch 75 adds a deterministic, synthetic preview layer for the token movement dashboard.

The purpose is to make the frontend visible and reviewable before live chain history, token body decoding, and API route implementation are connected.

## What the preview covers

The preview includes example rows for:

- NACKL mining rewards;
- direct NACKL transfer in;
- direct SHELL transfer in;
- possible USDC transfer in;
- direct NACKL transfer out;
- direct SHELL transfer out;
- possible USDC transfer out;
- unresolved SHELL accumulator / USDC recovery-route review.

## Privacy boundary

The preview is synthetic only. It must not store wallet history, searched addresses, exports, selected rows, browser state, or wallet-linked analytics.

## Safety boundary

Synthetic rows are not real wallet evidence. The unresolved accumulator example is intentionally routed to the unresolved/review section and must not be shown as a simple direct transfer or proof of USDC recovery/loss.
