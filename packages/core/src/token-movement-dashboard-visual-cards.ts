/**
 * Watchtower Batch 69 — Token movement dashboard visual cards
 *
 * Turns the Batch 68 on-the-fly dashboard into card-friendly visual data
 * for Web and Telegram frontends.
 *
 * This file does not fetch chain data, persist wallet history, use browser
 * storage, use analytics, sign transactions, custody assets, operate
 * PrivateNote, trade, or decode token transfers.
 */

import type {
  TokenMovementOnTheFlyFrontendDashboard,
  TokenMovementOnTheFlyFrontendDashboardRow,
  TokenMovementOnTheFlyFrontendDashboardSection,
  TokenMovementOnTheFlyFrontendDashboardSectionId,
} from "./token-movement-on-the-fly-frontend-dashboard";

export type TokenMovementDashboardVisualCardSeverity = "ok" | "review" | "warning";

export interface TokenMovementDashboardVisualCardMetric {
  readonly label: string;
  readonly value: string;
}

export interface TokenMovementDashboardVisualCardRowPreview {
  readonly id: string;
  readonly token: string;
  readonly amount: string;
  readonly direction: string;
  readonly confidence: string;
  readonly label: string;
}

export interface TokenMovementDashboardVisualCard {
  readonly id: TokenMovementOnTheFlyFrontendDashboardSectionId;
  readonly title: string;
  readonly subtitle: string;
  readonly primaryMetric: TokenMovementDashboardVisualCardMetric;
  readonly secondaryMetrics: readonly TokenMovementDashboardVisualCardMetric[];
  readonly tokenBreakdown: readonly TokenMovementDashboardVisualCardMetric[];
  readonly severity: TokenMovementDashboardVisualCardSeverity;
  readonly rowCount: number;
  readonly unresolvedRows: number;
  readonly emptyState: string;
  readonly rowPreviews: readonly TokenMovementDashboardVisualCardRowPreview[];
  readonly privacyNote: string;
  readonly safetyNote: string;
}

export interface TokenMovementDashboardVisualCards {
  readonly title: string;
  readonly generatedAt: string;
  readonly watchedAddress: string;
  readonly mode: "on-the-fly-no-storage";
  readonly cards: readonly TokenMovementDashboardVisualCard[];
  readonly summary: {
    readonly cardCount: number;
    readonly totalRows: number;
    readonly warningCards: number;
    readonly reviewCards: number;
    readonly emptyCards: number;
  };
  readonly privacyNotes: readonly string[];
  readonly safetyNotes: readonly string[];
}

export function createTokenMovementDashboardVisualCards(
  dashboard: TokenMovementOnTheFlyFrontendDashboard,
): TokenMovementDashboardVisualCards {
  const cards = dashboard.sections.map(createVisualCardFromSection);

  return {
    title: `${dashboard.title} — visual cards`,
    generatedAt: dashboard.generatedAt,
    watchedAddress: dashboard.watchedAddress,
    mode: "on-the-fly-no-storage",
    cards,
    summary: {
      cardCount: cards.length,
      totalRows: cards.reduce((total, card) => total + card.rowCount, 0),
      warningCards: cards.filter((card) => card.severity === "warning").length,
      reviewCards: cards.filter((card) => card.severity === "review").length,
      emptyCards: cards.filter((card) => card.rowCount === 0).length,
    },
    privacyNotes: [
      "Cards are derived from the already-built in-memory dashboard only.",
      "The visual-card layer must not persist wallet movements, searched addresses, exports, or user-linked analytics.",
    ],
    safetyNotes: [
      "Visual cards are presentation helpers, not proof of final token ownership or recovery.",
      "Unresolved and contract-routed flows remain visually separated from simple direct transfers.",
      "Mining rewards remain separated from normal inbound transfers.",
    ],
  };
}

export function renderTokenMovementDashboardVisualCardsText(
  visualCards: TokenMovementDashboardVisualCards,
): string {
  const lines: string[] = [
    visualCards.title,
    `Mode: ${visualCards.mode}`,
    `Generated: ${visualCards.generatedAt}`,
    `Watched address: ${visualCards.watchedAddress}`,
    `Cards: ${visualCards.summary.cardCount}`,
    `Rows shown: ${visualCards.summary.totalRows}`,
    `Review/warning cards: ${visualCards.summary.reviewCards}/${visualCards.summary.warningCards}`,
    "",
  ];

  for (const card of visualCards.cards) {
    lines.push(`${severityIcon(card.severity)} ${card.title}`);
    lines.push(card.subtitle);
    lines.push(`${card.primaryMetric.label}: ${card.primaryMetric.value}`);

    if (card.secondaryMetrics.length > 0) {
      lines.push(card.secondaryMetrics.map((metric) => `${metric.label}: ${metric.value}`).join(" · "));
    }

    if (card.rowPreviews.length === 0) {
      lines.push(`- ${card.emptyState}`);
    } else {
      for (const row of card.rowPreviews) {
        lines.push(`- ${row.token} ${row.amount} · ${row.direction} · ${row.confidence} · ${row.label}`);
      }
    }

    lines.push(`Safety: ${card.safetyNote}`);
    lines.push("");
  }

  lines.push("Privacy:");
  for (const note of visualCards.privacyNotes) lines.push(`- ${note}`);

  return lines.join("\n");
}

function createVisualCardFromSection(
  section: TokenMovementOnTheFlyFrontendDashboardSection,
): TokenMovementDashboardVisualCard {
  return {
    id: section.id,
    title: section.title,
    subtitle: section.description,
    primaryMetric: {
      label: "Rows",
      value: String(section.totalRows),
    },
    secondaryMetrics: [
      { label: "Unresolved", value: String(section.unresolvedRows) },
      { label: "NACKL", value: String(section.tokenBreakdown.nackl) },
      { label: "SHELL", value: String(section.tokenBreakdown.shell) },
      { label: "USDC", value: String(section.tokenBreakdown.usdc) },
    ],
    tokenBreakdown: [
      { label: "NACKL", value: String(section.tokenBreakdown.nackl) },
      { label: "SHELL", value: String(section.tokenBreakdown.shell) },
      { label: "USDC", value: String(section.tokenBreakdown.usdc) },
      { label: "Other", value: String(section.tokenBreakdown.other) },
    ],
    severity: determineSectionSeverity(section),
    rowCount: section.totalRows,
    unresolvedRows: section.unresolvedRows,
    emptyState: emptyStateForSection(section.id),
    rowPreviews: section.rows.slice(0, 5).map(createRowPreview),
    privacyNote: "Rendered from the current in-memory dashboard only; do not store wallet movement history.",
    safetyNote: safetyNoteForSection(section.id),
  };
}

function createRowPreview(row: TokenMovementOnTheFlyFrontendDashboardRow): TokenMovementDashboardVisualCardRowPreview {
  return {
    id: row.id,
    token: row.token,
    amount: row.amount,
    direction: row.direction,
    confidence: row.confidence,
    label: row.reason,
  };
}

function determineSectionSeverity(
  section: TokenMovementOnTheFlyFrontendDashboardSection,
): TokenMovementDashboardVisualCardSeverity {
  if (section.id === "unresolved-or-routed" && section.totalRows > 0) return "warning";
  if (section.unresolvedRows > 0) return "review";
  if (section.rows.some((row) => row.confidence === "possible" || row.confidence === "unresolved")) return "review";
  return "ok";
}

function emptyStateForSection(sectionId: TokenMovementOnTheFlyFrontendDashboardSectionId): string {
  switch (sectionId) {
    case "nackl-mining-rewards":
      return "No NACKL mining rewards detected in the current in-memory view.";
    case "direct-transfers-in":
      return "No direct inbound NACKL, SHELL, or USDC transfers detected in the current in-memory view.";
    case "direct-transfers-out":
      return "No direct outbound NACKL, SHELL, or USDC transfers detected in the current in-memory view.";
    case "unresolved-or-routed":
      return "No unresolved, decoder-needed, accumulator, bridge, PrivateNote, DEX, or unknown routed flows detected in the current in-memory view.";
  }
}

function safetyNoteForSection(sectionId: TokenMovementOnTheFlyFrontendDashboardSectionId): string {
  switch (sectionId) {
    case "nackl-mining-rewards":
      return "Mining-looking NACKL rows are separated from ordinary inbound transfers.";
    case "direct-transfers-in":
      return "Only simple inbound transfer candidates should appear here; contract-routed rows stay out.";
    case "direct-transfers-out":
      return "Only simple outbound transfer candidates should appear here; contract-routed rows stay out.";
    case "unresolved-or-routed":
      return "These rows require review before Watchtower can call them direct transfers or resolved movements.";
  }
}

function severityIcon(severity: TokenMovementDashboardVisualCardSeverity): string {
  switch (severity) {
    case "ok":
      return "OK";
    case "review":
      return "REVIEW";
    case "warning":
      return "WARNING";
  }
}
