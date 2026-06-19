import {
  createTokenMovementFrontendDashboard,
  type TokenMovement,
  type TokenMovementFrontendDashboard,
  type TokenMovementFrontendDashboardOptions,
  type TokenMovementFrontendDashboardRow,
  type TokenMovementFrontendDashboardSection,
} from "@watchtower/core";

export interface TokenMovementDashboardSectionsPanelOptions extends TokenMovementFrontendDashboardOptions {
  readonly headingLevel?: 2 | 3;
}

export function renderTokenMovementDashboardSectionsPanel(
  movements: readonly TokenMovement[],
  options: TokenMovementDashboardSectionsPanelOptions = {},
): string {
  const dashboard = createTokenMovementFrontendDashboard(movements, options);
  return renderTokenMovementDashboard(dashboard, options.headingLevel ?? 2);
}

export function renderTokenMovementDashboard(dashboard: TokenMovementFrontendDashboard, headingLevel: 2 | 3 = 2): string {
  const headingTag = headingLevel === 3 ? "h3" : "h2";
  const sectionHeadingTag = headingLevel === 3 ? "h4" : "h3";

  return [
    "<section data-watchtower-token-movement-dashboard>",
    `  <${headingTag}>${escapeHtml(dashboard.title)}</${headingTag}>`,
    `  <p>${escapeHtml(dashboard.privacy.notice)}</p>`,
    renderTotals(dashboard),
    ...dashboard.warnings.map((warning) => `  <p data-watchtower-warning>${escapeHtml(warning)}</p>`),
    ...dashboard.sections.map((section) => renderSection(section, sectionHeadingTag)),
    "</section>",
  ].join("\n");
}

function renderTotals(dashboard: TokenMovementFrontendDashboard): string {
  return [
    "  <dl data-watchtower-token-movement-dashboard-totals>",
    `    <div><dt>NACKL mining rewards</dt><dd>${dashboard.totals.nacklMiningRewards}</dd></div>`,
    `    <div><dt>Direct transfers in</dt><dd>${dashboard.totals.directTransfersIn}</dd></div>`,
    `    <div><dt>Direct transfers out</dt><dd>${dashboard.totals.directTransfersOut}</dd></div>`,
    `    <div><dt>Review / other</dt><dd>${dashboard.totals.otherOrNeedsReview}</dd></div>`,
    `    <div><dt>Needs review</dt><dd>${dashboard.totals.needsReviewRows}</dd></div>`,
    "  </dl>",
  ].join("\n");
}

function renderSection(section: TokenMovementFrontendDashboardSection, headingTag: "h3" | "h4"): string {
  const rows = section.rows.length === 0
    ? [`    <p>${escapeHtml(section.emptyState)}</p>`]
    : section.rows.map(renderRow);

  return [
    `  <section data-watchtower-token-movement-section="${escapeHtml(section.id)}" data-watchtower-visual-kind="${escapeHtml(section.visualKind)}">`,
    `    <${headingTag}>${escapeHtml(section.title)}</${headingTag}>`,
    `    <p>${escapeHtml(section.description)}</p>`,
    ...section.warnings.map((warning) => `    <p data-watchtower-warning>${escapeHtml(warning)}</p>`),
    ...rows,
    "  </section>",
  ].join("\n");
}

function renderRow(row: TokenMovementFrontendDashboardRow): string {
  const warningText = row.warnings.length > 0 ? row.warnings.join(" · ") : "No row warning.";
  return [
    `    <article data-watchtower-movement-row="${escapeHtml(row.id)}" data-watchtower-proof-status="${escapeHtml(row.proofStatus)}">`,
    `      <strong>${escapeHtml(row.amountLabel)}</strong>`,
    `      <span>${escapeHtml(row.observedAtLabel)}</span>`,
    `      <span>${escapeHtml(row.routeLabel)}</span>`,
    `      <span>${escapeHtml(row.confidenceLabel)}${row.needsReview ? " · needs review" : ""}</span>`,
    `      <p>${escapeHtml(row.likelyAction)}</p>`,
    `      <small>${escapeHtml(warningText)}</small>`,
    "    </article>",
  ].join("\n");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");
}
