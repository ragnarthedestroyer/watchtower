# Batch 87: Upgrade to tvm-sdk v3 Local Bundle & Architecture Sync

## Objective
Establishes the standalone local directory structure for `@teamgosh/bee-sdk` to isolate the version 3 migration surface, and introduces the strict TypeScript manager to handle positional wallet initialization and object-based token queries.

## Changes Executed
* **Dependency Mapping**: Automated the injection of the local workspace package reference (`"file:public/bee-sdk"`) into `package.json`.
* **Wallet Manager Integration**: Added `BeeWalletManager.ts` to `packages/core/src/` to safely wrap the breaking API changes (positional arguments, bare 64-hex dApp IDs, and native balance big-int parsing).
