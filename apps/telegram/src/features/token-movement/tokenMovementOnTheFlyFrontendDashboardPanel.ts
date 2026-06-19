import {
  createOnTheFlyTokenMovementFrontendDashboard,
  renderOnTheFlyTokenMovementFrontendDashboardText,
  type TokenMovementFrontendDashboardOptions,
  type TokenMovementFrontendDashboardSourceLike,
} from "@watchtower/core";

export interface TelegramTokenMovementOnTheFlyFrontendDashboardPanelOptions {
  readonly title?: string;
  readonly watchedAddress?: string;
  readonly maxCharacters?: number;
}

export function renderTelegramTokenMovementOnTheFlyFrontendDashboardPanel(
  records: readonly TokenMovementFrontendDashboardSourceLike[],
  options: TelegramTokenMovementOnTheFlyFrontendDashboardPanelOptions = {},
): string {
  const dashboardOptions: TokenMovementFrontendDashboardOptions = {
    title: options.title ?? "Token movement dashboard",
    watchedAddress: options.watchedAddress ?? "not provided",
  };
  const dashboard = createOnTheFlyTokenMovementFrontendDashboard(records, dashboardOptions);
  const text = renderOnTheFlyTokenMovementFrontendDashboardText(dashboard);
  const maxCharacters = options.maxCharacters ?? 3500;

  if (text.length <= maxCharacters) return text;
  return `${text.slice(0, maxCharacters - 90)}\n\n[truncated] Open the web dashboard for the full on-the-fly movement split.`;
}
