import {
  createTokenMovementDashboardDrilldown,
  type TokenMovementDashboardDrilldownSelection,
  type TokenMovementDashboardVisualCards,
} from "@watchtower/core";

export function renderTokenMovementDashboardDrilldownPanel(
  visualCards: TokenMovementDashboardVisualCards,
  selection: TokenMovementDashboardDrilldownSelection = {},
): string {
  const drilldown = createTokenMovementDashboardDrilldown(visualCards, selection);

  return [
    '<section data-watchtower-token-movement-drilldown data-mode="on-the-fly-no-storage">',
    `  <h2>${escapeHtml(drilldown.title)}</h2>`,
    `  <p>Selected card: ${escapeHtml(drilldown.selectedCardId)} · Selected filter: ${escapeHtml(drilldown.selectedFilterId)}</p>`,
    `  <p>Rows: ${drilldown.summary.rowCount} · Review: ${drilldown.summary.reviewRows} · Warning: ${drilldown.summary.warningRows}</p>`,
    drilldown.summary.truncated ? "  <p>Preview is truncated. Use export only through explicit user action.</p>" : "",
    ...drilldown.sections.map((section) => [
      `  <article data-section="${escapeHtml(section.id)}">`,
      `    <h3>${escapeHtml(section.title)}</h3>`,
      `    <p>${escapeHtml(section.description)}</p>`,
      section.rows.length === 0
        ? `    <p>${escapeHtml(section.emptyState)}</p>`
        : [
            "    <ul>",
            ...section.rows.map((row) => [
              "      <li>",
              `        <strong>${escapeHtml(row.token)} ${escapeHtml(row.amount)}</strong>`,
              `        <span>${escapeHtml(row.direction)} · ${escapeHtml(row.confidence)} · ${escapeHtml(row.label)}</span>`,
              row.flags.length > 0 ? `        <small>Flags: ${escapeHtml(row.flags.join(", "))}</small>` : "",
              "      </li>",
            ].join("\n")),
            "    </ul>",
          ].join("\n"),
      `    <p><strong>Safety:</strong> ${escapeHtml(section.safetyNote)}</p>`,
      "  </article>",
    ].join("\n")),
    "  <p><strong>Privacy:</strong> drilldown state is on-the-fly UI state only; do not store it with wallet movement history.</p>",
    "</section>",
  ].filter((line) => line.length > 0).join("\n");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");
}
