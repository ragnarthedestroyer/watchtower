import {
  createTokenMovementDashboardTimeline,
  renderTokenMovementDashboardTimelineText,
  type TokenMovementDashboardTimelineOptions,
  type TokenMovementOnTheFlyFrontendDashboard,
} from "@watchtower/core";

export interface TelegramTokenMovementDashboardTimelinePanelOptions {
  readonly timeline?: TokenMovementDashboardTimelineOptions;
  readonly maxCharacters?: number;
}

export function renderTelegramTokenMovementDashboardTimelinePanel(
  dashboard: TokenMovementOnTheFlyFrontendDashboard,
  options: TelegramTokenMovementDashboardTimelinePanelOptions = {},
): string {
  const timeline = createTokenMovementDashboardTimeline(dashboard, options.timeline ?? {});
  const text = renderTokenMovementDashboardTimelineText(timeline);
  const maxCharacters = options.maxCharacters ?? 3500;

  if (text.length <= maxCharacters) return text;
  return `${text.slice(0, maxCharacters - 88)}\n\n[truncated] Open the web dashboard for the full on-the-fly movement timeline.`;
}
