/**
 * Watchtower Batch 71 — Token movement dashboard drilldown foundation
 *
 * Builds deterministic, on-the-fly drilldown data from the Batch 69 visual-card
 * dashboard. This layer is for opening a selected card/filter/row in the
 * frontend without storing wallet history or searched addresses.
 *
 * This file does not fetch chain data, persist wallet history, use browser
 * storage, use analytics, sign transactions, custody assets, operate
 * PrivateNote, trade, or decode token transfers.
 */

import type {
  TokenMovementDashboardVisualCard,
  TokenMovementDashboardVisualCardRowPreview,
  TokenMovementDashboardVisualCards,
} from "./token-movement-dashboard-visual-cards";
import type { TokenMovementDashboardQuickFilterId } from "./token-movement-dashboard-quick-filters";

export type TokenMovementDashboardDrilldownMode = "on-the-fly-no-storage";
export type TokenMovementDashboardDrilldownCardId =
  | "all"
  | "nackl-mining-rewards"
  | "direct-transfers-in"
  | "direct-transfers-out"
  | "unresolved-or-routed";

export interface TokenMovementDashboardDrilldownSelection {
  readonly cardId?: TokenMovementDashboardDrilldownCardId;
  readonly filterId?: TokenMovementDashboardQuickFilterId;
  readonly rowId?: string;
  readonly maxRows?: number;
}

export interface TokenMovementDashboardDrilldownRow {
  readonly id: string;
  readonly sourceCardId: string;
  readonly sourceCardTitle: string;
  readonly token: string;
  readonly amount: string;
  readonly direction: string;
  readonly confidence: string;
  readonly label: string;
  readonly reviewStatus: "ok" | "review" | "warning";
  readonly flags: readonly string[];
  readonly safetyNote: string;
  readonly privacyNote: string;
}

export interface TokenMovementDashboardDrilldownSection {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly rowCount: number;
  readonly unresolvedRows: number;
  readonly rows: readonly TokenMovementDashboardDrilldownRow[];
  readonly emptyState: string;
  readonly safetyNote: string;
}

export interface TokenMovementDashboardDrilldown {
  readonly title: string;
  readonly generatedAt: string;
  readonly watchedAddress: string;
  readonly mode: TokenMovementDashboardDrilldownMode;
  readonly selectedCardId: string;
  readonly selectedFilterId: string;
  readonly selectedRowId: string;
  readonly sections: readonly TokenMovementDashboardDrilldownSection[];
  readonly summary: {
    readonly sectionCount: number;
    readonly rowCount: number;
    readonly reviewRows: number;
    readonly warningRows: number;
    readonly truncated: boolean;
  };
  readonly privacyNotes: readonly string[];
  readonly safetyNotes: readonly string[];
}

export function createTokenMovementDashboardDrilldown(
  visualCards: TokenMovementDashboardVisualCards,
  selection: TokenMovementDashboardDrilldownSelection = {},
): TokenMovementDashboardDrilldown {
  const selectedCardId = selection.cardId ?? "all";
  const selectedFilterId = selection.filterId ?? "none";
  const selectedRowId = selection.rowId ?? "none";
  const maxRows = normalizeMaxRows(selection.maxRows);

  const matchingCards = selectCards(visualCards.cards, selectedCardId, selection.filterId);
  const sections = matchingCards.map((card) => createDrilldownSection(card, selection.rowId, maxRows));
  const rows = sections.flatMap((section) => section.rows);

  return {
    title: `${visualCards.title} — drilldown`,
    generatedAt: visualCards.generatedAt,
    watchedAddress: visualCards.watchedAddress,
    mode: "on-the-fly-no-storage",
    selectedCardId,
    selectedFilterId,
    selectedRowId,
    sections,
    summary: {
      sectionCount: sections.length,
      rowCount: rows.length,
      reviewRows: rows.filter((row) => row.reviewStatus === "review").length,
      warningRows: rows.filter((row) => row.reviewStatus === "warning").length,
      truncated: sections.some((section) => section.rowCount > section.rows.length),
    },
    privacyNotes: [
      "Drilldown rows are derived from the current in-memory visual-card model only.",
      "Opening a card, filter, or row must not persist wallet movement history, searched addresses, UI selections, exports, or analytics.",
      "If users export or copy details, that should be an explicit user action outside the no-storage view.",
    ],
    safetyNotes: [
      "Drilldown explains why a row is shown; it does not prove final token ownership or recovery.",
      "Mining rewards remain separated from direct inbound transfers.",
      "Unresolved and contract-routed rows remain separated from simple direct transfers.",
    ],
  };
}

export function renderTokenMovementDashboardDrilldownText(
  drilldown: TokenMovementDashboardDrilldown,
): string {
  const lines: string[] = [
    drilldown.title,
    `Mode: ${drilldown.mode}`,
    `Watched address: ${drilldown.watchedAddress}`,
    `Selected card: ${drilldown.selectedCardId}`,
    `Selected filter: ${drilldown.selectedFilterId}`,
    `Selected row: ${drilldown.selectedRowId}`,
    `Rows: ${drilldown.summary.rowCount}`,
    `Review/warning rows: ${drilldown.summary.reviewRows}/${drilldown.summary.warningRows}`,
    drilldown.summary.truncated ? "Rows are truncated for preview." : "Rows are not truncated.",
    "",
  ];

  for (const section of drilldown.sections) {
    lines.push(section.title);
    lines.push(section.description);

    if (section.rows.length === 0) {
      lines.push(`- ${section.emptyState}`);
    } else {
      for (const row of section.rows) {
        lines.push(`- ${row.token} ${row.amount} · ${row.direction} · ${row.confidence} · ${row.label}`);
        if (row.flags.length > 0) lines.push(`  Flags: ${row.flags.join(", ")}`);
      }
    }

    lines.push(`Safety: ${section.safetyNote}`);
    lines.push("");
  }

  lines.push("Privacy:");
  for (const note of drilldown.privacyNotes) lines.push(`- ${note}`);

  return lines.join("\n");
}

function selectCards(
  cards: readonly TokenMovementDashboardVisualCard[],
  selectedCardId: TokenMovementDashboardDrilldownCardId,
  filterId: TokenMovementDashboardQuickFilterId | undefined,
): readonly TokenMovementDashboardVisualCard[] {
  if (selectedCardId !== "all") return cards.filter((card) => card.id === selectedCardId);

  switch (filterId) {
    case "nackl-mining-rewards":
      return cards.filter((card) => card.id === "nackl-mining-rewards");
    case "direct-transfers-in":
      return cards.filter((card) => card.id === "direct-transfers-in");
    case "direct-transfers-out":
      return cards.filter((card) => card.id === "direct-transfers-out");
    case "unresolved-or-routed":
    case "needs-review":
      return cards.filter((card) => card.id === "unresolved-or-routed" || card.unresolvedRows > 0 || card.severity !== "ok");
    case "direct-nackl":
      return filterCardsByToken(cards, "NACKL");
    case "direct-shell":
      return filterCardsByToken(cards, "SHELL");
    case "direct-usdc":
      return filterCardsByToken(cards, "USDC");
    case "all-cards":
    case undefined:
      return cards;
  }
}

function filterCardsByToken(
  cards: readonly TokenMovementDashboardVisualCard[],
  token: string,
): readonly TokenMovementDashboardVisualCard[] {
  return cards.filter(
    (card) => (card.id === "direct-transfers-in" || card.id === "direct-transfers-out")
      && card.rowPreviews.some((row) => row.token.toUpperCase() === token),
  );
}

function createDrilldownSection(
  card: TokenMovementDashboardVisualCard,
  rowId: string | undefined,
  maxRows: number,
): TokenMovementDashboardDrilldownSection {
  const selectedRows = rowId === undefined
    ? card.rowPreviews
    : card.rowPreviews.filter((row) => row.id === rowId);
  const rows = selectedRows.slice(0, maxRows).map((row) => createDrilldownRow(card, row));

  return {
    id: card.id,
    title: card.title,
    description: card.subtitle,
    rowCount: selectedRows.length,
    unresolvedRows: card.unresolvedRows,
    rows,
    emptyState: rowId === undefined ? card.emptyState : `No row with id ${rowId} is available in this in-memory card preview.`,
    safetyNote: card.safetyNote,
  };
}

function createDrilldownRow(
  card: TokenMovementDashboardVisualCard,
  row: TokenMovementDashboardVisualCardRowPreview,
): TokenMovementDashboardDrilldownRow {
  return {
    id: row.id,
    sourceCardId: card.id,
    sourceCardTitle: card.title,
    token: row.token,
    amount: row.amount,
    direction: row.direction,
    confidence: row.confidence,
    label: row.label,
    reviewStatus: rowReviewStatus(card, row),
    flags: rowFlags(card, row),
    safetyNote: card.safetyNote,
    privacyNote: "This row is an on-the-fly preview only; do not store it with wallet history or searched addresses.",
  };
}

function rowReviewStatus(
  card: TokenMovementDashboardVisualCard,
  row: TokenMovementDashboardVisualCardRowPreview,
): "ok" | "review" | "warning" {
  if (card.severity === "warning") return "warning";
  if (card.severity === "review") return "review";
  if (row.confidence.toLowerCase() === "possible" || row.confidence.toLowerCase() === "unresolved") return "review";
  return "ok";
}

function rowFlags(
  card: TokenMovementDashboardVisualCard,
  row: TokenMovementDashboardVisualCardRowPreview,
): readonly string[] {
  const flags: string[] = [];
  if (card.id === "nackl-mining-rewards") flags.push("mining-reward-section");
  if (card.id === "unresolved-or-routed") flags.push("unresolved-or-contract-routed");
  if (card.id === "direct-transfers-in") flags.push("direct-inbound-section");
  if (card.id === "direct-transfers-out") flags.push("direct-outbound-section");
  if (row.confidence.toLowerCase() === "possible" || row.confidence.toLowerCase() === "unresolved") flags.push("needs-review");
  if (row.token.toUpperCase() !== "NACKL" && row.token.toUpperCase() !== "SHELL" && row.token.toUpperCase() !== "USDC") flags.push("unknown-or-other-token");
  return flags;
}

function normalizeMaxRows(maxRows: number | undefined): number {
  if (maxRows === undefined) return 10;
  if (!Number.isFinite(maxRows)) return 10;
  const rounded = Math.floor(maxRows);
  if (rounded < 1) return 1;
  if (rounded > 50) return 50;
  return rounded;
}
