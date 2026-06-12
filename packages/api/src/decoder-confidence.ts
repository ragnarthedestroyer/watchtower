import type { WatchtowerWalletSnapshot } from "@watchtower/core";
import type { BalanceDecoderCandidate } from "./balance-decoder";

export type DecoderConfidence = "confirmed" | "partial" | "unresolved";

export type BalanceEvidenceSummary = {
  candidateCount: number;
  candidateKinds: string[];
  confirmedCandidateCount: number;
  partialCandidateCount: number;
  unresolvedCandidateCount: number;
  hasPopitRewardsCandidate: boolean;
  hasPrivateNoteCandidate: boolean;
  recommendedSnapshotConfidence: DecoderConfidence;
  warnings: string[];
};

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort();
}

export function summarizeBalanceCandidates(
  candidates: BalanceDecoderCandidate[]
): BalanceEvidenceSummary {
  const confirmedCandidateCount = candidates.filter(
    (candidate) => candidate.confidence === "confirmed"
  ).length;

  const partialCandidateCount = candidates.filter(
    (candidate) => candidate.confidence === "partial"
  ).length;

  const unresolvedCandidateCount = candidates.filter(
    (candidate) => candidate.confidence === "unresolved"
  ).length;

  const hasPopitRewardsCandidate = candidates.some(
    (candidate) => candidate.kind === "popit_rewards_candidate"
  );

  const hasPrivateNoteCandidate = candidates.some(
    (candidate) => candidate.kind === "private_note_balance_candidate"
  );

  let recommendedSnapshotConfidence: DecoderConfidence = "unresolved";

  if (confirmedCandidateCount > 0 && partialCandidateCount === 0 && unresolvedCandidateCount === 0) {
    recommendedSnapshotConfidence = "confirmed";
  } else if (partialCandidateCount > 0 || confirmedCandidateCount > 0) {
    recommendedSnapshotConfidence = "partial";
  }

  const warnings: string[] = [];

  if (candidates.length === 0) {
    warnings.push("No balance candidates were found.");
  }

  if (hasPopitRewardsCandidate) {
    warnings.push(
      "PopitGame rewards candidates were found, but they are not confirmed locked/mining NACKL until ABI/BOC decoding validates the source."
    );
  }

  if (hasPrivateNoteCandidate) {
    warnings.push(
      "PrivateNote-style balance candidates were found, but token identity and decimals are not confirmed."
    );
  }

  if (unresolvedCandidateCount > 0) {
    warnings.push(
      "One or more unresolved balance candidates remain; snapshot saving must stay disabled."
    );
  }

  if (recommendedSnapshotConfidence !== "confirmed") {
    warnings.push(
      `Decoder confidence is ${recommendedSnapshotConfidence}; balances must be shown as research candidates only.`
    );
  }

  return {
    candidateCount: candidates.length,
    candidateKinds: uniqueSorted(candidates.map((candidate) => candidate.kind)),
    confirmedCandidateCount,
    partialCandidateCount,
    unresolvedCandidateCount,
    hasPopitRewardsCandidate,
    hasPrivateNoteCandidate,
    recommendedSnapshotConfidence,
    warnings
  };
}

export function summarizeWalletBalanceEvidence(
  wallets: WatchtowerWalletSnapshot[]
): BalanceEvidenceSummary {
  const candidates: BalanceDecoderCandidate[] = [];

  for (const wallet of wallets) {
    for (const balance of wallet.balances) {
      candidates.push({
        kind:
          balance.source.includes("_rewards") || balance.source.includes(".rewards")
            ? "popit_rewards_candidate"
            : balance.source.includes("_balance") || balance.source.includes(".balance")
              ? "private_note_balance_candidate"
              : balance.source === "raw-account.balance"
                ? "raw_account_balance"
                : "generic_balance_candidate",
        path: balance.source.replace(/^candidate:/, ""),
        amountRaw: balance.amountRaw,
        token: balance.token,
        decimals: balance.decimals,
        confidence: balance.confidence,
        source: balance.source,
        warnings: []
      });
    }
  }

  return summarizeBalanceCandidates(candidates);
}
