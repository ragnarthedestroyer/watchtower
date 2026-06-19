import {
  createTokenMovementDashboardDrilldown,
  renderTokenMovementDashboardDrilldownText,
  type TokenMovementDashboardDrilldownSelection,
  type TokenMovementDashboardVisualCards,
} from "@watchtower/core";

export interface TelegramTokenMovementDashboardDrilldownPanelOptions {
  readonly selection?: TokenMovementDashboardDrilldownSelection;
  readonly maxCharacters?: number;
}

export function renderTelegramTokenMovementDashboardDrilldownPanel(
  visualCards: TokenMovementDashboardVisualCards,
  options: TelegramTokenMovementDashboardDrilldownPanelOptions = {},
): string {
  const drilldown = createTokenMovementDashboardDrilldown(visualCards, options.selection ?? {});
  const text = renderTokenMovementDashboardDrilldownText(drilldown);
  const maxCharacters = options.maxCharacters ?? 3500;

  if (text.length <= maxCharacters) return text;
  return `${text.slice(0, maxCharacters - 90)}\n\n[truncated] Open the web dashboard for the full on-the-fly drilldown view.`;
}
