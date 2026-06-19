import {
  classifyTokenMovementsForMiningRewardDashboard,
  type MiningRewardClassifierSourceLike,
} from "@watchtower/core";

export interface TokenMovementMiningRewardClassifierPanelOptions {
  readonly title?: string;
}

export function renderTokenMovementMiningRewardClassifierPanel(
  records: readonly MiningRewardClassifierSourceLike[],
  options: TokenMovementMiningRewardClassifierPanelOptions = {},
): string {
  const dashboard = classifyTokenMovementsForMiningRewardDashboard(records);

  return [
    '<section data-watchtower-token-movement-mining-reward-classifier data-mode="on-the-fly-no-storage">',
    `  <h2>${escapeHtml(options.title ?? "Token movement visual classification")}</h2>`,
    "  <p>Read-only, on-the-fly dashboard split. No wallet movement history should be stored.</p>",
    `  <p>Total: ${dashboard.summary.totalRows} · Mining rewards: ${dashboard.summary.miningRewardRows} · In: ${dashboard.summary.directTransferInRows} · Out: ${dashboard.summary.directTransferOutRows} · Unresolved: ${dashboard.summary.unresolvedOrContractRoutedRows}</p>`,
    ...dashboard.sections.map((section) => [
      `  <article data-section="${escapeHtml(section.id)}">`,
      `    <h3>${escapeHtml(section.title)}</h3>`,
      `    <p>${escapeHtml(section.description)}</p>`,
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
