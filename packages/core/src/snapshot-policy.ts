export type SnapshotDecisionMode = "SAFE_TO_SAVE" | "READ_ONLY" | "BLOCKED";

export type ApiTrustStatus =
  | "OK"
  | "DEGRADED"
  | "RATE_LIMITED"
  | "STALE"
  | "DOWN"
  | "UNKNOWN";

export type EpochStatus =
  | "ACTIVE"
  | "EXPIRED"
  | "FUTURE"
  | "UNKNOWN"
  | "ERROR";

export type SnapshotPolicyInput = {
  apiTrustStatus: ApiTrustStatus;
  epochStatus: EpochStatus;
  mvRootStatusAgeMinutes: number | null;
  successfulWallets: number;
  configuredWallets: number;
  allBalancesZero: boolean;
  decoderConfidence: "confirmed" | "partial" | "unresolved";
  hasRateLimitSignal: boolean;
  hasCloudflareOutageSignal: boolean;
};

export type SnapshotPolicyDecision = {
  mode: SnapshotDecisionMode;
  safeToSave: boolean;
  reasons: string[];
};

export function evaluateSnapshotPolicy(
  input: SnapshotPolicyInput
): SnapshotPolicyDecision {
  const reasons: string[] = [];

  if (input.apiTrustStatus !== "OK") {
    reasons.push(`API trust status is ${input.apiTrustStatus}.`);
  }

  if (input.hasRateLimitSignal) {
    reasons.push("Rate-limit signal detected.");
  }

  if (input.hasCloudflareOutageSignal) {
    reasons.push("Cloudflare/API outage signal detected.");
  }

  if (input.epochStatus === "ERROR" || input.epochStatus === "UNKNOWN") {
    reasons.push(`Epoch status is ${input.epochStatus}.`);
  }

  if (input.epochStatus === "EXPIRED") {
    reasons.push("Mobile Verifier epoch is expired.");
  }

  if (
    input.mvRootStatusAgeMinutes === null ||
    input.mvRootStatusAgeMinutes > 30
  ) {
    reasons.push("MV root status is missing or stale.");
  }

  if (input.configuredWallets > 0) {
    const successRatio = input.successfulWallets / input.configuredWallets;

    if (successRatio < 0.8) {
      reasons.push(
        `Only ${input.successfulWallets}/${input.configuredWallets} wallets succeeded.`
      );
    }
  }

  if (input.allBalancesZero) {
    reasons.push("All balances are zero; snapshot is suspicious.");
  }

  if (input.decoderConfidence !== "confirmed") {
    reasons.push(`Decoder confidence is ${input.decoderConfidence}.`);
  }

  if (reasons.length === 0) {
    return {
      mode: "SAFE_TO_SAVE",
      safeToSave: true,
      reasons: []
    };
  }

  const hardBlock =
    input.apiTrustStatus === "RATE_LIMITED" ||
    input.apiTrustStatus === "DOWN" ||
    input.hasRateLimitSignal ||
    input.hasCloudflareOutageSignal ||
    input.allBalancesZero ||
    input.decoderConfidence === "unresolved";

  return {
    mode: hardBlock ? "BLOCKED" : "READ_ONLY",
    safeToSave: false,
    reasons
  };
}
