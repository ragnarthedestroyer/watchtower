import {
  createTokenMovementDappIdDiagnostics,
  type AccountHistoryResponse,
  type TokenMovementDappIdDiagnosticsInput,
} from "@watchtower/core";

export interface TokenMovementDappIdDiagnosticsPanelOptions extends TokenMovementDappIdDiagnosticsInput {
  readonly response?: AccountHistoryResponse | null;
  readonly maxBlockers?: number;
  readonly maxNextSteps?: number;
}

export function renderTokenMovementDappIdDiagnosticsPanel(
  options: TokenMovementDappIdDiagnosticsPanelOptions = {},
): string {
  const diagnostics = createTokenMovementDappIdDiagnostics(options);
  const maxBlockers = normalizeLimit(options.maxBlockers, 6);
  const maxNextSteps = normalizeLimit(options.maxNextSteps, 6);
  const toneClass = diagnostics.canAttemptStateV2 ? "badge-success" : diagnostics.status === "invalid-account-id" || diagnostics.status === "invalid-dapp-id" ? "badge-danger" : "badge-warning";
  const blockers = diagnostics.blockers.slice(0, maxBlockers).map((blocker) => `      <li>${escapeHtml(blocker)}</li>`).join("\n");
  const nextSteps = diagnostics.nextSteps.slice(0, maxNextSteps).map((step) => `      <li>${escapeHtml(step)}</li>`).join("\n");
  const safetyNotes = diagnostics.safetyNotes.map((note) => `      <li>${escapeHtml(note)}</li>`).join("\n");

  return [
    "<section class=\"panel token-movement-dapp-id-diagnostics\" data-watchtower-token-movement-dapp-id-diagnostics>",
    "  <div class=\"panel-heading\">",
    "    <div>",
    "      <span class=\"card-label\">State V2 diagnostics</span>",
    `      <h2>${escapeHtml(diagnostics.title)}</h2>`,
    "    </div>",
    `    <span class=\"badge ${toneClass}\">${escapeHtml(diagnostics.status)}</span>`,
    "  </div>",
    `  <p class=\"muted\">${escapeHtml(diagnostics.summary)}</p>`,
    "  <div class=\"definition-grid\">",
    `    <div><span>Input kind</span><strong>${escapeHtml(diagnostics.inputKind)}</strong></div>`,
    `    <div><span>Account ID</span><code>${escapeHtml(diagnostics.accountId ?? "missing")}</code></div>`,
    `    <div><span>DApp ID</span><code>${escapeHtml(diagnostics.dappId ?? "missing")}</code></div>`,
    `    <div><span>Legacy address</span><code>${escapeHtml(shorten(diagnostics.legacyAddress ?? "missing"))}</code></div>`,
    `    <div><span>Multifactor address</span><code>${escapeHtml(shorten(diagnostics.multifactorAddress ?? "not provided"))}</code></div>`,
    `    <div><span>Can attempt State V2</span><strong>${diagnostics.canAttemptStateV2 ? "yes" : "no"}</strong></div>`,
    `    <div><span>Legacy API disabled observed</span><strong>${diagnostics.legacyApiDisabledObserved ? "yes" : "no"}</strong></div>`,
    `    <div><span>Account.transactions unavailable</span><strong>${diagnostics.accountTransactionsUnavailableObserved ? "yes" : "no"}</strong></div>`,
    "  </div>",
    "  <div class=\"split-list\">",
    "    <div>",
    "      <h3>Blockers</h3>",
    diagnostics.blockers.length > 0 ? `      <ul>\n${blockers}\n      </ul>` : "      <p class=\"muted\">No diagnostic blockers detected.</p>",
    "    </div>",
    "    <div>",
    "      <h3>Next steps</h3>",
    `      <ul>\n${nextSteps}\n      </ul>`,
    "    </div>",
    "  </div>",
    diagnostics.stateV2Curl ? [
      "  <div class=\"detail-box\">",
      "    <h3>State V2 curl template</h3>",
      `    <code>${escapeHtml(diagnostics.stateV2Curl)}</code>`,
      "  </div>",
    ].join("\n") : "",
    diagnostics.legacyProbeCurl ? [
      "  <div class=\"detail-box\">",
      "    <h3>Legacy probe curl</h3>",
      `    <code>${escapeHtml(diagnostics.legacyProbeCurl)}</code>`,
      "  </div>",
    ].join("\n") : "",
    "  <div>",
    "    <h3>Safety notes</h3>",
    `    <ul>\n${safetyNotes}\n    </ul>`,
    "  </div>",
    "</section>",
  ].filter(Boolean).join("\n");
}

function normalizeLimit(value: number | undefined, fallback: number): number {
  if (value === undefined || !Number.isFinite(value)) return fallback;
  return Math.max(1, Math.min(12, Math.trunc(value)));
}

function shorten(value: string): string {
  if (value.length <= 28) return value;
  return `${value.slice(0, 12)}…${value.slice(-12)}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");
}
