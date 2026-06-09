# Watchtower API Trust Model

## Purpose

Watchtower must never save snapshots when API data is degraded, stale, incomplete, rate-limited, or suspicious.

The app must behave as a respectful observer, not as a miner bot or aggressive scanner.

## Trust States

| State | Meaning | Snapshot Saving |
|---|---|---:|
| `OK` | API is reachable, fresh, complete, and not rate-limited. | Allowed if all other policy checks pass. |
| `DEGRADED` | API works partially or slowly; some requests fail. | Blocked. |
| `RATE_LIMITED` | API returns 429 or rate-limit indicators. | Blocked. |
| `STALE` | API data is older than accepted threshold. | Blocked. |
| `DOWN` | API unavailable, 502/503, Cloudflare outage, origin failure. | Blocked. |
| `UNKNOWN` | Trust could not be determined. | Blocked. |

## Inputs

The trust model should use:

- HTTP status;
- GraphQL response status;
- explicit GraphQL errors;
- request latency;
- rate-limit indicators;
- stale timestamps;
- failed account lookups;
- partial BOC responses;
- MV root freshness;
- recent health history;
- endpoint source.

## Blocking Signals

Snapshot saving must be blocked when any of these appear:

- HTTP 429;
- HTTP 502 or 503;
- Cloudflare error response;
- repeated timeout;
- GraphQL errors;
- empty account data where account should exist;
- account BOC missing for required target;
- stale MV root status;
- stale resolver cache;
- all wallet balances decode as zero;
- insufficient successful wallet checks;
- decoder confidence is unresolved.

## Rate-Limit Behavior

When rate limiting is detected:

1. Stop the current batch.
2. Do not retry aggressively.
3. Save API health event, not wallet snapshot.
4. Enter read-only mode.
5. Show the state in dashboard and Telegram UI.
6. Wait until next scheduled run or admin retry.

## Request Behavior

Recommended defaults:

```json
{
  "delayBetweenRequestsMs": 2500,
  "maxRetries": 2,
  "retryAfterRateLimitMs": 120000,
  "retryAfterOutageMs": 60000,
  "stopBatchOnRateLimit": true,
  "stopBatchOnCloudflareOutage": true
}
```

## Output Shape

```ts
type ApiTrustReport = {
  status: "OK" | "DEGRADED" | "RATE_LIMITED" | "STALE" | "DOWN" | "UNKNOWN";
  checkedAt: string;
  endpoint: string;
  latencyMs?: number;
  httpStatus?: number;
  graphqlReachable: boolean;
  rateLimited: boolean;
  stale: boolean;
  reasons: string[];
};
```

## Dashboard Rule

The dashboard may display current read-only data during degraded conditions, but it must clearly say:

```text
Snapshot not saved because API trust is not OK.
```
