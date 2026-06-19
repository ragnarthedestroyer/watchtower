/**
 * Watchtower Batch 70 — Token movement dashboard quick filters
 *
 * Builds deterministic, on-the-fly quick-filter definitions from the Batch 69
 * visual-card dashboard. These filters are presentation controls only.
 *
 * This file does not fetch chain data, persist wallet history, use browser
 * storage, use analytics, sign transactions, custody assets, operate
 * PrivateNote, trade, or decode token transfers.
 */

import type {
  TokenMovementDashboardVisualCard,
  TokenMovementDashboardVisualCards,
  TokenMovementDashboardVisualCardSeverity,
} from "./token-movement-dashboard-visual-cards";

export type TokenMovementDashboardQuickFilterId =
  | "all-cards"
  | "nackl-mining-rewards"
  | "direct-transfers-in"
  | "direct-transfers-out"
  | "direct-nackl"
  | "direct-shell"
  | "direct-usdc"
  | "needs-review"
  | "unresolved-or-routed";

export type TokenMovementDashboardQuickFilterToken = "ALL" | "NACKL" | "SHELL" | "USDC" | "OTHER";
export type TokenMovementDashboardQuickFilterSection =
  | "ALL"
  | "nackl-mining-rewards"
  | "direct-transfers-in"
  | "direct-transfers-out"
  | "unresolved-or-routed";
export type TokenMovementDashboardQuickFilterSeverity = "ALL" | TokenMovementDashboardVisualCardSeverity;

export interface TokenMovementDashboardQuickFilter {
  readonly id: TokenMovementDashboardQuickFilterId;
  readonly label: string;
  readonly description: string;
  readonly section: TokenMovementDashboardQuickFilterSection;
  readonly token: TokenMovementDashboardQuickFilterToken;
  readonly severity: TokenMovementDashboardQuickFilterSeverity;
  readonly unresolvedOnly: boolean;
  readonly rowCount: number;
  readonly cardCount: number;
  readonly enabled: boolean;
  readonly emptyState: string;
  readonly privacyNote: string;
  readonly safetyNote: string;
}

export interface TokenMovementDashboardQuickFilters {
  readonly title: string;
  readonly generatedAt: string;
  readonly watchedAddress: string;
  readonly mode: "on-the-fly-no-storage";
  readonly filters: readonly TokenMovementDashboardQuickFilter[];
  readonly summary: {
    readonly filterCount: number;
    readonly enabledFilters: number;
    readonly totalRows: number;
    readonly unresolvedRows: number;
    readonly warningCards: number;
    readonly reviewCards: number;
  };
  readonly privacyNotes: readonly string[];
  readonly safetyNotes: readonly string[];
}

export function createTokenMovementDashboardQuickFilters(
  visualCards: TokenMovementDashboardVisualCards,
): TokenMovementDashboardQuickFilters {
  const filters: TokenMovementDashboardQuickFilter[] = [
    createAllCardsFilter(visualCards),
    createSectionFilter(
      visualCards,
      "nackl-mining-rewards",
      "NACKL mining rewards",
      "Show only NACKL reward-looking rows separated from ordinary inbound transfers.",
    ),
    createSectionFilter(
      visualCards,
      "direct-transfers-in",
      "Direct transfers in",
      "Show direct inbound NACKL, SHELL, and USDC rows only.",
    ),
    createSectionFilter(
      visualCards,
      "direct-transfers-out",
      "Direct transfers out",
      "Show direct outbound NACKL, SHELL, and USDC rows only.",
    ),
    createTokenFilter(visualCards, "NACKL", "Direct NACKL", "Show direct NACKL transfer rows without mixing mining rewards."),
    createTokenFilter(visualCards, "SHELL", "Direct SHELL", "Show direct SHELL transfer rows only."),
    createTokenFilter(visualCards, "USDC", "Direct USDC", "Show direct USDC transfer rows only."),
    createNeedsReviewFilter(visualCards),
    createSectionFilter(
      visualCards,
      "unresolved-or-routed",
      "Unresolved or contract-routed",
      "Show accumulator, bridge, PrivateNote, DEX, unknown, decoder-needed, or otherwise unresolved rows.",
    ),
  ];

  return {
    title: `${visualCards.title} — quick filters`,
    generatedAt: visualCards.generatedAt,
    watchedAddress: visualCards.watchedAddress,
    mode: "on-the-fly-no-storage",
    filters,
    summary: {
      filterCount: filters.length,
      enabledFilters: filters.filter((filter) => filter.enabled).length,
      totalRows: visualCards.summary.totalRows,
      unresolvedRows: visualCards.cards.reduce((total, card) => total + card.unresolvedRows, 0),
      warningCards: visualCards.summary.warningCards,
      reviewCards: visualCards.summary.reviewCards,
    },
    privacyNotes: [
      "Quick filters are generated from the current in-memory visual-card model only.",
      "The selected filter must remain UI state only; do not persist it with a wallet address or movement history.",
      "No browser storage, server-side history retention, searched-address storage, or wallet-linked analytics should be added here.",
    ],
    safetyNotes: [
      "Filters only change what is shown; they do not prove final token ownership or recovery.",
      "Mining rewards remain separated from direct inbound transfers.",
      "Unresolved and contract-routed rows remain separated from simple transfer rows.",
    ],
  };
}

export function renderTokenMovementDashboardQuickFiltersText(
  quickFilters: TokenMovementDashboardQuickFilters,
): string {
  const lines: string[] = [
    quickFilters.title,
    `Mode: ${quickFilters.mode}`,
    `Watched address: ${quickFilters.watchedAddress}`,
    `Filters: ${quickFilters.summary.enabledFilters}/${quickFilters.summary.filterCount} enabled`,
    `Rows: ${quickFilters.summary.totalRows}`,
    `Review/warning cards: ${quickFilters.summary.reviewCards}/${quickFilters.summary.warningCards}`,
    "",
  ];

  for (const filter of quickFilters.filters) {
    lines.push(`${filter.enabled ? "ON" : "OFF"} ${filter.label}`);
    lines.push(`Rows: ${filter.rowCount} · Cards: ${filter.cardCount}`);
    lines.push(filter.description);
    if (!filter.enabled) lines.push(`Empty: ${filter.emptyState}`);
    lines.push(`Safety: ${filter.safetyNote}`);
    lines.push("");
  }

  lines.push("Privacy:");
  for (const note of quickFilters.privacyNotes) lines.push(`- ${note}`);

  return lines.join("\n");
}

function createAllCardsFilter(
  visualCards: TokenMovementDashboardVisualCards,
): TokenMovementDashboardQuickFilter {
  return createFilter({
    id: "all-cards",
    label: "All movement cards",
    description: "Show the full on-the-fly dashboard split.",
    section: "ALL",
    token: "ALL",
    severity: "ALL",
    unresolvedOnly: false,
    rowCount: visualCards.summary.totalRows,
    cardCount: visualCards.cards.length,
    emptyState: "No movement rows are available in the current in-memory dashboard.",
    safetyNote: "All rows remain grouped by their safest current classification.",
  });
}

function createSectionFilter(
  visualCards: TokenMovementDashboardVisualCards,
  section: Exclude<TokenMovementDashboardQuickFilterSection, "ALL">,
  label: string,
  description: string,
): TokenMovementDashboardQuickFilter {
  const card = visualCards.cards.find((candidate) => candidate.id === section);
  const id = section;

  return createFilter({
    id,
    label,
    description,
    section,
    token: section === "nackl-mining-rewards" ? "NACKL" : "ALL",
    severity: "ALL",
    unresolvedOnly: section === "unresolved-or-routed",
    rowCount: card?.rowCount ?? 0,
    cardCount: card === undefined ? 0 : 1,
    emptyState: card?.emptyState ?? `No ${label.toLowerCase()} rows are available in the current in-memory dashboard.`,
    safetyNote: card?.safetyNote ?? "This filter has no matching card in the current dashboard model.",
  });
}

function createTokenFilter(
  visualCards: TokenMovementDashboardVisualCards,
  token: Exclude<TokenMovementDashboardQuickFilterToken, "ALL" | "OTHER">,
  label: string,
  description: string,
): TokenMovementDashboardQuickFilter {
  const directCards = visualCards.cards.filter(
    (card) => card.id === "direct-transfers-in" || card.id === "direct-transfers-out",
  );
  const rowCount = directCards.reduce((total, card) => total + countRowsForToken(card, token), 0);

  return createFilter({
    id: token === "NACKL" ? "direct-nackl" : token === "SHELL" ? "direct-shell" : "direct-usdc",
    label,
    description,
    section: "ALL",
    token,
    severity: "ALL",
    unresolvedOnly: false,
    rowCount,
    cardCount: directCards.filter((card) => countRowsForToken(card, token) > 0).length,
    emptyState: `No direct ${token} transfer rows are available in the current in-memory dashboard.`,
    safetyNote: token === "NACKL"
      ? "Direct NACKL excludes mining rewards; mining rewards stay in their own section."
      : `Only direct ${token} transfer rows should be shown; routed or unresolved rows stay out.`,
  });
}

function createNeedsReviewFilter(
  visualCards: TokenMovementDashboardVisualCards,
): TokenMovementDashboardQuickFilter {
  const reviewCards = visualCards.cards.filter(
    (card) => card.severity === "review" || card.severity === "warning" || card.unresolvedRows > 0,
  );
  const rowCount = reviewCards.reduce((total, card) => total + card.rowCount, 0);

  return createFilter({
    id: "needs-review",
    label: "Needs review",
    description: "Show cards with unresolved, warning, or review status.",
    section: "ALL",
    token: "ALL",
    severity: "review",
    unresolvedOnly: true,
    rowCount,
    cardCount: reviewCards.length,
    emptyState: "No review or warning rows are available in the current in-memory dashboard.",
    safetyNote: "Review rows should not be shown as confirmed direct transfers until evidence improves.",
  });
}

function createFilter(input: Omit<TokenMovementDashboardQuickFilter, "enabled" | "privacyNote">): TokenMovementDashboardQuickFilter {
  return {
    ...input,
    enabled: input.rowCount > 0,
    privacyNote: "Filter state is on-the-fly UI state only; do not store it with wallet movement data.",
  };
}

function countRowsForToken(card: TokenMovementDashboardVisualCard, token: Exclude<TokenMovementDashboardQuickFilterToken, "ALL" | "OTHER">): number {
  return card.rowPreviews.filter((row) => row.token.toUpperCase() === token).length;
}
