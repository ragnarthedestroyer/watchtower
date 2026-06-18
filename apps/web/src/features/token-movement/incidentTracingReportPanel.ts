import type { IncidentTracingReport } from "@watchtower/core";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function listItems(items: string[]): string {
  if (items.length === 0) return "<li>None</li>";
  return items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
}

export function renderIncidentTracingReportPanel(report: IncidentTracingReport): string {
  const findings = report.findings
    .map(
      (finding) => `
        <article class="watchtower-incident-finding watchtower-incident-finding--${escapeHtml(finding.severity)}">
          <h4>${escapeHtml(finding.title)}</h4>
          <p>${escapeHtml(finding.description)}</p>
          <p><strong>Kind:</strong> ${escapeHtml(finding.kind)} · <strong>Confidence:</strong> ${escapeHtml(finding.confidence)}</p>
          <p><strong>Movement IDs:</strong> ${escapeHtml(finding.movementIds.length > 0 ? finding.movementIds.join(", ") : "none")}</p>
        </article>
      `,
    )
    .join("");

  return `
    <section class="watchtower-incident-report" data-report-id="${escapeHtml(report.id)}">
      <header>
        <h3>${escapeHtml(report.title)}</h3>
        <p><strong>Status:</strong> ${escapeHtml(report.status)}</p>
        <p><strong>Generated:</strong> ${escapeHtml(report.generatedAt)}</p>
      </header>

      <div class="watchtower-incident-summary">
        <p>Reviewed ${report.totals.movementsReviewed} movement(s); ${report.totals.relevantMovements} relevant.</p>
        <p>SHELL outgoing: ${report.totals.shellOutgoingCandidates} · USDC related: ${report.totals.usdcRelatedCandidates}</p>
        <p>Accumulator: ${report.totals.accumulatorCandidates} · Bridge: ${report.totals.bridgeCandidates}</p>
        <p>Confirmed: ${report.totals.confirmedMovements} · Unresolved: ${report.totals.unresolvedMovements}</p>
      </div>

      <div class="watchtower-incident-findings">
        ${findings || "<p>No findings yet.</p>"}
      </div>

      <details open>
        <summary>Missing evidence</summary>
        <ul>${listItems(report.missingEvidence)}</ul>
      </details>

      <details>
        <summary>Recommended next checks</summary>
        <ul>${listItems(report.recommendedNextChecks)}</ul>
      </details>

      <footer>
        <p><strong>Read-only:</strong> this report does not sign, recover, custody, or prove unresolved movements.</p>
      </footer>
    </section>
  `;
}
