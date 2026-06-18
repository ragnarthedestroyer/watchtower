# Watchtower Batch 58

## Title

Accumulator / bridge / USDC incident tracing report

## Files included

- `packages/core/src/incident-tracing-report.ts`
- `packages/core/src/index.ts`
- `apps/web/src/features/token-movement/incidentTracingReportPanel.ts`
- `apps/telegram/src/features/token-movement/incidentTracingReportPanel.ts`
- `docs/accumulator-bridge-usdc-incident-tracing-report.md`
- `docs/README_BATCH_58.md`

## What it adds

Batch 58 adds a read-only report layer for unresolved asset-flow incidents, starting with the SHELL accumulator / USDC recovery case.

It consumes existing TokenMovement candidates and produces:

- report status;
- findings;
- relevant movement counts;
- missing evidence;
- recommended next checks;
- Web and Telegram report renderers;
- explicit safety warnings.

## What it does not do

- It does not fetch live chain history.
- It does not decode token transfers.
- It does not prove that USDC was recovered.
- It does not operate wallets, bridges, PrivateNote, accumulators, or contracts.
- It does not request seed phrases, private keys, or signatures.

## Required check

Run:

```bash
npm run typecheck
```

## Commit message

```text
Batch 58: add accumulator bridge USDC incident tracing report
```
