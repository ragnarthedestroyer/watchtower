import {
  createTokenMovementDashboardVisibleDemoEntry,
  type TokenMovementDashboardVisibleDemoEntryOptions,
} from "@watchtower/core";

export interface TokenMovementDashboardVisibleDemoEntryPanelOptions extends TokenMovementDashboardVisibleDemoEntryOptions {
  readonly maxTimelineRows?: number;
}

export function renderTokenMovementDashboardVisibleDemoEntryPanel(
  options: TokenMovementDashboardVisibleDemoEntryPanelOptions = {},
): string {
  const entry = createTokenMovementDashboardVisibleDemoEntry({
    ...(options.title === undefined ? {} : { title: options.title }),
    ...(options.generatedAt === undefined ? {} : { generatedAt: options.generatedAt }),
    ...(options.watchedAddress === undefined ? {} : { watchedAddress: options.watchedAddress }),
  });
  const maxTimelineRows = normalizeMaxTimelineRows(options.maxTimelineRows);

  const cards = entry.preview.visualCards.cards.map((card) => [
    `      <article class="card token-movement-visible-card" data-token-movement-card="${escapeHtml(card.id)}">`,
    `        <span class="card-label">${escapeHtml(card.severity)}</span>`,
    `        <h3>${escapeHtml(card.title)}</h3>`,
    `        <p>${escapeHtml(card.subtitle)}</p>`,
    `        <strong>${escapeHtml(card.primaryMetric.value)}</strong>`,
    `        <small>${escapeHtml(card.primaryMetric.label)} · unresolved ${card.unresolvedRows}</small>`,
    "      </article>",
  ].join("\n")).join("\n");

  const timelineRows = entry.preview.timeline.groups
    .flatMap((group) => group.rows)
    .slice(0, maxTimelineRows)
    .map((row) => [
      `      <article class="detail-row" data-token-movement-timeline-row="${escapeHtml(row.id)}">`,
      "        <div>",
      "          <span>When</span>",
      `          <strong>${escapeHtml(row.dateLabel)} ${escapeHtml(row.timeLabel)}</strong>`,
      "        </div>",
      "        <div>",
      "          <span>Token</span>",
      `          <strong>${escapeHtml(row.token)}</strong>`,
      "        </div>",
      "        <div>",
      "          <span>Amount</span>",
      `          <code>${escapeHtml(row.amount)}</code>`,
      "        </div>",
      "        <div>",
      "          <span>Direction</span>",
      `          <strong>${escapeHtml(row.direction)}</strong>`,
      "        </div>",
      "        <div>",
      "          <span>Status</span>",
      `          <strong>${escapeHtml(row.reviewStatus)}</strong>`,
      "        </div>",
      "      </article>",
    ].join("\n"))
    .join("\n");

  const qaItems = entry.qaReport.checks.slice(0, 6).map((check) => [
    `      <li data-token-movement-qa-check="${escapeHtml(check.id)}">`,
    `        <strong>${escapeHtml(check.status.toUpperCase())}</strong> — ${escapeHtml(check.title)}`,
    "      </li>",
  ].join("\n")).join("\n");

  return [
    "<section class=\"panel token-movement-visible-demo\" data-watchtower-token-movement-visible-demo>",
    "  <div class=\"panel-heading\">",
    "    <div>",
    "      <span class=\"card-label\">Token Movement</span>",
    `      <h2>${escapeHtml(entry.title)}</h2>`,
    "    </div>",
    `    <span class=\"badge ${entry.summary.readyForVisualReview ? "badge-success" : "badge-warning"}\">${entry.summary.readyForVisualReview ? "Ready for UI review" : "Needs review"}</span>`,
    "  </div>",
    "  <p class=\"muted\">Synthetic, read-only, no-storage preview. These rows are not real wallet history and are only for UI/UX review before live reads are connected.</p>",
    "  <div class=\"definition-grid\">",
    "    <div><span>Mode</span><strong>synthetic preview</strong></div>",
    `    <div><span>Rows</span><strong>${entry.summary.visibleRows}</strong></div>`,
    `    <div><span>QA</span><strong>${entry.summary.qaPassed} pass / ${entry.summary.qaFailed} fail</strong></div>`,
    `    <div><span>Privacy guard</span><strong>${entry.summary.privacySafe ? "passed" : "needs review"}</strong></div>`,
    "  </div>",
    "  <div class=\"grid grid-four\">",
    cards,
    "  </div>",
    "  <div class=\"split-list\">",
    "    <div>",
    "      <h3>Timeline preview</h3>",
    "      <div class=\"detail-table\">",
    timelineRows.length > 0 ? timelineRows : "        <p class=\"muted\">No synthetic timeline rows.</p>",
    "      </div>",
    "    </div>",
    "    <div>",
    "      <h3>Preview QA</h3>",
    "      <ul>",
    qaItems,
    "      </ul>",
    "      <h3>Protected rules</h3>",
    "      <ul>",
    ...entry.protectedRules.slice(0, 4).map((rule) => `        <li>${escapeHtml(rule)}</li>`),
    "      </ul>",
    "    </div>",
    "  </div>",
    "</section>",
  ].join("\n");
}

function normalizeMaxTimelineRows(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value)) return 8;
  return Math.max(1, Math.min(25, Math.trunc(value)));
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");
}
