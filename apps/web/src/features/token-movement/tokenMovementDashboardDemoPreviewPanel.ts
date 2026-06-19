import {
  createTokenMovementDashboardDemoPreview,
  renderTokenMovementDashboardDemoPreviewText,
  type TokenMovementDashboardDemoPreviewOptions,
} from "@watchtower/core";

export interface TokenMovementDashboardDemoPreviewPanelOptions extends TokenMovementDashboardDemoPreviewOptions {
  readonly showRawText?: boolean;
}

export function renderTokenMovementDashboardDemoPreviewPanel(
  options: TokenMovementDashboardDemoPreviewPanelOptions = {},
): string {
  const preview = createTokenMovementDashboardDemoPreview({
    title: options.title ?? "Watchtower token movement dashboard demo preview",
    generatedAt: options.generatedAt ?? new Date(0).toISOString(),
    watchedAddress: options.watchedAddress ?? "demo-wallet-address",
  });
  const rawText = options.showRawText === true ? renderTokenMovementDashboardDemoPreviewText(preview) : "";

  const cardHtml = preview.visualCards.cards.map((card) => [
    `    <article data-watchtower-demo-card="${escapeHtml(card.id)}">`,
    `      <h3>${escapeHtml(card.title)}</h3>`,
    `      <p>${escapeHtml(card.subtitle)}</p>`,
    `      <p><strong>${escapeHtml(card.primaryMetric.label)}:</strong> ${escapeHtml(card.primaryMetric.value)}</p>`,
    `      <p>Severity: ${escapeHtml(card.severity)} · Unresolved: ${card.unresolvedRows}</p>`,
    "    </article>",
  ].join("\n")).join("\n");

  return [
    "<section data-watchtower-token-movement-demo-preview>",
    `  <h2>${escapeHtml(preview.title)}</h2>`,
    `  <p>Mode: ${escapeHtml(preview.mode)} · Synthetic rows: ${preview.records.length}</p>`,
    "  <p>This preview uses deterministic demo data only. It exists so UI/UX can be reviewed before live token movement reads are connected.</p>",
    "  <div data-watchtower-demo-cards>",
    cardHtml,
    "  </div>",
    "  <ul>",
    ...preview.checklist.map((item) => `    <li><strong>${escapeHtml(item.label)}:</strong> ${escapeHtml(item.status)} — ${escapeHtml(item.note)}</li>`),
    "  </ul>",
    rawText.length > 0 ? `  <pre>${escapeHtml(rawText)}</pre>` : "",
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
