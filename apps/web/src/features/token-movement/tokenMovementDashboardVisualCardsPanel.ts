import {
  createTokenMovementDashboardVisualCards,
  type TokenMovementOnTheFlyFrontendDashboard,
} from "@watchtower/core";

export function renderTokenMovementDashboardVisualCardsPanel(
  dashboard: TokenMovementOnTheFlyFrontendDashboard,
): string {
  const visualCards = createTokenMovementDashboardVisualCards(dashboard);

  return [
    '<section data-watchtower-token-movement-visual-cards data-mode="on-the-fly-no-storage">',
    `  <h2>${escapeHtml(visualCards.title)}</h2>`,
    "  <p>Visual split for NACKL mining rewards, direct transfers in, direct transfers out, and unresolved/contract-routed flows.</p>",
    `  <p>Cards: ${visualCards.summary.cardCount} · Rows: ${visualCards.summary.totalRows} · Review: ${visualCards.summary.reviewCards} · Warning: ${visualCards.summary.warningCards}</p>`,
    ...visualCards.cards.map((card) => [
      `  <article data-card="${escapeHtml(card.id)}" data-severity="${escapeHtml(card.severity)}">`,
      `    <h3>${escapeHtml(card.title)}</h3>`,
      `    <p>${escapeHtml(card.subtitle)}</p>`,
      `    <p>${escapeHtml(card.primaryMetric.label)}: ${escapeHtml(card.primaryMetric.value)} · Unresolved: ${card.unresolvedRows}</p>`,
      "    <p>",
      `      NACKL: ${metricValue(card.tokenBreakdown, "NACKL")} · SHELL: ${metricValue(card.tokenBreakdown, "SHELL")} · USDC: ${metricValue(card.tokenBreakdown, "USDC")} · Other: ${metricValue(card.tokenBreakdown, "Other")}`,
      "    </p>",
      "    <ul>",
      ...(card.rowPreviews.length === 0
        ? [`      <li>${escapeHtml(card.emptyState)}</li>`]
        : card.rowPreviews.map((row) => `      <li>${escapeHtml(row.token)} ${escapeHtml(row.amount)} · ${escapeHtml(row.direction)} · ${escapeHtml(row.confidence)} · ${escapeHtml(row.label)}</li>`)),
      "    </ul>",
      `    <p><strong>Safety:</strong> ${escapeHtml(card.safetyNote)}</p>`,
      "  </article>",
    ].join("\n")),
    "</section>",
  ].join("\n");
}

function metricValue(metrics: readonly { readonly label: string; readonly value: string }[], label: string): string {
  return metrics.find((metric) => metric.label === label)?.value ?? "0";
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");
}
