import {
  classifyDirectTransfersForDashboard,
  type DirectTransferClassifierSourceLike,
} from "@watchtower/core";

export interface TokenMovementDirectTransferClassifierPanelOptions {
  readonly title?: string;
}

export function renderTokenMovementDirectTransferClassifierPanel(
  records: readonly DirectTransferClassifierSourceLike[],
  options: TokenMovementDirectTransferClassifierPanelOptions = {},
): string {
  const dashboard = classifyDirectTransfersForDashboard(records);

  return [
    '<section data-watchtower-token-movement-direct-transfer-classifier data-mode="on-the-fly-no-storage">',
    `  <h2>${escapeHtml(options.title ?? "Direct transfer classification")}</h2>`,
    "  <p>Read-only, on-the-fly split for NACKL, SHELL, and USDC direct transfers. Nothing in this panel should be persisted.</p>",
    `  <p>NACKL in/out: ${dashboard.summary.directNacklInRows}/${dashboard.summary.directNacklOutRows} · SHELL in/out: ${dashboard.summary.directShellInRows}/${dashboard.summary.directShellOutRows} · USDC in/out: ${dashboard.summary.directUsdcInRows}/${dashboard.summary.directUsdcOutRows} · Excluded: ${dashboard.summary.excludedRows}</p>`,
    ...dashboard.sections.map((section) => [
      `  <article data-section="${escapeHtml(section.id)}">`,
      `    <h3>${escapeHtml(section.title)}</h3>`,
      `    <p>${escapeHtml(section.description)}</p>`,
      "    <ul>",
      ...(section.rows.length === 0
        ? ["      <li>No rows in this section.</li>"]
        : section.rows.map((row) => `      <li>${escapeHtml(row.asset)} ${escapeHtml(row.amount)} · ${escapeHtml(row.direction)} · ${escapeHtml(row.confidence)} · ${escapeHtml(row.reason)}</li>`)),
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
