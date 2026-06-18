/**
 * Watchtower Batch 55 — Web token movement history panel renderer
 *
 * Small dependency-free HTML renderer for the TokenMovementHistoryViewModel
 * produced by packages/core/src/token-movement-history-view.ts.
 *
 * It is intentionally not wired into routing yet. Batch 55 creates the panel
 * building block; later batches can connect it to real API data.
 */

export type WebTokenMovementHistoryPanelTone = "ok" | "warning" | "danger" | "muted";

export type WebTokenMovementHistoryPanelRow = {
  id: string;
  observedAtLabel: string;
  directionLabel: string;
  tokenSymbol: string;
  amountLabel: string;
  fromLabel: string;
  fromAddress: string | null;
  toLabel: string;
  toAddress: string | null;
  proofStatus: string;
  proofTone: WebTokenMovementHistoryPanelTone;
  likelyAction: string;
  summary: string;
  uncertaintyCount: number;
  highUncertaintyCount: number;
  warningCount: number;
  needsReview: boolean;
  tags: string[];
};

export type WebTokenMovementHistoryPanelModel = {
  title: string;
  subjectLabel: string;
  subjectAddress: string | null;
  generatedAt: string;
  safetyBanner: string;
  rows: WebTokenMovementHistoryPanelRow[];
  summary: {
    totalMovements: number;
    visibleMovements: number;
    confirmedMovements: number;
    candidateMovements: number;
    needsReview: number;
    unknownTokenMovements: number;
    byToken: Record<string, number>;
    topWarnings: string[];
  };
  emptyState: string | null;
  warnings: string[];
};

function escapeHtml(value: string | number | null | undefined): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function compactAddress(address: string | null): string {
  if (!address) return "";
  if (address.length <= 18) return address;
  return `${address.slice(0, 10)}…${address.slice(-8)}`;
}

function renderStat(label: string, value: string | number): string {
  return `<div class="wt-token-movement-stat"><strong>${escapeHtml(value)}</strong><span>${escapeHtml(label)}</span></div>`;
}

function renderAddress(label: string, address: string | null): string {
  const compact = compactAddress(address);
  const title = address ? ` title="${escapeHtml(address)}"` : "";
  return `<span class="wt-token-movement-party"${title}>${escapeHtml(label)}${compact ? `<small>${escapeHtml(compact)}</small>` : ""}</span>`;
}

function renderRow(row: WebTokenMovementHistoryPanelRow): string {
  const review = row.needsReview ? "Needs review" : "OK";
  const tags = row.tags.length
    ? `<div class="wt-token-movement-tags">${row.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>`
    : "";

  return `
    <article class="wt-token-movement-row wt-tone-${escapeHtml(row.proofTone)}">
      <header>
        <div>
          <strong>${escapeHtml(row.amountLabel)}</strong>
          <span>${escapeHtml(row.tokenSymbol)} · ${escapeHtml(row.directionLabel)} · ${escapeHtml(row.observedAtLabel)}</span>
        </div>
        <mark>${escapeHtml(row.proofStatus)}</mark>
      </header>
      <div class="wt-token-movement-flow">
        ${renderAddress(row.fromLabel, row.fromAddress)}
        <span aria-hidden="true">→</span>
        ${renderAddress(row.toLabel, row.toAddress)}
      </div>
      <p>${escapeHtml(row.likelyAction)}</p>
      <small>${escapeHtml(row.summary)}</small>
      <footer>
        <span>${escapeHtml(review)}</span>
        <span>${escapeHtml(row.uncertaintyCount)} uncertainties</span>
        <span>${escapeHtml(row.highUncertaintyCount)} high</span>
        <span>${escapeHtml(row.warningCount)} warnings</span>
      </footer>
      ${tags}
    </article>`;
}

export function renderTokenMovementHistoryPanel(model: WebTokenMovementHistoryPanelModel): string {
  const tokenStats = Object.entries(model.summary.byToken)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([token, count]) => renderStat(token, count))
    .join("");

  const warnings = model.warnings.length
    ? `<section class="wt-token-movement-warnings"><strong>Safety notes</strong><ul>${model.warnings.map((warning) => `<li>${escapeHtml(warning)}</li>`).join("")}</ul></section>`
    : "";

  const rows = model.rows.length
    ? model.rows.map(renderRow).join("")
    : `<div class="wt-token-movement-empty">${escapeHtml(model.emptyState ?? "No token movements to show.")}</div>`;

  return `
    <section class="wt-token-movement-panel" data-watchtower-panel="token-movement-history">
      <header class="wt-token-movement-panel-header">
        <div>
          <h2>${escapeHtml(model.title)}</h2>
          <p>${escapeHtml(model.subjectLabel)}${model.subjectAddress ? ` · ${escapeHtml(compactAddress(model.subjectAddress))}` : ""}</p>
        </div>
        <small>Generated ${escapeHtml(model.generatedAt)}</small>
      </header>
      <aside class="wt-token-movement-safety">${escapeHtml(model.safetyBanner)}</aside>
      <section class="wt-token-movement-stats">
        ${renderStat("visible", model.summary.visibleMovements)}
        ${renderStat("confirmed", model.summary.confirmedMovements)}
        ${renderStat("candidates", model.summary.candidateMovements)}
        ${renderStat("needs review", model.summary.needsReview)}
        ${renderStat("unknown token", model.summary.unknownTokenMovements)}
        ${tokenStats}
      </section>
      ${warnings}
      <section class="wt-token-movement-list">${rows}</section>
    </section>`;
}

export const TOKEN_MOVEMENT_HISTORY_PANEL_CSS = `
.wt-token-movement-panel { display: grid; gap: 1rem; }
.wt-token-movement-panel-header { display: flex; justify-content: space-between; gap: 1rem; align-items: flex-start; }
.wt-token-movement-panel-header h2 { margin: 0; }
.wt-token-movement-safety { padding: .75rem; border: 1px solid currentColor; border-radius: .5rem; }
.wt-token-movement-stats { display: flex; flex-wrap: wrap; gap: .75rem; }
.wt-token-movement-stat { display: grid; gap: .15rem; min-width: 7rem; padding: .75rem; border: 1px solid currentColor; border-radius: .5rem; }
.wt-token-movement-stat span { font-size: .85rem; opacity: .75; }
.wt-token-movement-warnings { padding: .75rem; border: 1px solid currentColor; border-radius: .5rem; }
.wt-token-movement-list { display: grid; gap: .75rem; }
.wt-token-movement-row { display: grid; gap: .6rem; padding: .9rem; border: 1px solid currentColor; border-radius: .75rem; }
.wt-token-movement-row header, .wt-token-movement-row footer, .wt-token-movement-flow { display: flex; flex-wrap: wrap; gap: .5rem; align-items: center; justify-content: space-between; }
.wt-token-movement-row header div { display: grid; gap: .2rem; }
.wt-token-movement-row mark { padding: .15rem .45rem; border-radius: 999px; }
.wt-token-movement-party { display: grid; gap: .1rem; }
.wt-token-movement-party small { opacity: .7; }
.wt-token-movement-tags { display: flex; flex-wrap: wrap; gap: .35rem; }
.wt-token-movement-tags span { padding: .15rem .45rem; border: 1px solid currentColor; border-radius: 999px; font-size: .8rem; }
.wt-token-movement-empty { padding: 1rem; border: 1px dashed currentColor; border-radius: .75rem; }
`;
