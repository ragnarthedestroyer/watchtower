import {
  createOnTheFlyTokenMovementFrontendDashboard,
  type TokenMovementOnTheFlyFrontendDashboardOptions,
  type TokenMovementOnTheFlyFrontendDashboardSourceLike,
} from "@watchtower/core";

export interface TokenMovementOnTheFlyFrontendDashboardPanelOptions {
  readonly title?: string;
  readonly watchedAddress?: string;
}

export function renderTokenMovementOnTheFlyFrontendDashboardPanel(
  records: readonly TokenMovementOnTheFlyFrontendDashboardSourceLike[],
  options: TokenMovementOnTheFlyFrontendDashboardPanelOptions = {},
): string {
  const dashboardOptions: TokenMovementOnTheFlyFrontendDashboardOptions = {
    title: options.title ?? "Token movement dashboard",
    watchedAddress: options.watchedAddress ?? "not provided",
  };
  const dashboard = createOnTheFlyTokenMovementFrontendDashboard(records, dashboardOptions);

  return [
    '<section data-watchtower-token-movement-dashboard data-mode="on-the-fly-no-storage">',
    `  <h2>${escapeHtml(dashboard.title)}</h2>`,
    "  <p>Read-only, on-the-fly token movement dashboard. No wallet history should be persisted.</p>",
    `  <p>Mining rewards: ${dashboard.summary.nacklMiningRewardRows} · Transfers in: ${dashboard.summary.directTransferInRows} · Transfers out: ${dashboard.summary.directTransferOutRows} · Unresolved/routed: ${dashboard.summary.unresolvedOrRoutedRows}</p>`,
    "  <dl>",
    `    <dt>NACKL direct in/out</dt><dd>${dashboard.summary.nacklDirectInRows}/${dashboard.summary.nacklDirectOutRows}</dd>`,
    `    <dt>SHELL direct in/out</dt><dd>${dashboard.summary.shellDirectInRows}/${dashboard.summary.shellDirectOutRows}</dd>`,
    `    <dt>USDC direct in/out</dt><dd>${dashboard.summary.usdcDirectInRows}/${dashboard.summary.usdcDirectOutRows}</dd>`,
    "  </dl>",
    ...dashboard.sections.map((section) => [
      `  <article data-section="${escapeHtml(section.id)}">`,
      `    <h3>${escapeHtml(section.title)}</h3>`,
      `    <p>${escapeHtml(section.description)}</p>`,
      `    <p>NACKL: ${section.tokenBreakdown.nackl} · SHELL: ${section.tokenBreakdown.shell} · USDC: ${section.tokenBreakdown.usdc} · Other: ${section.tokenBreakdown.other}</p>`,
      "    <ul>",
      ...(section.rows.length === 0
        ? ["      <li>No rows in this section.</li>"]
        : section.rows.map((row) => `      <li>${escapeHtml(row.token)} ${escapeHtml(row.amount)} · ${escapeHtml(row.direction)} · ${escapeHtml(row.confidence)} · ${escapeHtml(row.reason)}</li>`)),
      "    </ul>",
      "  </article>",
    ].join("\n")),
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
