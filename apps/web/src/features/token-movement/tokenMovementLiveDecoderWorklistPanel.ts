import {
  createTokenMovementLiveDecoderWorklist,
  type AccountHistoryResponse,
  type TokenMovementLiveDecoderWorklistOptions,
} from "@watchtower/core";

export interface TokenMovementLiveDecoderWorklistPanelOptions extends TokenMovementLiveDecoderWorklistOptions {
  readonly maxWarningsPerItem?: number;
}

export function renderTokenMovementLiveDecoderWorklistPanel(
  response: AccountHistoryResponse,
  options: TokenMovementLiveDecoderWorklistPanelOptions = {},
): string {
  const worklist = createTokenMovementLiveDecoderWorklist(response, options);
  const maxWarningsPerItem = normalizeMaxWarnings(options.maxWarningsPerItem);

  const sectionsHtml = worklist.sections.map((section) => {
    const itemsHtml = section.items.map((item) => {
      const warnings = item.warnings.slice(0, maxWarningsPerItem).map(
        (warning) => `            <li>${escapeHtml(warning)}</li>`,
      ).join("\n");

      return [
        `      <article class="detail-row" data-live-decoder-worklist-item="${escapeHtml(item.id)}">`,
        "        <div>",
        "          <span>Priority</span>",
        `          <strong>${escapeHtml(item.priority)}</strong>`,
        `          <small>${escapeHtml(item.decodeState)}</small>`,
        "        </div>",
        "        <div>",
        "          <span>When</span>",
        `          <strong>${escapeHtml(item.whenLabel)}</strong>`,
        "        </div>",
        "        <div>",
        "          <span>Value</span>",
        `          <strong>${escapeHtml(item.valueLabel)}</strong>`,
        `          <small>${escapeHtml(item.direction)}</small>`,
        "        </div>",
        "        <div>",
        "          <span>Body</span>",
        `          <strong>${escapeHtml(item.bodyEvidence)}</strong>`,
        `          <small>${escapeHtml(item.decodedMethod)}</small>`,
        "        </div>",
        "        <div>",
        "          <span>Task</span>",
        `          <strong>${escapeHtml(item.task)}</strong>`,
        `          <small>${escapeHtml(item.requiredProof)}</small>`,
        "        </div>",
        "        <details>",
        "          <summary>Evidence</summary>",
        "          <div class=\"definition-grid\">",
        `            <div><span>From</span><code>${escapeHtml(shorten(item.source))}</code></div>`,
        `            <div><span>To</span><code>${escapeHtml(shorten(item.destination))}</code></div>`,
        `            <div><span>Tx</span><code>${escapeHtml(shorten(item.transactionHash))}</code></div>`,
        `            <div><span>LT</span><code>${escapeHtml(shorten(item.logicalTime))}</code></div>`,
        "          </div>",
        warnings.length > 0 ? `          <ul>\n${warnings}\n          </ul>` : "",
        "        </details>",
        "      </article>",
      ].filter(Boolean).join("\n");
    }).join("\n");

    return [
      `    <article class="card" data-live-decoder-worklist-section="${section.category}">`,
      `      <span class="card-label">${escapeHtml(section.category)}</span>`,
      `      <h3>${escapeHtml(section.title)}</h3>`,
      `      <p>${escapeHtml(section.description)}</p>`,
      `      <p><strong>${section.items.length}</strong> items shown</p>`,
      itemsHtml.length > 0 ? `      <div class="detail-table">\n${itemsHtml}\n      </div>` : `      <p class="muted">${escapeHtml(section.emptyState)}</p>`,
      "    </article>",
    ].join("\n");
  }).join("\n");

  const notes = worklist.safetyNotes.map((note) => `      <li>${escapeHtml(note)}</li>`).join("\n");

  return [
    "<section class=\"panel token-movement-live-decoder-worklist\" data-watchtower-token-movement-live-decoder-worklist>",
    "  <div class=\"panel-heading\">",
    "    <div>",
    "      <span class=\"card-label\">Live decoder worklist</span>",
    `      <h2>${escapeHtml(worklist.title)}</h2>`,
    "    </div>",
    `    <span class=\"badge ${worklist.summary.highPriorityItems > 0 ? "badge-warning" : "badge-success"}\">${worklist.summary.highPriorityItems} high priority</span>`,
    "  </div>",
    "  <p class=\"muted\">Live raw evidence translated into decoder tasks. This is the bridge between seeing real rows and safely proving token movement.</p>",
    "  <div class=\"definition-grid\">",
    `    <div><span>Account</span><code>${escapeHtml(shorten(worklist.watchedAddress))}</code></div>`,
    `    <div><span>Transactions</span><strong>${worklist.summary.transactionCount}</strong></div>`,
    `    <div><span>Messages</span><strong>${worklist.summary.messageCount}</strong></div>`,
    `    <div><span>Worklist items</span><strong>${worklist.summary.totalItems}</strong></div>`,
    `    <div><span>Body decoder</span><strong>${worklist.summary.bodyDecoderNeeded}</strong></div>`,
    `    <div><span>Mining proof</span><strong>${worklist.summary.miningRewardProofNeeded}</strong></div>`,
    `    <div><span>Contract review</span><strong>${worklist.summary.contractRouteReview}</strong></div>`,
    `    <div><span>Privacy</span><strong>${escapeHtml(worklist.summary.privacyMode)}</strong></div>`,
    "  </div>",
    "  <div class=\"grid grid-two\">",
    sectionsHtml,
    "  </div>",
    "  <div>",
    "    <h3>Safety notes</h3>",
    `    <ul>\n${notes}\n    </ul>`,
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
