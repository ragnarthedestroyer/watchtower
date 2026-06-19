import {
  createTokenMovementLiveDashboardBridge,
  type AccountHistoryResponse,
  type TokenMovementLiveDashboardBridgeOptions,
} from "@watchtower/core";

export interface TokenMovementLiveDashboardBridgePanelOptions extends TokenMovementLiveDashboardBridgeOptions {
  readonly maxWarningsPerSection?: number;
}

export function renderTokenMovementLiveDashboardBridgePanel(
  response: AccountHistoryResponse,
  options: TokenMovementLiveDashboardBridgePanelOptions = {},
): string {
  const bridge = createTokenMovementLiveDashboardBridge(response, options);
  const maxWarningsPerSection = normalizeMaxWarnings(options.maxWarningsPerSection);

  const sectionsHtml = bridge.sections.map((section) => {
    const rowsHtml = section.rows.map((row) => [
      `      <article class="detail-row" data-live-dashboard-row="${escapeHtml(row.id)}">`,
      "        <div>",
      "          <span>When</span>",
      `          <strong>${escapeHtml(row.whenLabel)}</strong>`,
      "        </div>",
      "        <div>",
      "          <span>Amount</span>",
      `          <strong>${escapeHtml(row.amount)} ${escapeHtml(row.unit)}</strong>`,
      `          <small>${escapeHtml(row.evidenceStatus)}</small>`,
      "        </div>",
      "        <div>",
      "          <span>From</span>",
      `          <code>${escapeHtml(shorten(row.from))}</code>`,
      "        </div>",
      "        <div>",
      "          <span>To</span>",
      `          <code>${escapeHtml(shorten(row.to))}</code>`,
      "        </div>",
      "        <div>",
      "          <span>Status</span>",
      `          <strong>${escapeHtml(row.decodeState)}</strong>`,
      `          <small>${escapeHtml(row.reason)}</small>`,
      "        </div>",
      "      </article>",
    ].join("\n")).join("\n");

    const warnings = section.warnings.slice(0, maxWarningsPerSection).map(
      (warning) => `        <li>${escapeHtml(warning)}</li>`,
    ).join("\n");

    return [
      `    <article class="card" data-live-dashboard-section="${section.id}">`,
      `      <span class="card-label">${escapeHtml(section.severity)}</span>`,
      `      <h3>${escapeHtml(section.title)}</h3>`,
      `      <p>${escapeHtml(section.description)}</p>`,
      `      <p><strong>${section.rows.length}</strong> live rows shown</p>`,
      rowsHtml.length > 0 ? `      <div class="detail-table">\n${rowsHtml}\n      </div>` : `      <p class="muted">${escapeHtml(section.emptyState)}</p>`,
      warnings.length > 0 ? `      <ul>\n${warnings}\n      </ul>` : "",
      "    </article>",
    ].filter(Boolean).join("\n");
  }).join("\n");

  const safetyNotes = bridge.safetyNotes.map((note) => `      <li>${escapeHtml(note)}</li>`).join("\n");

  return [
    "<section class=\"panel token-movement-live-dashboard-bridge\" data-watchtower-token-movement-live-dashboard-bridge>",
    "  <div class=\"panel-heading\">",
    "    <div>",
    "      <span class=\"card-label\">Live dashboard bridge</span>",
    `      <h2>${escapeHtml(bridge.title)}</h2>`,
    "    </div>",
    `    <span class=\"badge ${bridge.summary.status === "empty" ? "badge-warning" : "badge-success"}\">${escapeHtml(bridge.summary.status)}</span>`,
    "  </div>",
    "  <p class=\"muted\">Real live raw evidence projected into the dashboard shape. This is still not decoded token movement.</p>",
    "  <div class=\"definition-grid\">",
    `    <div><span>Account</span><code>${escapeHtml(shorten(bridge.watchedAddress))}</code></div>`,
    `    <div><span>Transactions</span><strong>${bridge.summary.transactionCount}</strong></div>`,
    `    <div><span>Messages</span><strong>${bridge.summary.messageCount}</strong></div>`,
    `    <div><span>Rows shown</span><strong>${bridge.summary.visibleRowCount}</strong></div>`,
    `    <div><span>Raw only</span><strong>${bridge.summary.rawOnlyRowCount}</strong></div>`,
    `    <div><span>Privacy</span><strong>${escapeHtml(bridge.summary.privacyMode)}</strong></div>`,
    "  </div>",
    "  <div class=\"grid grid-two\">",
    sectionsHtml,
    "  </div>",
    "  <div>",
    "    <h3>Safety notes</h3>",
    `    <ul>\n${safetyNotes}\n    </ul>`,
    "  </div>",
    "</section>",
  ].join("\n");
}

function normalizeMaxWarnings(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value)) return 3;
  return Math.max(1, Math.min(10, Math.trunc(value)));
}

function shorten(value: string): string {
  if (value.length <= 24) return value;
  return `${value.slice(0, 10)}…${value.slice(-10)}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");
}
