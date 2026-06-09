# Mobile Verifier Epoch Model

## Purpose

Watchtower must use on-chain Mobile Verifier epoch state as the primary cycle reference instead of local midnight or a manual daily anchor.

## Context

The Xubuntu prototype showed that the Mobile Verifiers root contract exposed useful epoch fields such as:

- `_epochStart`;
- `_epochEnd`;
- `_prevEpochDuration`;
- `_reward_last_time`;
- `_reward_period`;
- `_reward_sum`.

These fields should inform the Watchtower health and snapshot policy.

## Epoch Statuses

| Status | Meaning |
|---|---|
| `ACTIVE` | Current time is between on-chain epoch start and epoch end. |
| `EXPIRED` | Current time is after epoch end and the root has not advanced yet. |
| `FUTURE` | Current time is before the reported epoch start. |
| `STALE` | Epoch status cache is too old. |
| `UNKNOWN` | Epoch data could not be decoded. |
| `ERROR` | Fetch or decode failed. |

## Snapshot Interaction

Default policy:

- `ACTIVE`: snapshot may be allowed if API and wallet checks pass.
- `EXPIRED`: snapshot should be blocked after a small grace period.
- `STALE`: snapshot blocked.
- `UNKNOWN`: snapshot blocked.
- `ERROR`: snapshot blocked.

## Suggested Thresholds

```json
{
  "maxEpochStatusAgeMinutes": 30,
  "allowExpiredEpochGraceMinutes": 20,
  "requireEpochStatusForSnapshots": true
}
```

## Data Shape

```ts
type MobileVerifierEpochStatus = {
  checkedAt: string;
  source: "MobileVerifiersContractRoot";
  status: "ACTIVE" | "EXPIRED" | "FUTURE" | "STALE" | "UNKNOWN" | "ERROR";
  root: AccountReference;
  epoch: {
    startRaw?: string;
    startIso?: string;
    endRaw?: string;
    endIso?: string;
    secondsSinceStart?: number;
    secondsUntilEnd?: number;
    previousDurationRaw?: string;
  };
  reward: {
    rewardSum?: string;
    rewardLastTime?: string;
    rewardPeriod?: string;
    nextRewardEstimate?: string;
  };
  reasons: string[];
};
```

## UI Requirements

The web and Telegram UI must show:

- epoch status;
- epoch start;
- epoch end;
- countdown or overdue value;
- source contract;
- whether snapshots are allowed.

If the epoch is expired or stale, the UI must not imply that wallet mining output for the current day is reliable.
