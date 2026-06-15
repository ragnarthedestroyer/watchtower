# Live Read Test Plan

This is the practical test plan for moving Watchtower from demo-mode toward live-read mode.

## Current live-read status

Implemented foundations:

```text
GET /health
GET /config/status
GET /accounts/raw
GET /accounts/inspect
GET /epoch/mobile-verifier
GET /snapshots/live
```

The system can now make controlled live-read calls, but balance decoding is still conservative.

## Test order

### 1. Server route smoke test

Run:

```bash
node apps/server/scripts/smoke-test.mjs
```

Goal:

```text
Confirm the server responds and routes are wired correctly.
```

### 2. Config status

Open:

```text
GET /config/status
```

Goal:

```text
Confirm whether Watchtower is running in demo or live-read mode.
Confirm whether endpoint values are present and valid.
```

### 3. Health check

Open:

```text
GET /health
```

Goal:

```text
Confirm whether the configured Acki Nacki endpoint is reachable, slow, stale, rate-limited, or unavailable.
```

### 4. Raw account read

Open:

```text
GET /accounts/raw?address=0:<64hex>
```

Goal:

```text
Confirm whether a raw account record can be retrieved.
Do not interpret raw balance as wallet NACKL yet.
```

### 5. Account inspection

Open:

```text
GET /accounts/inspect?address=0:<64hex>
```

Goal:

```text
Inspect normalized fields, raw response shape, classification, and balance candidates.
```

### 6. Mobile Verifier root

Open:

```text
GET /epoch/mobile-verifier
```

Optionally:

```text
GET /epoch/mobile-verifier?address=0:<mv-root-address>
```

Goal:

```text
Check whether epoch-like fields appear in the raw response.
Keep status unresolved until decoding is confirmed.
```

### 7. Live snapshot

Open:

```text
GET /snapshots/live
```

Goal:

```text
Verify that Watchtower can combine health, epoch, wallet reads, balance evidence, and snapshot policy into one response.
```

## Stop conditions

Do not continue live-read testing if any of these appear:

```text
API trust status is RATE_LIMITED.
API trust status is DOWN.
Cloudflare/API outage signal detected.
All wallets return zero or missing data unexpectedly.
Mobile Verifier root is missing or stale.
```

## Next implementation step

After this test plan is committed, the next implementation batch should improve live-read observability in the web app, so the user can see server/config/snapshot status without manually opening each endpoint.
