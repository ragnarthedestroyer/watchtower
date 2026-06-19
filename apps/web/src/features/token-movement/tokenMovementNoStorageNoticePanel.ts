import {
  assessTokenMovementNoStorageContext,
  createDefaultTokenMovementNoStorageContext,
  tokenMovementNoStorageAssessmentToLines,
  type TokenMovementNoStorageContext,
} from "@watchtower/core";

export interface TokenMovementNoStorageNoticePanelOptions {
  readonly title?: string;
  readonly context?: TokenMovementNoStorageContext;
}

export function renderTokenMovementNoStorageNoticePanel(
  options: TokenMovementNoStorageNoticePanelOptions = {},
): string {
  const context = options.context ?? createDefaultTokenMovementNoStorageContext("web", "Token movement dashboard");
  const assessment = assessTokenMovementNoStorageContext(context);
  const lines = tokenMovementNoStorageAssessmentToLines(assessment);

  return [
    `<section data-watchtower-token-movement-no-storage-notice data-risk="${escapeHtml(assessment.risk)}">`,
    `  <h2>${escapeHtml(options.title ?? "On-the-fly privacy boundary")}</h2>`,
    `  <p>${escapeHtml(assessment.summary)}</p>`,
    "  <ul>",
    ...lines.map((line) => `    <li>${escapeHtml(line)}</li>`),
    "  </ul>",
    "  <p>Watchtower should render wallet-specific movement data without retaining it.</p>",
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
