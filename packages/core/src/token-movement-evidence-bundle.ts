/**
 * Watchtower Batch 60 — Token movement evidence bundle foundation
 *
 * Builds a read-only proof/review bundle around TokenMovement candidates.
 * This file does not fetch chain data, decode transfers, sign messages, custody
 * assets, or claim that unresolved movements are proven.
 */

import type {
  TokenMovement,
  TokenMovementConfidence,
  TokenMovementEvidence,
  TokenMovementUncertainty,
} from "./token-movement";
import { hasConfirmedProof, movementNeedsReview, summarizeMovement } from "./token-movement";

export type TokenMovementEvidenceBundleStatus =
  | "confirmed"
  | "probable"
  | "possible"
  | "unresolved";

export type TokenMovementEvidenceChecklistItemStatus =
  | "present"
  | "missing"
  | "uncertain";

export interface TokenMovementEvidenceChecklistItem {
  readonly id: string;
  readonly label: string;
  readonly status: TokenMovementEvidenceChecklistItemStatus;
  readonly detail: string;
}

export interface TokenMovementEvidenceBundleFact {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly confidence: TokenMovementConfidence;
}

export interface TokenMovementEvidenceBundle {
  readonly id: string;
  readonly movementId: string;
  readonly title: string;
  readonly generatedAt: string;
  readonly status: TokenMovementEvidenceBundleStatus;
  readonly proofStatus: TokenMovementConfidence;
  readonly needsReview: boolean;
  readonly summary: string;
  readonly observedFacts: readonly TokenMovementEvidenceBundleFact[];
  readonly evidence: readonly TokenMovementEvidence[];
  readonly uncertainty: readonly TokenMovementUncertainty[];
  readonly checklist: readonly TokenMovementEvidenceChecklistItem[];
  readonly missingEvidence: readonly string[];
  readonly recommendedNextChecks: readonly string[];
  readonly warnings: readonly string[];
  readonly safety: {
    readonly readOnly: true;
    readonly doesNotRecoverFunds: true;
    readonly doesNotProveUnresolvedMovements: true;
  };
}

export interface TokenMovementEvidenceBundleCollection {
  readonly generatedAt: string;
  readonly totalMovements: number;
  readonly confirmedBundles: number;
  readonly unresolvedBundles: number;
  readonly bundles: readonly TokenMovementEvidenceBundle[];
  readonly warnings: readonly string[];
}

function statusFromMovement(movement: TokenMovement): TokenMovementEvidenceBundleStatus {
  if (hasConfirmedProof(movement)) return "confirmed";
  if (movement.proofStatus === "probable") return "probable";
  if (movement.proofStatus === "possible") return "possible";
  return "unresolved";
}

function fact(id: string, label: string, value: string | null | undefined, confidence: TokenMovementConfidence): TokenMovementEvidenceBundleFact {
  return {
    id,
    label,
    value: value && value.trim() ? value : "Unknown",
    confidence,
  };
}

function addressLabel(label: string | null, address: string | null): string {
  if (label && address) return `${label} (${address})`;
  return label ?? address ?? "Unknown";
}

function amountLabel(movement: TokenMovement): string {
  const value = movement.amount.display ?? movement.amount.raw ?? "Unknown amount";
  const unit = movement.amount.unit || movement.token.symbol || movement.token.family;
  return `${value} ${unit}`.trim();
}

function checklistItem(
  id: string,
  label: string,
  status: TokenMovementEvidenceChecklistItemStatus,
  detail: string,
): TokenMovementEvidenceChecklistItem {
  return { id, label, status, detail };
}

function buildChecklist(movement: TokenMovement): TokenMovementEvidenceChecklistItem[] {
  const hasTransactionEvidence = movement.evidence.some((item) => item.kind === "transaction" && item.id);
  const hasMessageEvidence = movement.evidence.some((item) => item.kind === "message" && item.id);
  const hasAnyEvidence = movement.evidence.length > 0;
  const amountConfirmed = movement.amount.confirmed;
  const tokenKnown = movement.token.isKnown;
  const partiesKnown = Boolean(movement.from.address || movement.from.label) && Boolean(movement.to.address || movement.to.label);

  return [
    checklistItem(
      "transaction-evidence",
      "Transaction evidence",
      hasTransactionEvidence ? "present" : hasAnyEvidence ? "uncertain" : "missing",
      hasTransactionEvidence ? "At least one transaction evidence item has an id." : "No transaction id is attached yet.",
    ),
    checklistItem(
      "message-evidence",
      "Message evidence",
      hasMessageEvidence ? "present" : hasAnyEvidence ? "uncertain" : "missing",
      hasMessageEvidence ? "At least one message evidence item has an id." : "No message id is attached yet.",
    ),
    checklistItem(
      "token-identity",
      "Token identity",
      tokenKnown ? "present" : "uncertain",
      tokenKnown ? `Token is labeled as ${movement.token.symbol}.` : "Token identity is unknown or undecoded.",
    ),
    checklistItem(
      "amount",
      "Amount",
      amountConfirmed ? "present" : movement.amount.raw || movement.amount.display ? "uncertain" : "missing",
      amountConfirmed ? "Amount is marked confirmed." : "Amount is missing, approximate, or not decoded from trusted data.",
    ),
    checklistItem(
      "parties",
      "From / to parties",
      partiesKnown ? "present" : "missing",
      partiesKnown ? "Movement has at least source and destination labels or addresses." : "Source or destination is missing.",
    ),
  ];
}

function missingEvidenceFromChecklist(checklist: readonly TokenMovementEvidenceChecklistItem[]): string[] {
  return checklist
    .filter((item) => item.status !== "present")
    .map((item) => `${item.label}: ${item.detail}`);
}

function recommendedNextChecks(movement: TokenMovement, missingEvidence: readonly string[]): string[] {
  const checks = [
    ...(missingEvidence.length > 0 ? ["Attach raw transaction/message ids before presenting this as proven history."] : []),
    ...(movement.token.family === "UNKNOWN" ? ["Run decoder research or token registry matching for the unknown asset."] : []),
    ...(!movement.amount.confirmed ? ["Confirm decimals, raw amount, and display amount from trusted evidence."] : []),
    ...(movement.uncertainty.some((item) => item.severity === "high") ? ["Review high-severity uncertainty before saving a user-facing conclusion."] : []),
    ...(movement.tags.includes("incident") ? ["Connect this movement to the incident report only as candidate evidence until confirmed."] : []),
  ];

  return checks.length > 0 ? checks : ["No extra checks generated by the evidence bundle foundation."];
}

export function buildTokenMovementEvidenceBundle(movement: TokenMovement, generatedAt = new Date().toISOString()): TokenMovementEvidenceBundle {
  const checklist = buildChecklist(movement);
  const missingEvidence = missingEvidenceFromChecklist(checklist);
  const status = statusFromMovement(movement);
  const warnings = [
    ...movement.warnings,
    ...(status === "confirmed" ? [] : ["This bundle is review evidence, not proof of final asset location."]),
  ];

  return {
    id: `evidence-bundle-${movement.id}`,
    movementId: movement.id,
    title: `${movement.token.symbol || movement.token.family} movement evidence`,
    generatedAt,
    status,
    proofStatus: movement.proofStatus,
    needsReview: movementNeedsReview(movement) || missingEvidence.length > 0,
    summary: summarizeMovement(movement),
    observedFacts: [
      fact("observed-at", "Observed at", movement.observedAt, movement.observedAt ? movement.proofStatus : "unknown"),
      fact("logical-time", "Logical time", movement.logicalTime ?? null, movement.logicalTime ? movement.proofStatus : "unknown"),
      fact("direction", "Direction", movement.direction, movement.proofStatus),
      fact("token", "Token", movement.token.symbol || movement.token.family, movement.token.isKnown ? movement.proofStatus : "unknown"),
      fact("amount", "Amount", amountLabel(movement), movement.amount.confirmed ? movement.proofStatus : "unknown"),
      fact("from", "From", addressLabel(movement.from.label, movement.from.address), movement.from.address ? movement.proofStatus : "unknown"),
      fact("to", "To", addressLabel(movement.to.label, movement.to.address), movement.to.address ? movement.proofStatus : "unknown"),
      fact("via", "Via", movement.via ? addressLabel(movement.via.label, movement.via.address) : null, movement.via ? movement.proofStatus : "unknown"),
      fact("likely-action", "Likely action", movement.likelyAction, movement.proofStatus),
    ],
    evidence: movement.evidence,
    uncertainty: movement.uncertainty,
    checklist,
    missingEvidence,
    recommendedNextChecks: recommendedNextChecks(movement, missingEvidence),
    warnings,
    safety: {
      readOnly: true,
      doesNotRecoverFunds: true,
      doesNotProveUnresolvedMovements: true,
    },
  };
}

export function buildTokenMovementEvidenceBundleCollection(movements: readonly TokenMovement[]): TokenMovementEvidenceBundleCollection {
  const generatedAt = new Date().toISOString();
  const bundles = movements.map((movement) => buildTokenMovementEvidenceBundle(movement, generatedAt));
  const warnings = bundles.flatMap((bundle) => bundle.warnings).filter((warning, index, all) => all.indexOf(warning) === index);

  return {
    generatedAt,
    totalMovements: movements.length,
    confirmedBundles: bundles.filter((bundle) => bundle.status === "confirmed").length,
    unresolvedBundles: bundles.filter((bundle) => bundle.status !== "confirmed").length,
    bundles,
    warnings,
  };
}
