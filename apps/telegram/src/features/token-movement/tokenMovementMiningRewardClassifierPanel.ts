import {
  classifyTokenMovementsForMiningRewardDashboard,
  renderMiningRewardClassifierDashboardText,
  type MiningRewardClassifierSourceLike,
} from "@watchtower/core";

export interface TelegramTokenMovementMiningRewardClassifierPanelOptions {
  readonly maxCharacters?: number;
}

export function renderTelegramTokenMovementMiningRewardClassifierPanel(
  records: readonly MiningRewardClassifierSourceLike[],
  options: TelegramTokenMovementMiningRewardClassifierPanelOptions = {},
): string {
  const dashboard = classifyTokenMovementsForMiningRewardDashboard(records);
  const text = renderMiningRewardClassifierDashboardText(dashboard);
  const maxCharacters = options.maxCharacters ?? 3000;

  if (text.length <= maxCharacters) return text;
  return `${text.slice(0, maxCharacters - 80)}\n\n[truncated] Open the web dashboard for the full visual classification.`;
}
