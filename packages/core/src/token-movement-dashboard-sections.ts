/**
 * Watchtower Batch 64 — On-the-fly frontend movement dashboard sections
 *
 * Creates a privacy-conscious, read-only frontend grouping layer for token
 * movement candidates. It does not fetch chain data, persist user data, use
 * browser storage, sign transactions, custody assets, or claim unresolved
 * evidence as proven.
 */

import type {
  TokenMovement,
  TokenMovementAssetFamily,
  TokenMovementConfidence,
  TokenMovementDirection,
} from "./token-movement";
import { movementNeedsReview } from "./token-movement";

export type TokenMovementFrontendSectionId =
  | "nackl-mining-rewards"
  | "direct-transfers-in"
  | "direct-transfers-out"
  | "other-unresolved-or-contract-flows";

export type TokenMovementFrontendVisualKind =
  | "reward-card"
  | "transfer-in-card"
  | "transfer-out-card"
  | "review-card";

export type TokenMovementFrontendStorageMode = "on-the-fly-no-storage";

export interface TokenMovementFrontendDashboardOptions {
  readonly title?: string;
  readonly generatedAt?: string;
  readonly includeOtherSection?: boolean;
}

export interface TokenMovementFrontendPrivacyProfile {
  readonly storageMode: TokenMovementFrontendStorageMode;
  readonly userDataStored: false;
  readonly browserStorageUsed: false;
  readonly serverPersistenceUsed: false;
  readonly processingMode: string;
  readonly retention: string;
  readonly notice: string;
  readonly notes: readonly string[];
}

export interface TokenMovementFrontendDashboardTotals {
  readonly totalInputMovements: number;
  readonly shownMovements: number;
  readonly nacklMiningRewards: number;
  readonly directTransfersIn: number;
  readonly directTransfersOut: number;
  readonly otherOrNeedsReview: number;
  readonly confirmedRows: number;
  readonly candidateRows: number;
  readonly needsReviewRows: number;
}

export interface TokenMovementFrontendDashboardRow {
  readonly id: string;
  readonly movementId: string;
  readonly sectionId: TokenMovementFrontendSectionId;
  readonly visualKind: TokenMovementFrontendVisualKind;
  readonly observedAtLabel: string;
  readonly tokenSymbol: string;
  readonly tokenFamily: TokenMovementAssetFamily;
  readonly amountLabel: string;
  readonly direction: TokenMovementDirection;
  readonly fromLabel: string;
  readonly toLabel: string;
  readonly routeLabel: string;
  readonly likelyAction: string;
  readonly proofStatus: TokenMovementConfidence;
  readonly confidenceLabel: string;
  readonly needsReview: boolean;
  readonly warnings: readonly string[];
  readonly tags: readonly string[];
}

export interface TokenMovementFrontendDashboardSection {
  readonly id: TokenMovementFrontendSectionId;
  readonly title: string;
  readonly description: string;
  readonly visualKind: TokenMovementFrontendVisualKind;
  readonly rows: readonly TokenMovementFrontendDashboardRow[];
  readonly emptyState: string;
  readonly warnings: readonly string[];
}

export interface TokenMovementFrontendDashboard {
  readonly title: string;
  readonly generatedAt: string;
  readonly privacy: TokenMovementFrontendPrivacyProfile;
  readonly totals: TokenMovementFrontendDashboardTotals;
  readonly sections: readonly TokenMovementFrontendDashboardSection[];
  readonly warnings: readonly string[];
}

export const TOKEN_MOVEMENT_FRONTEND_PRIVACY_PROFILE: TokenMovementFrontendPrivacyProfile = {
  storageMode: "on-the-fly-no-storage",
  userDataStored: false,
  browserStorageUsed: false,
  serverPersistenceUsed: false,
  processingMode: "Computed from the provided in-memory movement candidates at render time.",
  retention: "No retention is introduced by this dashboard grouping layer.",
  notice:
    "Watchtower renders token movement sections on the fly. This layer does not store user wallet data, movement history, queries, or rendered rows.",
  notes: [
    "Blockchain addresses can still become personal data if they are linked to an identifiable person.",
    "No-storage design reduces retention risk, but it is not a blanket GDPR exemption by itself.",
    "Future live-reader and server-route batches should keep this same no-user-history-persistence boundary unless explicitly changed.",
  ],
};

export function createTokenMovementFrontendDashboard(
  movements: readonly TokenMovement[],
  options: TokenMovementFrontendDashboardOptions = {},
): TokenMovementFrontendDashboard {
  const includeOtherSection = options.includeOtherSection ?? true;
  const rows = movements.map(toDashboardRow);
  const sectionIds: readonly TokenMovementFrontendSectionId[] = includeOtherSection
    ? ["nackl-mining-rewards", "direct-transfers-in", "direct-transfers-out", "other-unresolved-or-contract-flows"]
    : ["nackl-mining-rewards", "direct-transfers-in", "direct-transfers-out"];

  const sections = sectionIds.map((id) => createDashboardSection(id, rows.filter((row) => row.sectionId === id)));
  const shownRows = sections.flatMap((section) => [...section.rows]);

  const warnings = createDashboardWarnings(movements, rows, includeOtherSection);

  return {
    title: options.title ?? "Token movement dashboard",
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    privacy: TOKEN_MOVEMENT_FRONTEND_PRIVACY_PROFILE,
    totals: {
      totalInputMovements: movements.length,
      shownMovements: shownRows.length,
      nacklMiningRewards: countSectionRows(rows, "nackl-mining-rewards"),
      directTransfersIn: countSectionRows(rows, "direct-transfers-in"),
      directTransfersOut: countSectionRows(rows, "direct-transfers-out"),
      otherOrNeedsReview: countSectionRows(rows, "other-unresolved-or-contract-flows"),
      confirmedRows: shownRows.filter((row) => row.proofStatus === "confirmed").length,
      candidateRows: shownRows.filter((row) => row.proofStatus !== "confirmed").length,
      needsReviewRows: shownRows.filter((row) => row.needsReview).length,
    },
    sections,
    warnings,
  };
}

export function classifyTokenMovementFrontendSection(movement: TokenMovement): TokenMovementFrontendSectionId {
  if (isNacklMiningReward(movement)) return "nackl-mining-rewards";
  if (isDirectTransferIn(movement)) return "direct-transfers-in";
  if (isDirectTransferOut(movement)) return "direct-transfers-out";
  return "other-unresolved-or-contract-flows";
}

function toDashboardRow(movement: TokenMovement): TokenMovementFrontendDashboardRow {
  const sectionId = classifyTokenMovementFrontendSection(movement);
  return {
    id: `${sectionId}:${movement.id}`,
    movementId: movement.id,
    sectionId,
    visualKind: visualKindForSection(sectionId),
    observedAtLabel: formatObservedAt(movement.observedAt),
    tokenSymbol: movement.token.symbol,
    tokenFamily: movement.token.family,
    amountLabel: formatAmount(movement),
    direction: movement.direction,
    fromLabel: partyLabel(movement.from.label, movement.from.address),
    toLabel: partyLabel(movement.to.label, movement.to.address),
    routeLabel: routeLabel(movement),
    likelyAction: movement.likelyAction,
    proofStatus: movement.proofStatus,
    confidenceLabel: confidenceLabel(movement.proofStatus),
    needsReview: movementNeedsReview(movement),
    warnings: movement.warnings,
    tags: movement.tags,
  };
}

function createDashboardSection(
  id: TokenMovementFrontendSectionId,
  rows: readonly TokenMovementFrontendDashboardRow[],
): TokenMovementFrontendDashboardSection {
  return {
    id,
    title: sectionTitle(id),
    description: sectionDescription(id),
    visualKind: visualKindForSection(id),
    rows,
    emptyState: sectionEmptyState(id),
    warnings: sectionWarnings(id, rows),
  };
}

function isNacklMiningReward(movement: TokenMovement): boolean {
  if (!isNackl(movement)) return false;
  const text = searchableMovementText(movement);
  const tagHit = movement.tags.some((tag) => ["mining", "reward", "mining-reward", "mobile-verifier", "epoch"].includes(tag.toLowerCase()));
  const textHit =
    text.includes("mining") ||
    text.includes("reward") ||
    text.includes("mobile verifier") ||
    text.includes("epoch") ||
    text.includes("emission");
  return (movement.direction === "incoming" || movement.direction === "internal" || movement.direction === "unknown") && (tagHit || textHit);
}

function isDirectTransferIn(movement: TokenMovement): boolean {
  return movement.direction === "incoming" && isSupportedDirectTransferToken(movement) && isLikelyDirectTransfer(movement);
}

function isDirectTransferOut(movement: TokenMovement): boolean {
  return movement.direction === "outgoing" && isSupportedDirectTransferToken(movement) && isLikelyDirectTransfer(movement);
}

function isSupportedDirectTransferToken(movement: TokenMovement): boolean {
  const symbol = movement.token.symbol.toUpperCase();
  return movement.token.family === "NACKL" || movement.token.family === "SHELL" || movement.token.family === "USDC" || ["NACKL", "SHELL", "USDC"].includes(symbol);
}

function isNackl(movement: TokenMovement): boolean {
  return movement.token.family === "NACKL" || movement.token.symbol.toUpperCase() === "NACKL";
}

function isLikelyDirectTransfer(movement: TokenMovement): boolean {
  const blockedRoles = new Set(["accumulator", "bridge", "dex", "private-note", "multifactor"]);
  const roles = [movement.from.role, movement.to.role, movement.via?.role ?? "unknown"];
  if (roles.some((role) => blockedRoles.has(role))) return false;

  const tags = movement.tags.map((tag) => tag.toLowerCase());
  if (tags.some((tag) => ["accumulator", "bridge", "dex", "private-note", "incident", "usdc-recovery"].includes(tag))) return false;

  const text = searchableMovementText(movement);
  if (text.includes("accumulator") || text.includes("bridge") || text.includes("private note") || text.includes("dex")) return false;

  return true;
}

function searchableMovementText(movement: TokenMovement): string {
  return [movement.summary, movement.likelyAction, movement.token.contractLabel ?? "", ...movement.tags].join(" ").toLowerCase();
}

function visualKindForSection(id: TokenMovementFrontendSectionId): TokenMovementFrontendVisualKind {
  switch (id) {
    case "nackl-mining-rewards":
      return "reward-card";
    case "direct-transfers-in":
      return "transfer-in-card";
    case "direct-transfers-out":
      return "transfer-out-card";
    case "other-unresolved-or-contract-flows":
    default:
      return "review-card";
  }
}

function sectionTitle(id: TokenMovementFrontendSectionId): string {
  switch (id) {
    case "nackl-mining-rewards":
      return "NACKL mining rewards";
    case "direct-transfers-in":
      return "Direct transfers in";
    case "direct-transfers-out":
      return "Direct transfers out";
    case "other-unresolved-or-contract-flows":
      return "Other / unresolved / contract flows";
  }
}

function sectionDescription(id: TokenMovementFrontendSectionId): string {
  switch (id) {
    case "nackl-mining-rewards":
      return "Incoming or internal NACKL candidates that look related to mining, rewards, epochs, or emissions.";
    case "direct-transfers-in":
      return "Incoming NACKL, SHELL, or USDC candidates that look like direct wallet transfers.";
    case "direct-transfers-out":
      return "Outgoing NACKL, SHELL, or USDC candidates that look like direct wallet transfers.";
    case "other-unresolved-or-contract-flows":
      return "Movements involving unknown tokens, contracts, bridge, accumulator, DEX, PrivateNote, or unresolved evidence.";
  }
}

function sectionEmptyState(id: TokenMovementFrontendSectionId): string {
  switch (id) {
    case "nackl-mining-rewards":
      return "No NACKL mining reward candidates in the current in-memory view.";
    case "direct-transfers-in":
      return "No direct incoming NACKL, SHELL, or USDC transfer candidates in the current in-memory view.";
    case "direct-transfers-out":
      return "No direct outgoing NACKL, SHELL, or USDC transfer candidates in the current in-memory view.";
    case "other-unresolved-or-contract-flows":
      return "No unresolved or contract-routed movement candidates in the current in-memory view.";
  }
}

function sectionWarnings(id: TokenMovementFrontendSectionId, rows: readonly TokenMovementFrontendDashboardRow[]): readonly string[] {
  if (rows.length === 0) return [];
  if (id === "other-unresolved-or-contract-flows") {
    return ["Rows in this section need review before they are described as direct transfers or confirmed asset flow."];
  }
  if (rows.some((row) => row.proofStatus !== "confirmed")) {
    return ["Some rows in this section are candidates and still need proof or decoder confirmation."];
  }
  return [];
}

function createDashboardWarnings(
  movements: readonly TokenMovement[],
  rows: readonly TokenMovementFrontendDashboardRow[],
  includeOtherSection: boolean,
): readonly string[] {
  const warnings: string[] = [
    "This dashboard is a read-only rendering layer and does not store user movement history.",
    "Candidate rows are not proof unless their proof status is confirmed.",
  ];
  const otherCount = countSectionRows(rows, "other-unresolved-or-contract-flows");
  if (!includeOtherSection && otherCount > 0) {
    warnings.push(`${otherCount} movement candidate(s) were not shown because the review section is disabled.`);
  }
  if (rows.length !== movements.length && includeOtherSection) {
    warnings.push("Some input movements could not be represented in the dashboard sections.");
  }
  return warnings;
}

function countSectionRows(rows: readonly TokenMovementFrontendDashboardRow[], id: TokenMovementFrontendSectionId): number {
  return rows.filter((row) => row.sectionId === id).length;
}

function formatObservedAt(value: string | null): string {
  if (!value) return "Unknown time";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toISOString();
}

function formatAmount(movement: TokenMovement): string {
  const value = movement.amount.display ?? movement.amount.raw ?? "unknown amount";
  const unit = movement.amount.unit || movement.token.symbol;
  const suffix = movement.amount.confirmed ? "" : " · unconfirmed";
  return `${value} ${unit}${suffix}`;
}

function partyLabel(label: string | null, address: string | null): string {
  if (label && address) return `${label} (${shortAddress(address)})`;
  if (label) return label;
  if (address) return shortAddress(address);
  return "unknown";
}

function routeLabel(movement: TokenMovement): string {
  const via = movement.via?.label ?? movement.via?.address ?? null;
  if (!via) return `${partyLabel(movement.from.label, movement.from.address)} → ${partyLabel(movement.to.label, movement.to.address)}`;
  return `${partyLabel(movement.from.label, movement.from.address)} → ${shortAddress(via)} → ${partyLabel(movement.to.label, movement.to.address)}`;
}

function shortAddress(address: string): string {
  if (address.length <= 16) return address;
  return `${address.slice(0, 8)}…${address.slice(-6)}`;
}

function confidenceLabel(confidence: TokenMovementConfidence): string {
  switch (confidence) {
    case "confirmed":
      return "Confirmed";
    case "probable":
      return "Probable";
    case "possible":
      return "Possible";
    case "unknown":
    default:
      return "Unknown";
  }
}
