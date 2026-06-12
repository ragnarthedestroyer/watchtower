import {
  classifyMobileVerifierEpoch,
  type MobileVerifierEpoch,
  type MobileVerifierEpochStatus
} from "@watchtower/core";
import type { RawAccountReadResult } from "./account-reader";

export type MobileVerifierDecoderStatus = "unresolved" | "partial" | "confirmed";

export type MobileVerifierDecodedFields = {
  epochStartSeconds?: number;
  epochEndSeconds?: number;
  previousEpochDurationSeconds?: number;
  rewardLastTimeSeconds?: number;
  rewardPeriodSeconds?: number;
};

export type MobileVerifierDecodeResult = {
  status: MobileVerifierDecoderStatus;
  epoch: MobileVerifierEpoch;
  decodedFields: MobileVerifierDecodedFields;
  matchedFieldPaths: string[];
  warnings: string[];
};

type CandidateField = {
  target: keyof MobileVerifierDecodedFields;
  aliases: string[];
};

const CANDIDATE_FIELDS: CandidateField[] = [
  {
    target: "epochStartSeconds",
    aliases: ["epochstart", "_epochstart", "epoch_start"]
  },
  {
    target: "epochEndSeconds",
    aliases: ["epochend", "_epochend", "epoch_end"]
  },
  {
    target: "previousEpochDurationSeconds",
    aliases: [
      "previousepochduration",
      "prevepochduration",
      "_prevepochduration",
      "previous_epoch_duration"
    ]
  },
  {
    target: "rewardLastTimeSeconds",
    aliases: ["rewardlasttime", "_rewardlasttime", "reward_last_time"]
  },
  {
    target: "rewardPeriodSeconds",
    aliases: ["rewardperiod", "_rewardperiod", "reward_period"]
  }
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function parseNumberishSeconds(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return normalizeTimestampNumber(value);
  }

  if (typeof value === "bigint") {
    return normalizeTimestampNumber(Number(value));
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    return undefined;
  }

  return normalizeTimestampNumber(parsed);
}

function normalizeTimestampNumber(value: number): number | undefined {
  if (!Number.isFinite(value) || value < 0) {
    return undefined;
  }

  // Millisecond timestamps are too large for Acki Nacki epoch seconds.
  if (value > 1_000_000_000_000) {
    return Math.floor(value / 1000);
  }

  return Math.floor(value);
}

function secondsToIso(seconds: number): string {
  return new Date(seconds * 1000).toISOString();
}

function setDecodedField(
  decodedFields: MobileVerifierDecodedFields,
  target: keyof MobileVerifierDecodedFields,
  value: number | undefined
): boolean {
  if (value === undefined || decodedFields[target] !== undefined) {
    return false;
  }

  decodedFields[target] = value;
  return true;
}

function visitForCandidateFields(input: {
  value: unknown;
  path: string;
  decodedFields: MobileVerifierDecodedFields;
  matchedFieldPaths: string[];
  maxDepth: number;
}): void {
  if (input.maxDepth < 0) {
    return;
  }

  if (Array.isArray(input.value)) {
    input.value.forEach((item, index) => {
      visitForCandidateFields({
        value: item,
        path: `${input.path}[${index}]`,
        decodedFields: input.decodedFields,
        matchedFieldPaths: input.matchedFieldPaths,
        maxDepth: input.maxDepth - 1
      });
    });
    return;
  }

  if (!isRecord(input.value)) {
    return;
  }

  for (const [key, childValue] of Object.entries(input.value)) {
    const normalizedKey = normalizeKey(key);

    for (const candidate of CANDIDATE_FIELDS) {
      const matched = candidate.aliases.some(
        (alias) => normalizeKey(alias) === normalizedKey
      );

      if (!matched) continue;

      const parsed = parseNumberishSeconds(childValue);
      const wasSet = setDecodedField(
        input.decodedFields,
        candidate.target,
        parsed
      );

      if (wasSet) {
        input.matchedFieldPaths.push(`${input.path}.${key}`);
      }
    }

    visitForCandidateFields({
      value: childValue,
      path: `${input.path}.${key}`,
      decodedFields: input.decodedFields,
      matchedFieldPaths: input.matchedFieldPaths,
      maxDepth: input.maxDepth - 1
    });
  }
}

export function decodeMobileVerifierEpochFromRawAccount(input: {
  rawAccount: RawAccountReadResult;
  checkedAt: string;
  rootAddress: string;
  nowSeconds?: number;
}): MobileVerifierDecodeResult {
  const decodedFields: MobileVerifierDecodedFields = {};
  const matchedFieldPaths: string[] = [];
  const warnings: string[] = [];

  visitForCandidateFields({
    value: input.rawAccount.raw,
    path: "raw",
    decodedFields,
    matchedFieldPaths,
    maxDepth: 8
  });

  if (input.rawAccount.account !== undefined) {
    visitForCandidateFields({
      value: input.rawAccount.account,
      path: "account",
      decodedFields,
      matchedFieldPaths,
      maxDepth: 4
    });
  }

  if (matchedFieldPaths.length === 0) {
    warnings.push(
      "No decoded Mobile Verifier epoch fields were found in the raw account response. ABI/BOC decoding is still required."
    );
  }

  const nowSeconds = input.nowSeconds ?? Math.floor(Date.now() / 1000);
  const classificationInput: Parameters<typeof classifyMobileVerifierEpoch>[0] = {
    nowSeconds
  };

  if (decodedFields.epochStartSeconds !== undefined) {
    classificationInput.epochStartSeconds = decodedFields.epochStartSeconds;
  }

  if (decodedFields.epochEndSeconds !== undefined) {
    classificationInput.epochEndSeconds = decodedFields.epochEndSeconds;
  }

  const classification = classifyMobileVerifierEpoch(classificationInput);

  const hasEpochWindow =
    decodedFields.epochStartSeconds !== undefined &&
    decodedFields.epochEndSeconds !== undefined;

  const status: MobileVerifierDecoderStatus = hasEpochWindow
    ? "confirmed"
    : matchedFieldPaths.length > 0
      ? "partial"
      : "unresolved";

  const epoch: MobileVerifierEpoch = {
    source: "mobile_verifiers_root",
    rootAddress: input.rootAddress,
    checkedAt: input.checkedAt,
    status: classification.status as MobileVerifierEpochStatus,
    statusReason: classification.statusReason
  };

  if (decodedFields.epochStartSeconds !== undefined) {
    epoch.epochStartIso = secondsToIso(decodedFields.epochStartSeconds);
    epoch.secondsSinceEpochStart = nowSeconds - decodedFields.epochStartSeconds;
  }

  if (decodedFields.epochEndSeconds !== undefined) {
    epoch.epochEndIso = secondsToIso(decodedFields.epochEndSeconds);
    epoch.secondsUntilEpochEnd = decodedFields.epochEndSeconds - nowSeconds;
  }

  if (decodedFields.previousEpochDurationSeconds !== undefined) {
    epoch.previousEpochDurationSeconds = decodedFields.previousEpochDurationSeconds;
  }

  if (decodedFields.rewardLastTimeSeconds !== undefined) {
    epoch.rewardLastTimeIso = secondsToIso(decodedFields.rewardLastTimeSeconds);
  }

  if (decodedFields.rewardPeriodSeconds !== undefined) {
    epoch.rewardPeriodSeconds = decodedFields.rewardPeriodSeconds;
  }

  if (
    decodedFields.rewardLastTimeSeconds !== undefined &&
    decodedFields.rewardPeriodSeconds !== undefined
  ) {
    const nextRewardTimeSeconds =
      decodedFields.rewardLastTimeSeconds + decodedFields.rewardPeriodSeconds;
    epoch.nextRewardTimeIso = secondsToIso(nextRewardTimeSeconds);
    epoch.secondsUntilNextReward = nextRewardTimeSeconds - nowSeconds;
  }

  if (status !== "confirmed") {
    warnings.push(
      "Mobile Verifier epoch decoder is not confirmed. Snapshots must remain blocked or read-only."
    );
  }

  return {
    status,
    epoch,
    decodedFields,
    matchedFieldPaths,
    warnings
  };
}
