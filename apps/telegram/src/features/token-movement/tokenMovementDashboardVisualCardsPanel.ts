import {
  createTokenMovementDashboardVisualCards,
  renderTokenMovementDashboardVisualCardsText,
  type TokenMovementOnTheFlyFrontendDashboard,
} from "@watchtower/core";

export interface TelegramTokenMovementDashboardVisualCardsPanelOptions {
  readonly maxCharacters?: number;
}

export function renderTelegramTokenMovementDashboardVisualCardsPanel(
  dashboard: TokenMovementOnTheFlyFrontendDashboard,
  options: TelegramTokenMovementDashboardVisualCardsPanelOptions = {},
): string {
  const visualCards = createTokenMovementDashboardVisualCards(dashboard);
  const text = renderTokenMovementDashboardVisualCardsText(visualCards);
  const maxCharacters = options.maxCharacters ?? 3500;

  if (text.length <= maxCharacters) return text;
  return `${text.slice(0, maxCharacters - 90)}\n\n[truncated] Open the web dashboard for the full on-the-fly visual-card split.`;
}
