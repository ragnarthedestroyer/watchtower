import {
  evaluateApiTrust,
  evaluateSnapshotPolicy,
  type ApiHealthSignal
} from "@watchtower/core";
import type { HealthResponse } from "./types";

export type DemoRuntime = "web" | "telegram";

export function buildDemoHealthResponse(runtime: DemoRuntime): HealthResponse {
  const apiSignal: ApiHealthSignal = {
    checkedAt: new Date().toISOString(),
    reachable: true,
    httpStatus: 200,
    responseMs: runtime === "telegram" ? 530 : 412,
    stale: false
  };

  const apiTrust = evaluateApiTrust(apiSignal);

  const snapshotPolicy = evaluateSnapshotPolicy({
    apiTrustStatus: apiTrust.status,
    epochStatus: "UNKNOWN",
    mvRootStatusAgeMinutes: null,
    successfulWallets: 0,
    configuredWallets: 0,
    allBalancesZero: false,
    decoderConfidence: "unresolved",
    hasRateLimitSignal: apiTrust.hasRateLimitSignal,
    hasCloudflareOutageSignal: apiTrust.hasCloudflareOutageSignal
  });

  return {
    checkedAt: new Date().toISOString(),
    apiTrust,
    epoch: null,
    snapshotPolicy
  };
}
