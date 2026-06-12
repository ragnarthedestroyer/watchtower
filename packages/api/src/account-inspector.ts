import type { NormalizedRawAccount } from "./account-normalizer";
import type { RawAccountReadMode, RawAccountReadResult } from "./account-reader";
import {
  decodeBalanceCandidatesFromRawAccount,
  type BalanceDecoderCandidate
} from "./balance-decoder";

export type AccountRawShapeSummary = {
  topLevelType: string;
  topLevelKeys: string[];
  dataKeys: string[];
  accountContainer: "data.accounts" | "data.accounts.edges" | "data.account" | "none";
  accountRecordKeys: string[];
};

export type AccountDecoderHint = {
  level: "info" | "warning" | "blocked";
  message: string;
};

export type AccountInspectionResult = {
  ok: boolean;
  inspectedAt: string;
  mode: RawAccountReadMode;
  input: {
    legacyAddress?: string;
    accountId?: string;
    dappId?: string;
  };
  accountPresent: boolean;
  normalizedAccount: NormalizedRawAccount | null;
  rawShape: AccountRawShapeSummary;
  decoderHints: AccountDecoderHint[];
  balanceCandidates: BalanceDecoderCandidate[];
  errors: string[];
  warnings: string[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function typeLabel(value: unknown): string {
  if (Array.isArray(value)) return "array";
  if (value === null) return "null";
  return typeof value;
}

function sortedKeys(value: unknown): string[] {
  if (!isRecord(value)) return [];
  return Object.keys(value).sort();
}

function firstAccountRecord(raw: unknown): {
  container: AccountRawShapeSummary["accountContainer"];
  record: unknown;
} {
  if (!isRecord(raw) || !isRecord(raw.data)) {
    return {
      container: "none",
      record: null
    };
  }

  if (Array.isArray(raw.data.accounts)) {
    return {
      container: "data.accounts",
      record: raw.data.accounts[0] ?? null
    };
  }

  if (isRecord(raw.data.accounts) && Array.isArray(raw.data.accounts.edges)) {
    const firstEdge = raw.data.accounts.edges[0];

    return {
      container: "data.accounts.edges",
      record: isRecord(firstEdge) ? firstEdge.node : null
    };
  }

  if (isRecord(raw.data.account)) {
    return {
      container: "data.account",
      record: raw.data.account
    };
  }

  return {
    container: "none",
    record: null
  };
}

export function summarizeRawAccountShape(raw: unknown): AccountRawShapeSummary {
  const account = firstAccountRecord(raw);

  return {
    topLevelType: typeLabel(raw),
    topLevelKeys: sortedKeys(raw),
    dataKeys: isRecord(raw) ? sortedKeys(raw.data) : [],
    accountContainer: account.container,
    accountRecordKeys: sortedKeys(account.record)
  };
}

export function buildAccountDecoderHints(
  account: NormalizedRawAccount | null
): AccountDecoderHint[] {
  const hints: AccountDecoderHint[] = [];

  if (account === null || !account.present) {
    hints.push({
      level: "blocked",
      message:
        "No account record is available. Decoder research cannot continue for this read."
    });

    return hints;
  }

  if (!account.boc) {
    hints.push({
      level: "blocked",
      message:
        "Account BOC is missing. Contract-state decoding cannot run until the API returns boc."
    });
  } else {
    hints.push({
      level: "info",
      message:
        "Account BOC is present. This account can be used for future ABI/BOC decoder experiments."
    });
  }

  if (account.balance !== undefined && account.balance !== null) {
    hints.push({
      level: "warning",
      message:
        "Raw account balance is present, but it must not be treated as confirmed wallet NACKL until token semantics are verified."
    });
  }

  if (account.codeHash) {
    hints.push({
      level: "info",
      message:
        "Code hash is present. It can help classify account/contract type later."
    });
  }

  if (account.dataHash) {
    hints.push({
      level: "info",
      message:
        "Data hash is present. It can help detect state changes between snapshots later."
    });
  }

  return hints;
}

export function inspectRawAccountReadResult(
  result: RawAccountReadResult
): AccountInspectionResult {
  const input: AccountInspectionResult["input"] = {};

  if (result.legacyAddress !== undefined) {
    input.legacyAddress = result.legacyAddress;
  }

  if (result.accountId !== undefined) {
    input.accountId = result.accountId;
  }

  if (result.dappId !== undefined) {
    input.dappId = result.dappId;
  }

  const normalizedAccount = result.account ?? null;
  const decoderHints = buildAccountDecoderHints(normalizedAccount);
  const balanceDecode = decodeBalanceCandidatesFromRawAccount(result);
  const warnings = [
    ...(result.normalizerWarnings ?? []),
    ...decoderHints
      .filter((hint) => hint.level === "warning" || hint.level === "blocked")
      .map((hint) => hint.message),
    ...balanceDecode.warnings
  ];

  return {
    ok: result.ok,
    inspectedAt: new Date().toISOString(),
    mode: result.mode,
    input,
    accountPresent: normalizedAccount !== null && normalizedAccount.present,
    normalizedAccount,
    rawShape: summarizeRawAccountShape(result.raw),
    decoderHints,
    balanceCandidates: balanceDecode.candidates,
    errors: result.errors,
    warnings
  };
}
