# Watchtower Operations Runbook

## Purpose

This runbook defines how to operate Watchtower safely once it is deployed as a web and Telegram app.

## Normal Daily Check

1. Check API trust status.
2. Check Mobile Verifier epoch status.
3. Check latest snapshot attempt.
4. Check whether last snapshot was saved or blocked.
5. Review blocked reasons if any.
6. Confirm Telegram alert delivery if status changed.

## Safe Modes

### Normal Mode

API trust is OK, epoch status is acceptable, resolver cache is fresh, and snapshots may be saved.

### Read-Only Mode

App is usable, but no snapshots are saved.

Triggers:

- degraded API;
- stale epoch;
- expired epoch beyond grace;
- partial wallet results;
- unresolved identities;
- decoder uncertainty.

### Blocked Mode

Monitoring run stopped early.

Triggers:

- rate limit;
- public API down;
- repeated Cloudflare errors;
- missing required configuration;
- SDK incompatibility.

## Incident: API Rate Limited

Actions:

1. Stop current polling batch.
2. Mark API trust as `RATE_LIMITED`.
3. Do not save snapshot.
4. Notify admin.
5. Increase next retry delay.
6. Consider whether API strategy needs Block Manager or dedicated endpoint.

## Incident: Epoch Expired

Actions:

1. Mark epoch status as `EXPIRED`.
2. Allow short grace only if configured.
3. Block snapshots after grace.
4. Display root status in dashboard.
5. Do not infer daily mining output from stale epoch boundaries.

## Incident: All Balances Zero

Actions:

1. Treat as suspicious unless explicitly expected.
2. Do not save financial snapshot.
3. Save blocked snapshot attempt with reason.
4. Check API trust and decoder status.
5. Re-run only after API status improves.

## Incident: State V2 Migration Active

Actions:

1. Freeze legacy snapshot saving unless explicitly approved.
2. Update resolver configuration.
3. Verify DApp ID + Account ID for each target.
4. Run test resolution without saving snapshots.
5. Resume saving only after identity resolution and API trust are healthy.

## Emergency Wallet Restriction Watch

Any announced restriction affecting wallet access, wallet migration, KYC, device switching, wallet extraction, or locked NACKL exit ability must be treated as high priority and surfaced immediately.
