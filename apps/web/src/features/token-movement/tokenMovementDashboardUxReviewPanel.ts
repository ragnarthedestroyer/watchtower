import {
  createTokenMovementDashboardUxReviewTracker,
  renderTokenMovementDashboardUxReviewText,
  type TokenMovementDashboardUxReviewInput,
  type TokenMovementDashboardUxReviewOptions,
} from "@watchtower/core";

export interface TokenMovementDashboardUxReviewPanelOptions {
  readonly title?: string;
  readonly releaseStage?: TokenMovementDashboardUxReviewOptions["releaseStage"];
  readonly allowCosmeticIteration?: boolean;
}

export function renderTokenMovementDashboardUxReviewPanel(
  items: readonly TokenMovementDashboardUxReviewInput[],
  options: TokenMovementDashboardUxReviewPanelOptions = {},
): string {
  const tracker = createTokenMovementDashboardUxReviewTracker(items, {
    title: options.title ?? "Token movement dashboard UI/UX review tracker",
    releaseStage: options.releaseStage ?? "visible-prototype",
    allowCosmeticIteration: options.allowCosmeticIteration ?? true,
  });

  const rows = tracker.items.length === 0
    ? "<li>No UI/UX comments captured yet.</li>"
    : tracker.items.map((item) => [
        "<li>",
        `<strong>${escapeHtml(item.id)} — ${escapeHtml(item.title)}</strong>`,
        `<br><span>Scope: ${escapeHtml(item.scope)} · Category: ${escapeHtml(item.category)} · Priority: ${escapeHtml(item.priority)}</span>`,
        `<br><span>Lane: ${escapeHtml(item.reviewLane)} · Status: ${escapeHtml(item.status)}</span>`,
        `<br><span>${escapeHtml(item.expectedChange)}</span>`,
        "</li>",
      ].join("")).join("\n");

  return [
    "<section data-watchtower-token-movement-ux-review>",
    `  <h2>${escapeHtml(tracker.title)}</h2>`,
    `  <p>Stage: ${escapeHtml(tracker.releaseStage)} · Cosmetic iteration: ${tracker.allowCosmeticIteration ? "enabled" : "disabled"}</p>`,
    `  <p>Total: ${tracker.summary.total} · Cosmetic: ${tracker.summary.cosmeticUi} · Privacy/safety: ${tracker.summary.privacyOrSafetyReview} · Classification: ${tracker.summary.classificationReview}</p>`,
    "  <p>UI changes are expected after the frontend is visible, but privacy, classification, and unresolved-flow labeling remain protected boundaries.</p>",
    `  <ul>${rows}</ul>`,
    `  <pre>${escapeHtml(renderTokenMovementDashboardUxReviewText(tracker))}</pre>`,
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
