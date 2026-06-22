# Batch 89: Mining Hub & Session Automation

## Objective
Upgrades the core Miner orchestration sequences to align strictly with the tvm-sdk v3 session lifecycles. It introduces safe polling wrappers to handle API quota limits and monitors for `submit_session_root` failures during epoch transitions.

## Changes Executed
* **Miner Session Manager**: Created `MinerSessionManager.ts` inside `packages/core/src/mining/` to coordinate mining loops, catch `QUEUE_OVERFLOW` errors gracefully, and validate on-chain session acceptance.
