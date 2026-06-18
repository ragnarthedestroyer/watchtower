import type { TokenMovement, TokenMovementConfidence } from "./token-movement";

export type IncidentTracingStatus = "unresolved" | "partial-evidence" | "needs-review" | "confirmed";
export type IncidentFindingKind = "observed" | "shell" | "usdc" | "accumulator" | "bridge" | "missing-evidence" | "safety";
export type IncidentFindingSeverity = "info" | "warning" | "danger";

export interface IncidentTracingTarget {
  id: string;
  title: string;
  subjectAddress?: string | null;
  suspectedAccumulatorAddress?: string | null;
  suspectedBridgeAddress?: string | null;
  expectedOutgoingTokenSymbols: string[] | undefined;
  expectedIncomingTokenSymbols: string[] | undefined;
  notes: string[] | undefined;
}

export interface IncidentTracingFinding {
  id: string;
  kind: IncidentFindingKind;
  title: string;
  description: string;
  severity: IncidentFindingSeverity;
  confidence: TokenMovementConfidence;
  movementIds: string[];
}

export interface IncidentTracingReportInput {
  id?: string;
  title?: string;
  movements: TokenMovement[];
  target?: Partial<IncidentTracingTarget>;
}

export interface IncidentTracingReport {
  id: string;
  title: string;
  generatedAt: string;
  status: IncidentTracingStatus;
  target: IncidentTracingTarget;
  totals: {
    movementsReviewed: number;
    relevantMovements: number;
    shellOutgoingCandidates: number;
    usdcRelatedCandidates: number;
    accumulatorCandidates: number;
    bridgeCandidates: number;
    confirmedMovements: number;
    unresolvedMovements: number;
  };
  findings: IncidentTracingFinding[];
  missingEvidence: string[];
  recommendedNextChecks: string[];
  warnings: string[];
  safety: {
    readOnly: true;
    doesNotRecoverFunds: true;
    doesNotProveUnresolvedMovements: true;
  };
}

const DEFAULT_TARGET: IncidentTracingTarget = {
  id: "shell-accumulator-usdc-incident",
  title: "SHELL accumulator / USDC recovery incident",
  subjectAddress: null,
  suspectedAccumulatorAddress: null,
  suspectedBridgeAddress: null,
  expectedOutgoingTokenSymbols: ["SHELL"],
  expectedIncomingTokenSymbols: ["USDC"],
  notes: ["Almost 30k SHELL reportedly sent to an accumulator to recover or get USDC."],
};

function mergeTarget(input: Partial<IncidentTracingTarget> | undefined): IncidentTracingTarget {
  return {
    ...DEFAULT_TARGET,
    ...(input ?? {}),
    expectedOutgoingTokenSymbols: input?.expectedOutgoingTokenSymbols ?? DEFAULT_TARGET.expectedOutgoingTokenSymbols,
    expectedIncomingTokenSymbols: input?.expectedIncomingTokenSymbols ?? DEFAULT_TARGET.expectedIncomingTokenSymbols,
    notes: input?.notes ?? DEFAULT_TARGET.notes,
  };
}

function movementToken(movement: TokenMovement): string {
  return (movement.token.symbol || movement.token.family || "UNKNOWN").toUpperCase();
}

function movementText(movement: TokenMovement): string {
  return [
    movement.id,
    movementToken(movement),
    movement.direction,
    movement.from.address,
    movement.from.label,
    movement.to.address,
    movement.to.label,
    movement.via?.address,
    movement.via?.label,
    movement.likelyAction,
    movement.summary,
    ...movement.tags,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function hasText(movement: TokenMovement, ...needles: string[]): boolean {
  const haystack = movementText(movement);
  return needles.some((needle) => haystack.includes(needle.toLowerCase()));
}

function isRelevant(movement: TokenMovement): boolean {
  return hasText(movement, "shell", "usdc", "accumulator", "bridge", "incident", "recovery");
}

function finding(
  id: string,
  kind: IncidentFindingKind,
  title: string,
  description: string,
  severity: IncidentFindingSeverity,
  confidence: TokenMovementConfidence,
  movements: TokenMovement[],
): IncidentTracingFinding {
  return {
    id,
    kind,
    title,
    description,
    severity,
    confidence,
    movementIds: movements.map((movement) => movement.id),
  };
}

function determineReportStatus(relevant: TokenMovement[], missingEvidence: string[]): IncidentTracingStatus {
  if (relevant.length === 0) return "unresolved";
  if (missingEvidence.length > 0) return "needs-review";
  if (relevant.every((movement) => movement.proofStatus === "confirmed")) return "confirmed";
  return "partial-evidence";
}

export function buildIncidentTracingReport(input: IncidentTracingReportInput): IncidentTracingReport {
  const target = mergeTarget(input.target);
  const relevantMovements = input.movements.filter(isRelevant);
  const shellOutgoing = relevantMovements.filter((movement) => movementToken(movement) === "SHELL" && movement.direction === "outgoing");
  const usdcRelated = relevantMovements.filter((movement) => movementToken(movement) === "USDC" || hasText(movement, "usdc"));
  const accumulatorRelated = relevantMovements.filter((movement) => hasText(movement, "accumulator"));
  const bridgeRelated = relevantMovements.filter((movement) => hasText(movement, "bridge"));
  const confirmedMovements = relevantMovements.filter((movement) => movement.proofStatus === "confirmed");
  const unresolvedMovements = relevantMovements.filter((movement) => movement.proofStatus !== "confirmed");

  const missingEvidence = [
    ...(shellOutgoing.length === 0 ? ["No confirmed outgoing SHELL movement has been attached to the incident report yet."] : []),
    ...(usdcRelated.length === 0 ? ["No related USDC movement or return path has been attached yet."] : []),
    ...(accumulatorRelated.length === 0 ? ["No confirmed accumulator contract address or labeled accumulator interaction is attached yet."] : []),
    ...(bridgeRelated.length === 0 ? ["No confirmed bridge interaction is attached yet."] : []),
    ...(target.suspectedAccumulatorAddress ? [] : ["Suspected accumulator address is not confirmed in the report target."]),
  ];

  const findings: IncidentTracingFinding[] = [];
  if (shellOutgoing.length > 0) {
    findings.push(finding(
      "shell-outgoing-candidates",
      "shell",
      "Outgoing SHELL candidate(s) found",
      "Watchtower found movement candidates that match the expected outgoing SHELL side of the incident.",
      "warning",
      shellOutgoing.some((movement) => movement.proofStatus === "confirmed") ? "probable" : "possible",
      shellOutgoing,
    ));
  }
  if (usdcRelated.length > 0) {
    findings.push(finding(
      "usdc-related-candidates",
      "usdc",
      "USDC-related candidate(s) found",
      "Watchtower found candidate movements or labels related to USDC, but these must still be reviewed against proof evidence.",
      "warning",
      usdcRelated.some((movement) => movement.proofStatus === "confirmed") ? "probable" : "possible",
      usdcRelated,
    ));
  }
  if (accumulatorRelated.length > 0) {
    findings.push(finding(
      "accumulator-candidates",
      "accumulator",
      "Accumulator-related candidate(s) found",
      "One or more movements mention or point to an accumulator candidate.",
      "warning",
      "possible",
      accumulatorRelated,
    ));
  }
  if (missingEvidence.length > 0) {
    findings.push({
      id: "missing-evidence",
      kind: "missing-evidence",
      title: "Evidence is still incomplete",
      description: "The report cannot prove where the assets are now until the missing evidence is filled.",
      severity: "danger",
      confidence: "unknown",
      movementIds: [],
    });
  }

  return {
    id: input.id ?? target.id,
    title: input.title ?? target.title,
    generatedAt: new Date().toISOString(),
    status: determineReportStatus(relevantMovements, missingEvidence),
    target,
    totals: {
      movementsReviewed: input.movements.length,
      relevantMovements: relevantMovements.length,
      shellOutgoingCandidates: shellOutgoing.length,
      usdcRelatedCandidates: usdcRelated.length,
      accumulatorCandidates: accumulatorRelated.length,
      bridgeCandidates: bridgeRelated.length,
      confirmedMovements: confirmedMovements.length,
      unresolvedMovements: unresolvedMovements.length,
    },
    findings,
    missingEvidence,
    recommendedNextChecks: [
      "Attach the exact wallet address and transaction/message hash for the SHELL send.",
      "Confirm the accumulator contract address and label confidence.",
      "Check whether any USDC/TIP-3 token-wallet movement exists after the SHELL send.",
      "Keep candidate rows visibly unresolved until transaction/message proof is decoded.",
    ],
    warnings: [
      "Read-only report. It does not recover funds, sign transactions, or prove unresolved transfers.",
      "Candidate movements must not be presented as confirmed history.",
    ],
    safety: {
      readOnly: true,
      doesNotRecoverFunds: true,
      doesNotProveUnresolvedMovements: true,
    },
  };
}
