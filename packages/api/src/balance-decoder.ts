import type { WatchtowerBalance } from "@watchtower/core";
import type { NormalizedRawAccount } from "./account-normalizer";
import type { RawAccountReadResult } from "./account-reader";

export type BalanceCandidateKind =
  | "raw_account_balance"
  | "popit_rewards_candidate"
  | "private_note_balance_candidate"
  | "generic_balance_candidate";

export type BalanceDecoderCandidate = {
  kind: BalanceCandidateKind;
  path: string;
  amountRaw: string;
  token: WatchtowerBalance["token"];
  decimals: number;
  confidence: WatchtowerBalance["confidence"];
  source: string;
  warnings: string[];
};

export type BalanceDecoderResult = {
  candidates: BalanceDecoderCandidate[];
  balances: WatchtowerBalance[];
  warnings: string[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function primitiveAmountToString(value: unknown): string | null {
  if (typeof value === "string" && /^\d+$/.test(value.trim())) {
    return value.trim();
  }

  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return String(Math.trunc(value));
  }

  if (typeof value === "bigint" && value >= 0n) {
    return value.toString();
  }

  return null;
}

function candidateKindForPath(path: string): BalanceCandidateKind {
  const lower = path.toLowerCase();

  if (lower.endsWith(".balance") || lower === "balance") {
    return "raw_account_balance";
  }

  if (lower.includes("_rewards") || lower.includes(".rewards")) {
    return "popit_rewards_candidate";
  }

  if (lower.includes("_balance") || lower.includes(".balance")) {
    return "private_note_balance_candidate";
  }

  return "generic_balance_candidate";
}

function candidateForPath(path: string, value: unknown): BalanceDecoderCandidate | null {
  const amountRaw = primitiveAmountToString(value);

  if (amountRaw === null) {
    return null;
  }

  const kind = candidateKindForPath(path);

  if (kind === "raw_account_balance") {
    return {
      kind,
      path,
      amountRaw,
      token: "UNKNOWN",
      decimals: 0,
      confidence: "unresolved",
      source: "raw-account.balance",
      warnings: [
        "Raw account balance is present, but token meaning is not decoded."
      ]
    };
  }

  if (kind === "popit_rewards_candidate") {
    return {
      kind,
      path,
      amountRaw,
      token: "NACKL",
      decimals: 9,
      confidence: "partial",
      source: `candidate:${path}`,
      warnings: [
        "Possible PopitGame rewards/locked-mining NACKL candidate. Treat as partial until ABI/BOC decoding confirms it."
      ]
    };
  }

  if (kind === "private_note_balance_candidate") {
    return {
      kind,
      path,
      amountRaw,
      token: "UNKNOWN",
      decimals: 0,
      confidence: "partial",
      source: `candidate:${path}`,
      warnings: [
        "Possible PrivateNote balance candidate. Token and decimals are not confirmed yet."
      ]
    };
  }

  return {
    kind,
    path,
    amountRaw,
    token: "UNKNOWN",
    decimals: 0,
    confidence: "unresolved",
    source: `candidate:${path}`,
    warnings: [
      "Generic balance-like numeric field found. Treat as unresolved."
    ]
  };
}

function shouldInspectKey(key: string): boolean {
  const lower = key.toLowerCase();

  return (
    lower === "balance" ||
    lower === "_balance" ||
    lower === "rewards" ||
    lower === "_rewards" ||
    lower.includes("balance") ||
    lower.includes("reward")
  );
}

function collectCandidatesFromValue(input: {
  value: unknown;
  path: string;
  depth: number;
  maxDepth: number;
  candidates: BalanceDecoderCandidate[];
}): void {
  const { value, path, depth, maxDepth, candidates } = input;

  if (depth > maxDepth) {
    return;
  }

  const directCandidate = candidateForPath(path, value);
  if (directCandidate) {
    candidates.push(directCandidate);
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      collectCandidatesFromValue({
        value: item,
        path: `${path}[${index}]`,
        depth: depth + 1,
        maxDepth,
        candidates
      });
    });

    return;
  }

  if (!isRecord(value)) {
    return;
  }

  for (const [key, child] of Object.entries(value)) {
    const childPath = path ? `${path}.${key}` : key;

    if (shouldInspectKey(key)) {
      const candidate = candidateForPath(childPath, child);
      if (candidate) {
        candidates.push(candidate);
      }
    }

    collectCandidatesFromValue({
      value: child,
      path: childPath,
      depth: depth + 1,
      maxDepth,
      candidates
    });
  }
}

function uniqueCandidates(
  candidates: BalanceDecoderCandidate[]
): BalanceDecoderCandidate[] {
  const seen = new Set<string>();
  const unique: BalanceDecoderCandidate[] = [];

  for (const candidate of candidates) {
    const key = `${candidate.kind}:${candidate.path}:${candidate.amountRaw}`;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    unique.push(candidate);
  }

  return unique;
}

function candidateToBalance(candidate: BalanceDecoderCandidate): WatchtowerBalance {
  let amountFormatted = candidate.amountRaw;

  if (candidate.confidence !== "confirmed") {
    amountFormatted = `${candidate.amountRaw} raw units (${candidate.confidence})`;
  }

  return {
    token: candidate.token,
    amountRaw: candidate.amountRaw,
    decimals: candidate.decimals,
    amountFormatted,
    confidence: candidate.confidence,
    source: candidate.source
  };
}

function candidatesFromNormalizedAccount(
  account: NormalizedRawAccount | null | undefined
): BalanceDecoderCandidate[] {
  if (!account || account.balance === undefined || account.balance === null) {
    return [];
  }

  const candidate = candidateForPath("account.balance", account.balance);
  return candidate ? [candidate] : [];
}

export function decodeBalanceCandidatesFromRawAccount(
  result: RawAccountReadResult
): BalanceDecoderResult {
  const candidates: BalanceDecoderCandidate[] = [
    ...candidatesFromNormalizedAccount(result.account)
  ];

  collectCandidatesFromValue({
    value: result.raw,
    path: "raw",
    depth: 0,
    maxDepth: 8,
    candidates
  });

  const unique = uniqueCandidates(candidates);
  const warnings = unique.flatMap((candidate) => candidate.warnings);

  if (unique.length === 0 && result.ok) {
    warnings.push(
      "No balance candidates were found in the normalized account or raw response."
    );
  }

  return {
    candidates: unique,
    balances: unique.map(candidateToBalance),
    warnings
  };
}
