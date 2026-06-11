import type { HealthResponse } from "./types";
import type {
  ApiHealthSignal,
  MobileVerifierEpoch,
  SnapshotPolicyDecision
} from "@watchtower/core";
import { evaluateApiTrust } from "@watchtower/core";

export type BuildHealthResponseInput = {
  apiSignal: ApiHealthSignal;
  epoch: MobileVerifierEpoch | null;
  snapshotPolicy: SnapshotPolicyDecision | null;
};

export function buildHealthResponse(
  input: BuildHealthResponseInput
): HealthResponse {
  return {
    checkedAt: new Date().toISOString(),
    apiTrust: evaluateApiTrust(input.apiSignal),
    epoch: input.epoch,
    snapshotPolicy: input.snapshotPolicy
  };
}
