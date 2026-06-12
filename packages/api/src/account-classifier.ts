import type { NormalizedRawAccount } from "./account-normalizer";
import type { BalanceDecoderCandidate } from "./balance-decoder";

export type WatchtowerAccountClassificationKind =
  | "popit_game_candidate"
  | "private_note_candidate"
  | "token_or_wallet_candidate"
  | "raw_account_only"
  | "missing_account"
  | "unknown_account";

export type WatchtowerAccountClassificationConfidence =
  | "confirmed"
  | "partial"
  | "unresolved";

export type WatchtowerAccountClassification = {
  kind: WatchtowerAccountClassificationKind;
  confidence: WatchtowerAccountClassificationConfidence;
  label: string;
  evidence: string[];
  warnings: string[];
};

function hasCandidateKind(
  candidates: BalanceDecoderCandidate[],
  kind: BalanceDecoderCandidate["kind"]
): boolean {
  return candidates.some((candidate) => candidate.kind === kind);
}

function accountHasUsefulState(account: NormalizedRawAccount | null): boolean {
  if (!account || !account.present) return false;

  return Boolean(
    account.boc ||
      account.balance ||
      account.codeHash ||
      account.dataHash ||
      account.extractedFields.length > 0
  );
}

export function classifyWatchtowerAccount(input: {
  account: NormalizedRawAccount | null;
  balanceCandidates: BalanceDecoderCandidate[];
}): WatchtowerAccountClassification {
  const { account, balanceCandidates } = input;
  const evidence: string[] = [];
  const warnings: string[] = [];

  if (!account || !account.present) {
    return {
      kind: "missing_account",
      confidence: "unresolved",
      label: "Missing account",
      evidence: ["No normalized account record is present."],
      warnings: [
        "Account classification is blocked because no account record was returned."
      ]
    };
  }

  if (account.codeHash) {
    evidence.push(`code_hash is present: ${account.codeHash}`);
  } else {
    warnings.push("code_hash is missing; exact contract classification is unavailable.");
  }

  if (account.dataHash) {
    evidence.push(`data_hash is present: ${account.dataHash}`);
  }

  if (account.boc) {
    evidence.push("Account BOC is present for future ABI/BOC decoding.");
  } else {
    warnings.push("Account BOC is missing; classification remains heuristic only.");
  }

  if (hasCandidateKind(balanceCandidates, "popit_rewards_candidate")) {
    evidence.push("A rewards-like balance candidate was found.");

    return {
      kind: "popit_game_candidate",
      confidence: "partial",
      label: "Possible PopitGame / locked-mining rewards account",
      evidence,
      warnings: [
        ...warnings,
        "This is not confirmed locked NACKL until ABI/BOC decoding validates the contract state."
      ]
    };
  }

  if (hasCandidateKind(balanceCandidates, "private_note_balance_candidate")) {
    evidence.push("A PrivateNote-style _balance candidate was found.");

    return {
      kind: "private_note_candidate",
      confidence: "partial",
      label: "Possible PrivateNote / note balance account",
      evidence,
      warnings: [
        ...warnings,
        "This is not confirmed unlocked NACKL until token identity and decimals are validated."
      ]
    };
  }

  if (hasCandidateKind(balanceCandidates, "raw_account_balance")) {
    evidence.push("A raw account.balance field was found.");

    return {
      kind: "token_or_wallet_candidate",
      confidence: "unresolved",
      label: "Raw balance-bearing account",
      evidence,
      warnings: [
        ...warnings,
        "Raw account.balance is not enough to classify this as NACKL, SHELL, USDC, or unlocked wallet balance."
      ]
    };
  }

  if (accountHasUsefulState(account)) {
    evidence.push(
      `Normalized fields: ${account.extractedFields.length > 0 ? account.extractedFields.join(", ") : "none"}.`
    );

    return {
      kind: "raw_account_only",
      confidence: "unresolved",
      label: "Raw account state only",
      evidence,
      warnings: [
        ...warnings,
        "No balance-like contract fields were detected in the currently available response."
      ]
    };
  }

  return {
    kind: "unknown_account",
    confidence: "unresolved",
    label: "Unknown account",
    evidence,
    warnings: [
      ...warnings,
      "The account response does not contain enough recognized fields for classification."
    ]
  };
}
