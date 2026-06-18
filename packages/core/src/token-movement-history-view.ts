/**
 * Watchtower Batch 55 — Web token movement history panel view model
 *
 * Converts conservative TokenMovementHistory data into a web-friendly panel
 * model. This file does not fetch chain data, sign, broadcast, custody assets,
 * mutate wallets, or claim that candidate movements are confirmed.
 */

import type {
  TokenMovement,
  TokenMovementConfidence,
  TokenMovementDirection,
  TokenMovementHistory,
} from "./token-movement";
import { movementNeedsReview, TOKEN_MOVEMENT_RESEARCH_FIXTURES } from "./token-movement";

export type TokenMovementHistoryPanelTone = "ok" | "warning" | "danger" | "muted";

export type TokenMovementHistoryPanelFilter = {
  tokenSymbol?: string | null;
  direction?: TokenMovementDirection | "all" | null;
  proofStatus?: TokenMovementConfidence | "all" | null;
  showOnlyNeedsReview?: boolean;
  search?: string | null;
};

export type TokenMovementHistoryPanelRow = {
  id: string;
  observedAt: string | null;
  observedAtLabel: string;
  direction: TokenMovementDirection;
  directionLabel: string;
  tokenSymbol: string;
  tokenFamily: string;
  amountLabel: string;
  fromLabel: string;
  fromAddress: string | null;
  toLabel: string;
  toAddress: string | null;
  viaLabel: string | null;
  proofStatus: TokenMovementConfidence;
  proofTone: TokenMovementHistoryPanelTone;
  likelyAction: string;
  summary: string;
  uncertaintyCount: number;
  highUncertaintyCount: number;
  warningCount: number;
  needsReview: boolean;
  tags: string[];
};

export type TokenMovementHistoryPanelSummary = {
  totalMovements: number;
  visibleMovements: number;
  confirmedMovements: number;
  candidateMovements: number;
  needsReview: number;
  unknownTokenMovements: number;
  byToken: Record<string, number>;
  byDirection: Record<TokenMovementDirection, number>;
  byProofStatus: Record<TokenMovementConfidence, number>;
  topWarnings: string[];
};

export type TokenMovementHistoryViewModel = {
  title: string;
  subjectLabel: string;
  subjectAddress: string | null;
  generatedAt: string;
  safetyBanner: string;
  rows: TokenMovementHistoryPanelRow[];
  summary: TokenMovementHistoryPanelSummary;
  emptyState: string | null;
  warnings: string[];
};

const DEFAULT_SAFETY_BANNER =
  "Read-only token movement history. Candidate rows are not proof unless marked confirmed.";

function formatObservedAt(value: string | null): string {
  if (!value) return "Unknown time";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toISOString().replace("T", " ").replace(".000Z", " UTC");
}

function formatAmount(movement: TokenMovement): string {
  const value = movement.amount.display ?? movement.amount.raw ?? "unknown amount";
  const unit = movement.amount.unit || movement.token.symbol || movement.token.family;
  return `${value} ${unit}`.trim();
}

function partyLabel(label: string | null, address: string | null): string {
  return label ?? address ?? "Unknown";
}

function directionLabel(direction: TokenMovementDirection): string {
  switch (direction) {
    case "incoming":
      return "Incoming";
    case "outgoing":
      return "Outgoing";
    case "internal":
      return "Internal";
    case "unknown":
    default:
      return "Unknown";
  }
}

function proofTone(status: TokenMovementConfidence): TokenMovementHistoryPanelTone {
  switch (status) {
    case "confirmed":
      return "ok";
    case "probable":
    case "possible":
      return "warning";
    case "unknown":
    default:
      return "danger";
  }
}

function rowSearchText(row: TokenMovementHistoryPanelRow): string {
  return [
    row.id,
    row.tokenSymbol,
    row.tokenFamily,
    row.amountLabel,
    row.fromLabel,
    row.fromAddress,
    row.toLabel,
    row.toAddress,
    row.viaLabel,
    row.proofStatus,
    row.likelyAction,
    row.summary,
    ...row.tags,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function tokenMovementToPanelRow(movement: TokenMovement): TokenMovementHistoryPanelRow {
  const highUncertaintyCount = movement.uncertainty.filter((item) => item.severity === "high").length;
  const tokenSymbol = movement.token.symbol || movement.token.family || "UNKNOWN";

  return {
    id: movement.id,
    observedAt: movement.observedAt,
    observedAtLabel: formatObservedAt(movement.observedAt),
    direction: movement.direction,
    directionLabel: directionLabel(movement.direction),
    tokenSymbol,
    tokenFamily: movement.token.family,
    amountLabel: formatAmount(movement),
    fromLabel: partyLabel(movement.from.label, movement.from.address),
    fromAddress: movement.from.address,
    toLabel: partyLabel(movement.to.label, movement.to.address),
    toAddress: movement.to.address,
    viaLabel: movement.via ? partyLabel(movement.via.label, movement.via.address) : null,
    proofStatus: movement.proofStatus,
    proofTone: proofTone(movement.proofStatus),
    likelyAction: movement.likelyAction,
    summary: movement.summary,
    uncertaintyCount: movement.uncertainty.length,
    highUncertaintyCount,
    warningCount: movement.warnings.length,
    needsReview: movementNeedsReview(movement),
    tags: movement.tags,
  };
}

export function filterTokenMovementPanelRows(
  rows: TokenMovementHistoryPanelRow[],
  filter: TokenMovementHistoryPanelFilter = {},
): TokenMovementHistoryPanelRow[] {
  const tokenSymbol = filter.tokenSymbol?.trim().toUpperCase() ?? null;
  const direction = filter.direction && filter.direction !== "all" ? filter.direction : null;
  const proofStatus = filter.proofStatus && filter.proofStatus !== "all" ? filter.proofStatus : null;
  const search = filter.search?.trim().toLowerCase() ?? null;

  return rows.filter((row) => {
    if (tokenSymbol && row.tokenSymbol.toUpperCase() !== tokenSymbol) return false;
    if (direction && row.direction !== direction) return false;
    if (proofStatus && row.proofStatus !== proofStatus) return false;
    if (filter.showOnlyNeedsReview && !row.needsReview) return false;
    if (search && !rowSearchText(row).includes(search)) return false;
    return true;
  });
}

export function summarizeTokenMovementPanelRows(
  allRows: TokenMovementHistoryPanelRow[],
  visibleRows: TokenMovementHistoryPanelRow[],
  warnings: string[],
): TokenMovementHistoryPanelSummary {
  const byToken: Record<string, number> = {};
  const byDirection: Record<TokenMovementDirection, number> = {
    incoming: 0,
    outgoing: 0,
    internal: 0,
    unknown: 0,
  };
  const byProofStatus: Record<TokenMovementConfidence, number> = {
    confirmed: 0,
    probable: 0,
    possible: 0,
    unknown: 0,
  };

  for (const row of visibleRows) {
    byToken[row.tokenSymbol] = (byToken[row.tokenSymbol] ?? 0) + 1;
    byDirection[row.direction] += 1;
    byProofStatus[row.proofStatus] += 1;
  }

  return {
    totalMovements: allRows.length,
    visibleMovements: visibleRows.length,
    confirmedMovements: visibleRows.filter((row) => row.proofStatus === "confirmed").length,
    candidateMovements: visibleRows.filter((row) => row.proofStatus !== "confirmed").length,
    needsReview: visibleRows.filter((row) => row.needsReview).length,
    unknownTokenMovements: visibleRows.filter((row) => row.tokenFamily === "UNKNOWN").length,
    byToken,
    byDirection,
    byProofStatus,
    topWarnings: warnings.slice(0, 5),
  };
}

export function buildTokenMovementHistoryViewModel(
  history: TokenMovementHistory,
  filter: TokenMovementHistoryPanelFilter = {},
): TokenMovementHistoryViewModel {
  const rows = history.movements.map(tokenMovementToPanelRow);
  const visibleRows = filterTokenMovementPanelRows(rows, filter);
  const subjectLabel = history.subject.label ?? history.subject.address ?? "Watched account";
  const warnings = [DEFAULT_SAFETY_BANNER, ...history.warnings].filter(
    (item, index, all) => all.indexOf(item) === index,
  );

  return {
    title: "Token Movement History",
    subjectLabel,
    subjectAddress: history.subject.address,
    generatedAt: history.generatedAt,
    safetyBanner: DEFAULT_SAFETY_BANNER,
    rows: visibleRows,
    summary: summarizeTokenMovementPanelRows(rows, visibleRows, warnings),
    emptyState: visibleRows.length === 0 ? "No token movement candidates match the current filter." : null,
    warnings,
  };
}

export function createTokenMovementHistoryPanelFixture(): TokenMovementHistoryViewModel {
  return buildTokenMovementHistoryViewModel({
    subject: {
      address: null,
      label: "Research fixture account",
      role: "wallet",
      dappId: null,
      accountId: null,
    },
    generatedAt: new Date().toISOString(),
    movements: TOKEN_MOVEMENT_RESEARCH_FIXTURES,
    warnings: [
      "Fixture data only. Do not present these rows as confirmed chain history.",
      "The SHELL accumulator incident remains unresolved until real transactions are attached.",
    ],
  });
}
