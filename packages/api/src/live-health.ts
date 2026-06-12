import {
  evaluateApiTrust,
  evaluateSnapshotPolicy,
  type WatchtowerEndpointConfig
} from "@watchtower/core";
import type { HealthResponse } from "./types";
import { checkAckiNetworkHealth, type AckiNetworkClientConfig } from "./acki-network";

export type BuildLiveHealthResponseInput = {
  endpointConfig: WatchtowerEndpointConfig;
};

export async function buildLiveHealthResponse(
  input: BuildLiveHealthResponseInput
): Promise<HealthResponse> {
  const networkConfig: AckiNetworkClientConfig = {
    requestTimeoutMs: 10_000
  };

  if (input.endpointConfig.graphqlEndpoint) {
    networkConfig.graphqlEndpoint = input.endpointConfig.graphqlEndpoint;
  }

  if (input.endpointConfig.restEndpoint) {
    networkConfig.restEndpoint = input.endpointConfig.restEndpoint;
  }

  const apiSignal = await checkAckiNetworkHealth(networkConfig);

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
