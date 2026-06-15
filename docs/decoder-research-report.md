# Decoder research report foundation

Batch 48 adds a structured decoder research report layer.

## New API module

```text
packages/api/src/decoder-research-report.ts
```

The report converts an account inspection result into a compact research object with:

- account identity and normalized account metadata;
- account classification;
- balance evidence summary;
- balance candidate groups;
- blockers;
- suggested next steps;
- warnings.

## New server route

```text
GET /decoder/research-report?address=0:<64hex>
```

Future State V2 shape:

```text
GET /decoder/research-report?account_id=<64hex>&dapp_id=<64hex>
```

## Safety model

The route is read-only. It does not save snapshots and does not confirm balances.

The report is intended to help compare evidence across multiple inspected accounts so decoder work can move carefully from candidate detection toward confirmed ABI/BOC decoding.

## Current interpretation rules

- `candidate_evidence_found` means there is useful research material, not confirmed wallet balance.
- `research_needed` means the inspection produced too little evidence.
- `blocked` means the account read/inspection itself failed or returned no account.
- `ready_for_manual_review` means no current blocker was found, but this still requires human review before changing decoder confidence rules.

## What comes next

The next practical step is to add UI visibility for decoder research reports or use this route manually during live testing with known accounts.
