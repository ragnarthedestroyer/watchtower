import type { WatchtowerEndpointConfig } from "@watchtower/core";
import { endpointConfigIsUsableForLiveReads } from "@watchtower/core";
import { readLiveRawAccount } from "./live-account";
import {
  buildMobileVerifierRootReadResult,
  buildUnknownMobileVerifierEpoch,
  resolveMobileVerifierRootAddress,
  validateMobileVerifierRootAddress,
  type MobileVerifierRootReadRequest,
  type MobileVerifierRootReadResult
} from "./mobile-verifier";

export type LiveMobileVerifierRootReadInput = {
  endpointConfig: WatchtowerEndpointConfig;
  request?: MobileVerifierRootReadRequest;
  requestTimeoutMs?: number;
};

export async function readLiveMobileVerifierRoot(
  input: LiveMobileVerifierRootReadInput
): Promise<MobileVerifierRootReadResult> {
  const requestedAt = new Date().toISOString();
  const rootAddress = resolveMobileVerifierRootAddress(input.request);
  const validationErrors = validateMobileVerifierRootAddress(rootAddress);

  if (validationErrors.length > 0) {
    return {
      ok: false,
      requestedAt,
      rootAddress,
      rawAccount: null,
      epoch: buildUnknownMobileVerifierEpoch({
        checkedAt: requestedAt,
        rootAddress,
        statusReason: "Mobile Verifier root address is invalid."
      }),
      decoderStatus: "unresolved",
      errors: validationErrors,
      warnings: []
    };
  }

  if (!endpointConfigIsUsableForLiveReads(input.endpointConfig)) {
    return {
      ok: false,
      requestedAt,
      rootAddress,
      rawAccount: null,
      epoch: buildUnknownMobileVerifierEpoch({
        checkedAt: requestedAt,
        rootAddress,
        statusReason:
          "Live reads are not enabled or endpoint configuration is invalid."
      }),
      decoderStatus: "unresolved",
      errors: [
        "Live Mobile Verifier root reads require live-read mode and a valid endpoint configuration.",
        ...input.endpointConfig.errors
      ],
      warnings: input.endpointConfig.warnings
    };
  }

  const readInput: Parameters<typeof readLiveRawAccount>[0] = {
    endpointConfig: input.endpointConfig,
    request: {
      mode: "legacy",
      legacyAddress: rootAddress
    }
  };

  if (input.requestTimeoutMs !== undefined) {
    readInput.requestTimeoutMs = input.requestTimeoutMs;
  }

  const rawAccount = await readLiveRawAccount(readInput);

  return buildMobileVerifierRootReadResult({
    requestedAt,
    rootAddress,
    rawAccount
  });
}
