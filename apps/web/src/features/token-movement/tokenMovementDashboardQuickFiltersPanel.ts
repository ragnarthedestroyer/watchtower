import {
  createTokenMovementDashboardQuickFilters,
  type TokenMovementDashboardVisualCards,
} from "@watchtower/core";

export function renderTokenMovementDashboardQuickFiltersPanel(
  visualCards: TokenMovementDashboardVisualCards,
): string {
  const quickFilters = createTokenMovementDashboardQuickFilters(visualCards);

  return [
    '<section data-watchtower-token-movement-quick-filters data-mode="on-the-fly-no-storage">',
    `  <h2>${escapeHtml(quickFilters.title)}</h2>`,
    "  <p>On-the-fly filters for mining rewards, direct transfers in, direct transfers out, and unresolved routed flows.</p>",
    `  <p>Enabled filters: ${quickFilters.summary.enabledFilters}/${quickFilters.summary.filterCount} · Rows: ${quickFilters.summary.totalRows}</p>`,
    "  <div role=\"list\">",
    ...quickFilters.filters.map((filter) => [
      `    <button type=\"button\" data-filter=\"${escapeHtml(filter.id)}\" data-enabled=\"${filter.enabled ? "true" : "false"}\">`,
      `      ${escapeHtml(filter.label)} (${filter.rowCount})`,
      "    </button>",
      `    <p>${escapeHtml(filter.description)}</p>`,
    ].join("\n")),
    "  </div>",
    "  <p><strong>Privacy:</strong> filter state is local UI state only; do not store it with wallet movement history.</p>",
    "</section>",
  ].join("\n");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");
}
