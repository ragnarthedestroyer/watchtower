# Batch 90: Final GraphQL Tracer Alignment

## Objective
Aligns Watchtower's live transaction history tables with `gql-server >= 1.0.0`. It extends the archival node query filters to explicitly specify the `token_dapp` identifiers alongside the `token_root`, preventing empty datasets and `DappIdRequired` network rejections.

## Changes Executed
* **Archival Node Adapter**: Created `ArchivalNodeV3Adapter.ts` inside `packages/core/src/graphql/` to strictly type and map supported token configurations into compliant GraphQL variable payloads.
