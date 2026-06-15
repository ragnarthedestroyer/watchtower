import type { AccountInspectionResult } from "./account-inspector";
import type { BalanceDecoderCandidate } from "./balance-decoder";

export type DecoderResearchReportStatus =
  | "blocked"
  | "research_needed"
  | "candidate_evidence_found"
  | "ready_for_manual_review";

export type DecoderResearchCandidateGroup = {
  kind: BalanceDecoderCandidate["kind"];
  count: number;
  paths: string[];
  sampleAmountsRaw: string[];
  confidenceLevels: string[];
  warnings: string[];
};

export type DecoderResearchReport = {
  reportId: string;
  generatedAt: string;
  status: DecoderResearchReportStatus;
  account: {
    mode: AccountInspectionResult["mode"];
    accountPresent: boolean;
    legacyAddress?: string;
    accountId?: string;
    dappId?: string;
    normalizedId?: string;
    codeHash?: string;
    dataHash?: string;
    bocPresent: boolean;
  };
  classification: AccountInspectionResult["accountClassification"];
  balanceEvidence: AccountInspectionResult["balanceEvidence"];
  candidateGroups: DecoderResearchCandidateGroup[];
  suggestedNextSteps: string[];
  blockers: string[];
  warnings: string[];
};

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort();
}

function uniqueFirst(values: string[], limit: number): string[] {
  const unique = [...new Set(values)];
  return unique.slice(0, limit);
}

function candidateWarnings(candidates: BalanceDecoderCandidate[]): string[] {
  return uniqueSorted(candidates.flatMap((candidate) => candidate.warnings));
}

function groupBalanceCandidates(
  candidates: BalanceDecoderCandidate[]
): DecoderResearchCandidateGroup[] {
  const kinds: BalanceDecoderCandidate["kind"][] = [
    ...new Set(candidates.map((candidate) => candidate.kind))
  ].sort();

  return kinds.map((kind) => {
    const group = candidates.filter((candidate) => candidate.kind === kind);

    return {
      kind,
      count: group.length,
      paths: uniqueSorted(group.map((candidate) => candidate.path)),
      sampleAmountsRaw: uniqueFirst(
        group.map((candidate) => candidate.amountRaw),
        5
      ),
      confidenceLevels: uniqueSorted(
        group.map((candidate) => candidate.confidence)
      ),
      warnings: candidateWarnings(group)
    };
  });
}

function buildBlockers(inspection: AccountInspectionResult): string[] {
  const blockers: string[] = [];

  if (!inspection.ok) {
    blockers.push("The account inspection request failed.");
  }

  if (!inspection.accountPresent) {
    blockers.push("No account record was returned for the requested identity.");
  }

  if (!inspection.normalizedAccount?.boc) {
    blockers.push(
      "Account BOC is missing, so ABI/BOC contract-state decoding cannot be validated yet."
    );
  }

  if (inspection.balanceEvidence.candidateCount === 0) {
    blockers.push("No balance candidates were found in the current response.");
  }

  if (inspection.balanceEvidence.recommendedSnapshotConfidence !== "confirmed") {
    blockers.push(
      `Decoder confidence is ${inspection.balanceEvidence.recommendedSnapshotConfidence}, not confirmed.`
    );
  }

  return uniqueSorted(blockers);
}

function buildSuggestedNextSteps(inspection: AccountInspectionResult): string[] {
  const steps: string[] = [];

  if (!inspection.accountPresent) {
    steps.push("Verify the account address/account_id and DApp ID input.");
    steps.push("Repeat the inspection with a known active account.");
    return steps;
  }

  if (!inspection.normalizedAccount?.boc) {
    steps.push(
      "Find an API response or endpoint that returns account BOC for this account."
    );
  } else {
    steps.push(
      "Use the available BOC as the input for the next ABI/BOC decoder experiment."
    );
  }

  if (inspection.balanceEvidence.hasPopitRewardsCandidate) {
    steps.push(
      "Compare PopitGame rewards candidates across multiple known farming/mining wallets."
    );
    steps.push(
      "Validate whether candidate paths map to locked/mining NACKL using ABI/BOC decoding."
    );
  }

  if (inspection.balanceEvidence.hasPrivateNoteCandidate) {
    steps.push(
      "Compare PrivateNote-style balance candidates against known PrivateNote accounts."
    );
    steps.push(
      "Validate token identity and decimals before treating candidates as unlocked NACKL."
    );
  }

  if (inspection.balanceEvidence.candidateCount === 0) {
    steps.push(
      "Inspect raw response shape and extend candidate detection only after identifying stable contract fields."
    );
  }

  steps.push(
    "Keep all balances marked as research evidence until decoder confidence becomes confirmed."
  );

  return uniqueSorted(steps);
}

function researchStatus(
  inspection: AccountInspectionResult,
  blockers: string[]
): DecoderResearchReportStatus {
  if (!inspection.ok || !inspection.accountPresent) {
    return "blocked";
  }

  if (inspection.balanceEvidence.candidateCount === 0) {
    return "research_needed";
  }

  if (blockers.length > 0) {
    return "candidate_evidence_found";
  }

  return "ready_for_manual_review";
}

export function buildDecoderResearchReport(
  inspection: AccountInspectionResult
): DecoderResearchReport {
  const blockers = buildBlockers(inspection);
  const normalizedAccount = inspection.normalizedAccount;
  const account: DecoderResearchReport["account"] = {
    mode: inspection.mode,
    accountPresent: inspection.accountPresent,
    bocPresent: Boolean(normalizedAccount?.boc)
  };

  if (inspection.input.legacyAddress !== undefined) {
    account.legacyAddress = inspection.input.legacyAddress;
  }

  if (inspection.input.accountId !== undefined) {
    account.accountId = inspection.input.accountId;
  }

  if (inspection.input.dappId !== undefined) {
    account.dappId = inspection.input.dappId;
  }

  if (normalizedAccount?.id !== undefined && normalizedAccount.id !== null) {
    account.normalizedId = normalizedAccount.id;
  }

  if (normalizedAccount?.codeHash !== undefined && normalizedAccount.codeHash !== null) {
    account.codeHash = normalizedAccount.codeHash;
  }

  if (normalizedAccount?.dataHash !== undefined && normalizedAccount.dataHash !== null) {
    account.dataHash = normalizedAccount.dataHash;
  }

  return {
    reportId: `decoder-research-${Date.now()}`,
    generatedAt: new Date().toISOString(),
    status: researchStatus(inspection, blockers),
    account,
    classification: inspection.accountClassification,
    balanceEvidence: inspection.balanceEvidence,
    candidateGroups: groupBalanceCandidates(inspection.balanceCandidates),
    suggestedNextSteps: buildSuggestedNextSteps(inspection),
    blockers,
    warnings: uniqueSorted([
      ...inspection.warnings,
      ...inspection.balanceEvidence.warnings,
      ...inspection.accountClassification.warnings
    ])
  };
}
