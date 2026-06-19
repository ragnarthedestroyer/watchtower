import {
  createTokenMovementDashboardUxReviewTracker,
  renderTokenMovementDashboardUxReviewText,
  type TokenMovementDashboardUxReviewInput,
  type TokenMovementDashboardUxReviewOptions,
} from "@watchtower/core";

export interface TelegramTokenMovementDashboardUxReviewPanelOptions {
  readonly title?: string;
  readonly releaseStage?: TokenMovementDashboardUxReviewOptions["releaseStage"];
  readonly maxCharacters?: number;
}

export function renderTelegramTokenMovementDashboardUxReviewPanel(
  items: readonly TokenMovementDashboardUxReviewInput[],
  options: TelegramTokenMovementDashboardUxReviewPanelOptions = {},
): string {
  const tracker = createTokenMovementDashboardUxReviewTracker(items, {
    title: options.title ?? "Token movement dashboard UI/UX review tracker",
    releaseStage: options.releaseStage ?? "visible-prototype",
    allowCosmeticIteration: true,
  });

  const text = renderTokenMovementDashboardUxReviewText(tracker);
  const maxCharacters = options.maxCharacters ?? 3500;
  if (text.length <= maxCharacters) return text;
  return `${text.slice(0, maxCharacters - 75)}\n\n[truncated] Open the web UI/UX tracker for the full review list.`;
}
