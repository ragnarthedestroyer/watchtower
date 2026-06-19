import {
  createTokenMovementLiveRawHistoryView,
  type AccountHistoryResponse,
  type TokenMovementLiveRawHistoryViewOptions,
} from "@watchtower/core";

export interface TokenMovementLiveRawHistoryPanelOptions extends TokenMovementLiveRawHistoryViewOptions {
  readonly maxWarnings?: number;
}

export function renderTokenMovementLiveRawHistoryPanel(
  response: AccountHistoryResponse,
  options: TokenMovementLiveRawHistoryPanelOptions = {},
): string {
  const view = createTokenMovementLiveRawHistoryView(response, options);
  const maxWarnings = normalizeMaxWarnings(options.maxWarnings);

  const rows = view.rows.map((row) => [
    `      <article class="detail-row" data-token-movement-live-raw-row="${escapeHtml(row.id)}">`,
    "        <div>",
    "          <span>When</span>",
    `          <strong>${escapeHtml(row.whenLabel)}</strong>`,
    "        </div>",
    "        <div>",
    "          <span>Hash / LT</span>",
    `          <code>${escapeHtml(shorten(row.hash))}</code>`,
    `          <small>${escapeHtml(row.logicalTime)}</small>`,
    "        </div>",
    "        <div>",
    "          <span>Inbound</span>",
    row.inboundMessage
      ? `          <strong>${escapeHtml(row.inboundMessage.amount)} ${escapeHtml(row.inboundMessage.unit)}</strong>`
      : "          <span class=\"muted\">none observed</span>",
    "        </div>",
    "        <div>",
    "          <span>Outbound</span>",
    `          <strong>${row.outboundMessages.length}</strong>`,
    "        </div>",
    "        <div>",
    "          <span>Status</span>",
    `          <strong>${escapeHtml(row.safety)}</strong>`,
    `          <small>${escapeHtml(row.decodeState)}</small>`,
    "        </div>",
    "      </article>",
  ].join("\n")).join("\n");

  const warnings = view.warnings.slice(0, maxWarnings).map(
    (warning) => `        <li>${escapeHtml(warning)}</li>`,
  ).join("\n");

  const safetyNotes = view.safetyNotes.map(
    (note) => `        <li>${escapeHtml(note)}</li>`,
  ).join("\n");

  return [
    "<section class=\"panel token-movement-live-raw-history\" data-watchtower-token-movement-live-raw-history>",
    "  <div class=\"panel-heading\">",
    "    <div>",
    "      <span class=\"card-label\">Live raw evidence</span>",
    `      <h2>${escapeHtml(view.title)}</h2>`,
    "    </div>",
    `    <span class=\"badge ${view.summary.status === "empty" ? "badge-warning" : "badge-success"}\">${escapeHtml(view.summary.status)}</span>`,
    "  </div>",
    "  <p class=\"muted\">Live, read-only, on-the-fly transaction/message evidence. This is not decoded token movement yet.</p>",
    "  <div class=\"definition-grid\">",
    `    <div><span>Account</span><code>${escapeHtml(shorten(view.watchedAddress))}</code></div>`,
    `    <div><span>Transactions</span><strong>${view.summary.transactionCount}</strong></div>`,
    `    <div><span>Inbound messages</span><strong>${view.summary.inboundMessageCount}</strong></div>`,
    `    <div><span>Outbound messages</span><strong>${view.summary.outboundMessageCount}</strong></div>`,
    `    <div><span>Raw/not decoded</span><strong>${view.summary.rawOnlyTransactionCount}</strong></div>`,
    `    <div><span>Warnings</span><strong>${view.summary.warningCount}</strong></div>`,
    "  </div>",
    "  <div class=\"detail-table\">",
    rows.length > 0 ? rows : "    <p class=\"muted\">No live raw transactions were extracted for this request.</p>",
    "  </div>",
    "  <div class=\"split-list\">",
    "    <div>",
    "      <h3>Warnings</h3>",
    warnings.length > 0 ? `      <ul>\n${warnings}\n      </ul>` : "      <p class=\"muted\">No route warnings returned.</p>",
    "    </div>",
    "    <div>",
    "      <h3>Safety notes</h3>",
    `      <ul>\n${safetyNotes}\n      </ul>`,
    "    </div>",
    "  </div>",
    "</section>",
  ].join("\n");
}

function normalizeMaxWarnings(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value)) return 8;
  return Math.max(1, Math.min(25, Math.trunc(value)));
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
