import {
  evaluateApiTrust,
  evaluateSnapshotPolicy,
  type WatchtowerEndpointConfig
} from "@watchtower/core";
import type { HealthResponse } from "./types";
import { checkAckiNetworkHealth } from "./acki-network";

export type BuildLiveHealthResponseInput = {
  endpointConfig: WatchtowerEndpointConfig;
};

export async function buildLiveHealthResponse(
  input: BuildLiveHealthResponseInput
): Promise<HealthResponse> {
  const apiSignal = await checkAckiNetworkHealth({
    graphqlEndpoint: input.endpointConfig.graphqlEndpoint ?? undefined,
    restEndpoint: input.endpointConfig.restEndpoint ?? undefined,
    requestTimeoutMs: 10_000
  });

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
