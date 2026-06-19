import {
  createTokenMovementDashboardQuickFilters,
  renderTokenMovementDashboardQuickFiltersText,
  type TokenMovementDashboardVisualCards,
} from "@watchtower/core";

export interface TelegramTokenMovementDashboardQuickFiltersPanelOptions {
  readonly maxCharacters?: number;
}

export function renderTelegramTokenMovementDashboardQuickFiltersPanel(
  visualCards: TokenMovementDashboardVisualCards,
  options: TelegramTokenMovementDashboardQuickFiltersPanelOptions = {},
): string {
  const quickFilters = createTokenMovementDashboardQuickFilters(visualCards);
  const text = renderTokenMovementDashboardQuickFiltersText(quickFilters);
  const maxCharacters = options.maxCharacters ?? 3500;

  if (text.length <= maxCharacters) return text;
  return `${text.slice(0, maxCharacters - 90)}\n\n[truncated] Open the web dashboard for the full on-the-fly quick-filter controls.`;
}
