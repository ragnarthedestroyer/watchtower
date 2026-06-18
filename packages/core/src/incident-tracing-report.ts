/**
 * Watchtower Batch 58 — Accumulator / bridge / USDC incident tracing report
 *
 * Read-only report model for unresolved asset-flow incidents. It consumes already
 * observed TokenMovement candidates and registry labels, then explains what is
 * proven, what is likely, and what is still missing. It does not fetch chain data,
 * decode balances, sign, broadcast, custody assets, operate PrivateNote, or claim
 * recovery success.
 */

import type {
  TokenMovement,
  TokenMovementConfidence,
  TokenMovementEvidence,
} from "./token-movement";
import type { KnownContractEntry } from "./known-contract-registry";
import { labelKnownContractAddress } from "./known-contract-registry";

export type IncidentTracingReportStatus =
  | "unresolved"
  | "partially-traced"
  | "needs-more-evidence"
  | "not-enough-data"
  | "resolved-by-evidence";

export type IncidentTracingFindingKind =
  | "shell-outgoing"
  | "usdc-related"
  | "accumulator-interaction"
  | "bridge-interaction"
  | "unknown-token"
  | "missing-proof"
  | "safety-note";

export type IncidentTracingFindingSeverity = "info" | "warning" | "critical";

export interface IncidentTracingTarget {
  id: string;
  title: string;
  subjectAddress?: string | null;
  suspectedAccumulatorAddress?: string | null;
  suspectedBridgeAddress?: string | null;
  expectedOutgoingTokenSymbols?: string[];
  expectedIncomingTokenSymbols?: string[];
  notes?: string[];
}

export interface IncidentTracingFinding {
  id: string;
  kind: IncidentTracingFindingKind;
  severity: IncidentTracingFindingSeverity;
  title: string;
  description: string;
  movementIds: string[];
  evidence: TokenMovementEvidence[];
  confidence: TokenMovementConfidence;
  warnings: string[];
}

export interface IncidentTracingReport {
  id: string;
  title: string;
  generatedAt: string;
  status: IncidentTracingReportStatus;
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
  safety: {
    readOnly: true;
    noSigning: true;
    noCustody: true;
    noPrivateKeys: true;
    unresolvedIsNotProof: true;
  };
  warnings: string[];
}

export interface IncidentTracingReportInput {
  movements: TokenMovement[];
  target?: Partial<IncidentTracingTarget>;
  registry?: KnownContractEntry[];
}

const DEFAULT_TARGET: IncidentTracingTarget = {
  id: "shell-accumulator-usdc-incident",
  title: "SHELL accumulator / USDC recovery incident tracing report",
  subjectAddress: null,
  suspectedAccumulatorAddress: null,
  suspectedBridgeAddress: null,
  expectedOutgoingTokenSymbols: ["SHELL"],
  expectedIncomingTokenSymbols: ["USDC"],
  notes: [
    "Real incident context: almost 30k SHELL was reportedly sent to an accumulator to recover or get USDC, then disappeared from the visible frontend.",
  ],
};

export function buildIncidentTracingTarget(input: Partial<IncidentTracingTarget> = {}): IncidentTracingTarget {
  return {
    ...DEFAULT_TARGET,
    ...input,
    expectedOutgoingTokenSymbols: input.expectedOutgoingTokenSymbols ?? DEFAULT_TARGET.expectedOutgoingTokenSymbols,
    expectedIncomingTokenSymbols: input.expectedIncomingTokenSymbols ?? DEFAULT_TARGET.expectedIncomingTokenSymbols,
    notes: input.notes ?? DEFAULT_TARGET.notes,
  };
}

export function buildAccumulatorBridgeUsdcIncidentReport(input: IncidentTracingReportInput): IncidentTracingReport {
  const target = buildIncidentTracingTarget(input.target);
  const registry = input.registry ?? [];
  const relevantMovements = input.movements.filter((movement) => movementLooksRelevant(movement, target, registry));
  const shellOutgoing = relevantMovements.filter(isShellOutgoingCandidate);
  const usdcRelated = relevantMovements.filter(isUsdcRelatedCandidate);
  const accumulatorRelated = relevantMovements.filter((movement) => movementTouchesRoleOrAddress(movement, "accumulator", target.suspectedAccumulatorAddress, registry));
  const bridgeRelated = relevantMovements.filter((movement) => movementTouchesRoleOrAddress(movement, "bridge", target.suspectedBridgeAddress, registry));
  const confirmedMovements = relevantMovements.filter((movement) => movement.proofStatus === "confirmed");
  const unresolvedMovements = relevantMovements.filter((movement) => movement.proofStatus !== "confirmed");
  const findings: IncidentTracingFinding[] = [];

  if (shellOutgoing.length > 0) {
    findings.push(createFinding({
      id: "finding-shell-outgoing",
      kind: "shell-outgoing",
      severity: "warning",
      title: "Outgoing SHELL candidate found",
      description: "Watchtower found one or more outgoing SHELL movement candidates connected to this incident scope.",
      movements: shellOutgoing,
      confidence: strongestConfidence(shellOutgoing),
    }));
  }

  if (accumulatorRelated.length > 0) {
    findings.push(createFinding({
      id: "finding-accumulator-interaction",
      kind: "accumulator-interaction",
      severity: "warning",
      title: "Accumulator interaction candidate found",
      description: "At least one movement touches an address labeled or suspected as an accumulator. This is not proof of recovery or final asset location.",
      movements: accumulatorRelated,
      confidence: strongestConfidence(accumulatorRelated),
    }));
  }

  if (bridgeRelated.length > 0) {
    findings.push(createFinding({
      id: "finding-bridge-interaction",
      kind: "bridge-interaction",
      severity: "info",
      title: "Bridge interaction candidate found",
      description: "At least one movement touches an address labeled or suspected as a bridge. The bridge leg still needs independent proof.",
      movements: bridgeRelated,
      confidence: strongestConfidence(bridgeRelated),
    }));
  }

  if (usdcRelated.length > 0) {
    findings.push(createFinding({
      id: "finding-usdc-related",
      kind: "usdc-related",
      severity: "info",
      title: "USDC-related candidate found",
      description: "Watchtower found one or more USDC-related movement candidates. This does not prove the expected USDC was received unless the movement itself is confirmed.",
      movements: usdcRelated,
      confidence: strongestConfidence(usdcRelated),
    }));
  }

  const unknownTokenMovements = relevantMovements.filter((movement) => movement.token.family === "UNKNOWN" || movement.token.symbol === "UNKNOWN");
  if (unknownTokenMovements.length > 0) {
    findings.push(createFinding({
      id: "finding-unknown-token",
      kind: "unknown-token",
      severity: "critical",
      title: "Undecoded or unknown token movement remains",
      description: "Some relevant movement candidates still have unknown token identity. They require decoder or contract-label evidence before any final conclusion.",
      movements: unknownTokenMovements,
      confidence: "unknown",
    }));
  }

  if (relevantMovements.length === 0) {
    findings.push({
      id: "finding-no-relevant-movements",
      kind: "missing-proof",
      severity: "critical",
      title: "No relevant movement evidence attached yet",
      description: "The report was generated, but no matching SHELL, USDC, accumulator, bridge, or incident-tagged movement candidates were provided.",
      movementIds: [],
      evidence: [],
      confidence: "unknown",
      warnings: ["This report cannot trace the incident until transaction/message evidence is attached."],
    });
  }

  const missingEvidence = buildMissingEvidence(target, shellOutgoing, usdcRelated, accumulatorRelated, relevantMovements);
  const recommendedNextChecks = buildRecommendedNextChecks(target, shellOutgoing, usdcRelated, accumulatorRelated, bridgeRelated);
  const warnings = buildReportWarnings(relevantMovements, missingEvidence);

  return {
    id: target.id,
    title: target.title,
    generatedAt: new Date().toISOString(),
    status: determineReportStatus(relevantMovements, shellOutgoing, usdcRelated, missingEvidence),
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
    recommendedNextChecks,
    safety: {
      readOnly: true,
      noSigning: true,
      noCustody: true,
      noPrivateKeys: true,
      unresolvedIsNotProof: true,
    },
    warnings,
  };
}

export function renderIncidentTracingReportText(report: IncidentTracingReport): string {
  const lines: string[] = [];
  lines.push(report.title);
  lines.push(`Status: ${report.status}`);
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push(`Movements reviewed: ${report.totals.movementsReviewed}`);
  lines.push(`Relevant movements: ${report.totals.relevantMovements}`);
  lines.push(`SHELL outgoing candidates: ${report.totals.shellOutgoingCandidates}`);
  lines.push(`USDC-related candidates: ${report.totals.usdcRelatedCandidates}`);
  lines.push(`Accumulator candidates: ${report.totals.accumulatorCandidates}`);
  lines.push(`Bridge candidates: ${report.totals.bridgeCandidates}`);
  lines.push("");
  lines.push("Findings:");

  for (const finding of report.findings) {
    lines.push(`- ${finding.title} [${finding.severity}, ${finding.confidence}]`);
    lines.push(`  ${finding.description}`);
    if (finding.movementIds.length > 0) lines.push(`  movements: ${finding.movementIds.join(", ")}`);
    if (finding.warnings.length > 0) lines.push(`  warnings: ${finding.warnings.join(" | ")}`);
  }

  if (report.missingEvidence.length > 0) {
    lines.push("");
    lines.push("Missing evidence:");
    for (const item of report.missingEvidence) lines.push(`- ${item}`);
  }

  if (report.recommendedNextChecks.length > 0) {
    lines.push("");
    lines.push("Recommended next checks:");
    for (const item of report.recommendedNextChecks) lines.push(`- ${item}`);
  }

  if (report.warnings.length > 0) {
    lines.push("");
    lines.push("Warnings:");
    for (const warning of report.warnings) lines.push(`- ${warning}`);
  }

  lines.push("");
  lines.push("Read-only report. It does not sign, recover, custody, or prove unresolved movements.");
  return lines.join("\n");
}

export function renderIncidentTracingReportMarkdown(report: IncidentTracingReport): string {
  const lines: string[] = [];
  lines.push(`# ${report.title}`);
  lines.push("");
  lines.push(`**Status:** ${report.status}`);
  lines.push(`**Generated:** ${report.generatedAt}`);
  lines.push("");
  lines.push("## Totals");
  lines.push(`- Movements reviewed: ${report.totals.movementsReviewed}`);
  lines.push(`- Relevant movements: ${report.totals.relevantMovements}`);
  lines.push(`- SHELL outgoing candidates: ${report.totals.shellOutgoingCandidates}`);
  lines.push(`- USDC-related candidates: ${report.totals.usdcRelatedCandidates}`);
  lines.push(`- Accumulator candidates: ${report.totals.accumulatorCandidates}`);
  lines.push(`- Bridge candidates: ${report.totals.bridgeCandidates}`);
  lines.push(`- Confirmed movements: ${report.totals.confirmedMovements}`);
  lines.push(`- Unresolved movements: ${report.totals.unresolvedMovements}`);
  lines.push("");
  lines.push("## Findings");

  for (const finding of report.findings) {
    lines.push(`### ${finding.title}`);
    lines.push(`- Kind: ${finding.kind}`);
    lines.push(`- Severity: ${finding.severity}`);
    lines.push(`- Confidence: ${finding.confidence}`);
    lines.push(`- Movement IDs: ${finding.movementIds.length > 0 ? finding.movementIds.join(", ") : "none"}`);
    lines.push("");
    lines.push(finding.description);
    lines.push("");
  }

  lines.push("## Missing evidence");
  if (report.missingEvidence.length === 0) {
    lines.push("- No missing evidence detected by this report model.");
  } else {
    for (const item of report.missingEvidence) lines.push(`- ${item}`);
  }

  lines.push("");
  lines.push("## Recommended next checks");
  for (const item of report.recommendedNextChecks) lines.push(`- ${item}`);

  lines.push("");
  lines.push("## Safety boundary");
  lines.push("This is a read-only Watchtower report. It must not ask for seed phrases, private keys, signatures, custody, or wallet actions.");
  lines.push("Candidate, partial, unresolved, and unknown movements are not proof of final asset movement.");
  return lines.join("\n");
}

function movementLooksRelevant(movement: TokenMovement, target: IncidentTracingTarget, registry: KnownContractEntry[]): boolean {
  const expectedOutgoing = new Set((target.expectedOutgoingTokenSymbols ?? []).map((item) => item.toUpperCase()));
  const expectedIncoming = new Set((target.expectedIncomingTokenSymbols ?? []).map((item) => item.toUpperCase()));
  const symbol = movement.token.symbol.toUpperCase();
  const family = movement.token.family.toUpperCase();

  if (expectedOutgoing.has(symbol) || expectedOutgoing.has(family) || expectedIncoming.has(symbol) || expectedIncoming.has(family)) return true;
  if (movement.tags.some((tag) => ["shell", "usdc", "accumulator", "bridge", "incident", "recovery"].includes(tag.toLowerCase()))) return true;
  if (movementTouchesRoleOrAddress(movement, "accumulator", target.suspectedAccumulatorAddress, registry)) return true;
  if (movementTouchesRoleOrAddress(movement, "bridge", target.suspectedBridgeAddress, registry)) return true;
  return false;
}

function isShellOutgoingCandidate(movement: TokenMovement): boolean {
  return movement.direction === "outgoing" && movement.token.symbol.toUpperCase() === "SHELL";
}

function isUsdcRelatedCandidate(movement: TokenMovement): boolean {
  return movement.token.symbol.toUpperCase() === "USDC" || movement.token.family === "USDC" || movement.tags.some((tag) => tag.toLowerCase() === "usdc");
}

function movementTouchesRoleOrAddress(
  movement: TokenMovement,
  role: "accumulator" | "bridge",
  suspectedAddress: string | null | undefined,
  registry: KnownContractEntry[],
): boolean {
  const addresses = [movement.from.address, movement.to.address, movement.via?.address ?? null].filter((value): value is string => Boolean(value));
  const normalizedSuspect = normalizeAddress(suspectedAddress ?? null);

  if (normalizedSuspect && addresses.some((address) => normalizeAddress(address) === normalizedSuspect)) return true;
  if ([movement.from.role, movement.to.role, movement.via?.role].includes(role)) return true;

  return addresses.some((address) => labelKnownContractAddress(address, registry).role === role);
}

function createFinding(input: {
  id: string;
  kind: IncidentTracingFindingKind;
  severity: IncidentTracingFindingSeverity;
  title: string;
  description: string;
  movements: TokenMovement[];
  confidence: TokenMovementConfidence;
}): IncidentTracingFinding {
  return {
    id: input.id,
    kind: input.kind,
    severity: input.severity,
    title: input.title,
    description: input.description,
    movementIds: input.movements.map((movement) => movement.id),
    evidence: dedupeEvidence(input.movements.flatMap((movement) => movement.evidence)),
    confidence: input.confidence,
    warnings: dedupe(input.movements.flatMap((movement) => movement.warnings)),
  };
}

function strongestConfidence(movements: TokenMovement[]): TokenMovementConfidence {
  const rank: Record<TokenMovementConfidence, number> = { confirmed: 4, probable: 3, possible: 2, unknown: 1 };
  return movements.reduce<TokenMovementConfidence>((best, movement) => (rank[movement.proofStatus] > rank[best] ? movement.proofStatus : best), "unknown");
}

function buildMissingEvidence(
  target: IncidentTracingTarget,
  shellOutgoing: TokenMovement[],
  usdcRelated: TokenMovement[],
  accumulatorRelated: TokenMovement[],
  relevantMovements: TokenMovement[],
): string[] {
  const missing: string[] = [];
  if (shellOutgoing.length === 0) missing.push("Confirmed or candidate outgoing SHELL movement from the watched wallet is missing.");
  if (accumulatorRelated.length === 0) missing.push("Confirmed accumulator address, registry label, or accumulator-touching message is missing.");
  if (usdcRelated.length === 0) missing.push("USDC-side movement evidence is missing, so the recovery/get-USDC leg cannot be verified.");
  if (!target.subjectAddress) missing.push("Watched/source wallet address is not attached to the incident target.");
  if (!target.suspectedAccumulatorAddress) missing.push("Suspected accumulator address is not attached to the incident target.");
  if (relevantMovements.some((movement) => movement.amount.confirmed === false)) missing.push("At least one relevant amount is approximate, raw, or unconfirmed.");
  if (relevantMovements.some((movement) => movement.proofStatus !== "confirmed")) missing.push("At least one relevant movement is not confirmed by trusted decoded evidence.");
  return dedupe(missing);
}

function buildRecommendedNextChecks(
  target: IncidentTracingTarget,
  shellOutgoing: TokenMovement[],
  usdcRelated: TokenMovement[],
  accumulatorRelated: TokenMovement[],
  bridgeRelated: TokenMovement[],
): string[] {
  const checks: string[] = [
    "Attach the exact transaction/message id for the outgoing SHELL transfer.",
    "Attach or confirm the accumulator contract address and add it as a user-provided known-contract registry entry.",
    "Check whether the accumulator emitted or triggered a follow-up USDC, bridge, or token-wallet message.",
    "Keep the report label as unresolved until the USDC leg is independently observed and decoded.",
  ];

  if (!target.subjectAddress) checks.push("Set the source watched wallet address in the incident target.");
  if (shellOutgoing.length > 0 && usdcRelated.length === 0) checks.push("Search the same time window for USDC token-root/token-wallet movements.");
  if (accumulatorRelated.length > 0 && bridgeRelated.length === 0) checks.push("Check whether the accumulator interacted with a bridge or token root after receiving SHELL.");
  return dedupe(checks);
}

function buildReportWarnings(relevantMovements: TokenMovement[], missingEvidence: string[]): string[] {
  const warnings = [
    "This report is explanatory only and must not be shown as proof of where funds currently are.",
    "Watchtower remains read-only and must not request keys, signatures, seed phrases, or wallet control.",
  ];

  if (relevantMovements.length === 0) warnings.push("No relevant movement candidates were supplied to the report.");
  if (missingEvidence.length > 0) warnings.push("The incident remains unresolved because required evidence is missing.");
  if (relevantMovements.some((movement) => movement.token.family === "UNKNOWN")) warnings.push("Some relevant movements still have unknown token identity.");
  return dedupe(warnings);
}

function determineReportStatus(
  relevantMovements: TokenMovement[],
  shellOutgoing: TokenMovement[],
  usdcRelated: TokenMovement[],
  missingEvidence: string[],
): IncidentTracingReportStatus {
  if (relevantMovements.length === 0) return "not-enough-data";
  if (missingEvidence.length > 0 && shellOutgoing.length === 0) return "needs-more-evidence";
  if (shellOutgoing.length > 0 && usdcRelated.length > 0 && relevantMovements.every((movement) => movement.proofStatus === "confirmed")) return "resolved-by-evidence";
  if (shellOutgoing.length > 0 || usdcRelated.length > 0) return "partially-traced";
  return "unresolved";
}

function normalizeAddress(address: string | null): string | null {
  const trimmed = address?.trim().toLowerCase() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

function dedupe(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function dedupeEvidence(values: TokenMovementEvidence[]): TokenMovementEvidence[] {
  const seen = new Set<string>();
  const result: TokenMovementEvidence[] = [];
  for (const item of values) {
    const key = [item.kind, item.id ?? "", item.source, item.description].join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result.slice(0, 12);
}
