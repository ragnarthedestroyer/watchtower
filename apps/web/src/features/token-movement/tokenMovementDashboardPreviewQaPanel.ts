import {
  createTokenMovementDashboardPreviewQaReport,
  renderTokenMovementDashboardPreviewQaText,
  type TokenMovementDashboardPreviewQaOptions,
  type TokenMovementDashboardPreviewQaStatus,
} from "@watchtower/core";

export interface TokenMovementDashboardPreviewQaPanelOptions extends TokenMovementDashboardPreviewQaOptions {
  readonly showRawText?: boolean;
}

export function renderTokenMovementDashboardPreviewQaPanel(
  options: TokenMovementDashboardPreviewQaPanelOptions = {},
): string {
  const report = createTokenMovementDashboardPreviewQaReport({
    ...(options.title === undefined ? {} : { title: options.title }),
    ...(options.generatedAt === undefined ? {} : { generatedAt: options.generatedAt }),
    ...(options.watchedAddress === undefined ? {} : { watchedAddress: options.watchedAddress }),
  });
  const rawText = options.showRawText === true ? renderTokenMovementDashboardPreviewQaText(report) : "";

  const checkHtml = report.checks.map((check) => [
    `    <article data-watchtower-preview-qa-check="${escapeHtml(check.id)}" class="watchtower-preview-qa-check watchtower-preview-qa-${escapeHtml(check.status)}">`,
    `      <strong>${escapeHtml(statusLabel(check.status))}: ${escapeHtml(check.title)}</strong>`,
    `      <p>${escapeHtml(check.detail)}</p>`,
    `      <small>${escapeHtml(check.lane)}</small>`,
    "    </article>",
  ].join("\n")).join("\n");

  return [
    "<section data-watchtower-token-movement-preview-qa>",
    `  <h2>${escapeHtml(report.title)}</h2>`,
    `  <p>Checks: ${report.summary.passed} passed · ${report.summary.warnings} warnings · ${report.summary.failed} failed</p>`,
    `  <p>Ready for visual review: ${report.summary.readyForVisualReview ? "yes" : "no"}</p>`,
    "  <p>This QA panel validates the synthetic no-storage dashboard preview before live token movement reads are connected.</p>",
    "  <div data-watchtower-preview-qa-checks>",
    checkHtml,
    "  </div>",
    "  <h3>Next visual review focus</h3>",
    "  <ul>",
    ...report.nextReviewFocus.map((item) => `    <li>${escapeHtml(item)}</li>`),
    "  </ul>",
    rawText.length > 0 ? `  <pre>${escapeHtml(rawText)}</pre>` : "",
    "</section>",
  ].filter((line) => line.length > 0).join("\n");
}

function statusLabel(status: TokenMovementDashboardPreviewQaStatus): string {
  switch (status) {
    case "pass":
      return "Pass";
    case "warn":
      return "Warning";
    case "fail":
      return "Fail";
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");
}
