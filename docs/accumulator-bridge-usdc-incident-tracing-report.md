# Batch 58 — Accumulator / bridge / USDC incident tracing report

Batch 58 adds a read-only incident report model for the unresolved SHELL accumulator / USDC recovery case.

The goal is not to prove the answer yet. The goal is to show a user-facing report that separates:

- what was observed;
- what looks connected to SHELL, USDC, accumulator, or bridge flows;
- what is still missing;
- what needs decoder, contract-label, or transaction-message evidence;
- what must not be claimed as proven.

## Main incident supported

A real user incident exists where almost 30k SHELL was reportedly sent to an accumulator to recover or get USDC, after which the visible frontend no longer made the asset flow clear.

Batch 58 lets Watchtower generate a conservative report from TokenMovement candidates created by earlier batches.

## Safety boundary

The report is read-only. It must not:

- ask for seed phrases or private keys;
- sign or broadcast transactions;
- claim custody or recovery;
- operate PrivateNote;
- claim unresolved movements are proof;
- claim a USDC recovery happened unless confirmed evidence exists.

## Files

- `packages/core/src/incident-tracing-report.ts`
- `apps/web/src/features/token-movement/incidentTracingReportPanel.ts`
- `apps/telegram/src/features/token-movement/incidentTracingReportPanel.ts`
- `packages/core/src/index.ts`
- `docs/accumulator-bridge-usdc-incident-tracing-report.md`
- `docs/README_BATCH_58.md`
