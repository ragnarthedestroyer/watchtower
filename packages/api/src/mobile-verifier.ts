import type { MobileVerifierEpoch } from "@watchtower/core";
import { validateLegacyAddress } from "@watchtower/core";
import type { RawAccountReadResult } from "./account-reader";

export const DEFAULT_MOBILE_VERIFIER_ROOT_ADDRESS =
  "0:2222222222222222222222222222222222222222222222222222222222222222";

export type MobileVerifierRootReadRequest = {
  rootAddress?: string;
};

export type MobileVerifierRootReadResult = {
  ok: boolean;
  requestedAt: string;
  rootAddress: string;
  rawAccount: RawAccountReadResult | null;
  epoch: MobileVerifierEpoch;
  decoderStatus: "unresolved" | "partial" | "confirmed";
  errors: string[];
  warnings: string[];
};

export function resolveMobileVerifierRootAddress(
  request: MobileVerifierRootReadRequest = {}
): string {
  return request.rootAddress?.trim() || DEFAULT_MOBILE_VERIFIER_ROOT_ADDRESS;
}

export function validateMobileVerifierRootAddress(rootAddress: string): string[] {
  const validation = validateLegacyAddress(rootAddress);
  return validation.ok ? [] : validation.errors;
}

export function buildUnknownMobileVerifierEpoch(input: {
  checkedAt: string;
  rootAddress: string;
  statusReason: string;
}): MobileVerifierEpoch {
  return {
    source: "mobile_verifiers_root",
    rootAddress: input.rootAddress,
    checkedAt: input.checkedAt,
    status: "UNKNOWN",
    statusReason: input.statusReason
  };
}

export function buildMobileVerifierRootReadResult(input: {
  requestedAt: string;
  rootAddress: string;
  rawAccount: RawAccountReadResult | null;
  errors?: string[];
  warnings?: string[];
}): MobileVerifierRootReadResult {
  const errors = input.errors ?? [];
  const warnings = input.warnings ?? [];

  if (!input.rawAccount?.ok) {
    return {
      ok: false,
      requestedAt: input.requestedAt,
      rootAddress: input.rootAddress,
      rawAccount: input.rawAccount,
      epoch: buildUnknownMobileVerifierEpoch({
        checkedAt: input.requestedAt,
        rootAddress: input.rootAddress,
        statusReason:
          "Mobile Verifier root account could not be read, so epoch fields were not decoded."
      }),
      decoderStatus: "unresolved",
      errors: [
        ...errors,
        ...(input.rawAccount?.errors ?? ["Mobile Verifier root account read failed."])
      ],
      warnings
    };
  }

  return {
    ok: true,
    requestedAt: input.requestedAt,
    rootAddress: input.rootAddress,
    rawAccount: input.rawAccount,
    epoch: buildUnknownMobileVerifierEpoch({
      checkedAt: input.requestedAt,
      rootAddress: input.rootAddress,
      statusReason:
        "Mobile Verifier root account was read, but ABI/BOC epoch decoding is not implemented yet."
    }),
    decoderStatus: "unresolved",
    errors,
    warnings: [
      ...warnings,
      "Raw root account read succeeded, but epoch decoder is still unresolved. Snapshots must remain blocked."
    ]
  };
}
