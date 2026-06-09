export type MobileVerifierEpochStatus =
  | "ACTIVE"
  | "EXPIRED"
  | "FUTURE"
  | "UNKNOWN"
  | "ERROR";

export type MobileVerifierEpoch = {
  source: "mobile_verifiers_root";
  rootAddress?: string;

  checkedAt: string;

  status: MobileVerifierEpochStatus;
  statusReason: string;

  networkStartIso?: string;
  epochStartIso?: string;
  epochEndIso?: string;

  secondsSinceEpochStart?: number | null;
  secondsUntilEpochEnd?: number | null;

  previousEpochDurationSeconds?: number | null;

  rewardLastTimeIso?: string;
  rewardPeriodSeconds?: number | null;
  nextRewardTimeIso?: string;
  secondsUntilNextReward?: number | null;
};

export type RawMobileVerifierRootFields = {
  networkStart?: string;
  epochStart?: string;
  epochEnd?: string;
  previousEpochDuration?: string;

  rewardSum?: string;
  rewardAdjustment?: string;
  rewardAdjustmentPreviousEpoch?: string;
  rewardLastTime?: string;
  rewardPeriod?: string;
  minimumRewardPeriod?: string;

  sumCoefficient?: string;
  calculatedRewardNumber?: string;
  lastTap?: string;
};

export function classifyMobileVerifierEpoch(input: {
  nowSeconds: number;
  epochStartSeconds?: number | null;
  epochEndSeconds?: number | null;
}): {
  status: MobileVerifierEpochStatus;
  statusReason: string;
} {
  const { nowSeconds, epochStartSeconds, epochEndSeconds } = input;

  if (
    epochStartSeconds === null ||
    epochStartSeconds === undefined ||
    epochEndSeconds === null ||
    epochEndSeconds === undefined
  ) {
    return {
      status: "UNKNOWN",
      statusReason: "Epoch start or end is missing."
    };
  }

  if (nowSeconds < epochStartSeconds) {
    return {
      status: "FUTURE",
      statusReason: "Current time is before the on-chain epoch start."
    };
  }

  if (nowSeconds >= epochStartSeconds && nowSeconds <= epochEndSeconds) {
    return {
      status: "ACTIVE",
      statusReason: "Current time is inside the on-chain epoch window."
    };
  }

  return {
    status: "EXPIRED",
    statusReason:
      "Current time is after the on-chain epoch end; root may not have advanced yet."
  };
}
