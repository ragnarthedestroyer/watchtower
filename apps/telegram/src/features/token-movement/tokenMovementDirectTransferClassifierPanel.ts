import {
  classifyDirectTransfersForDashboard,
  renderDirectTransferClassifierDashboardText,
  type DirectTransferClassifierSourceLike,
} from "@watchtower/core";

export interface TelegramTokenMovementDirectTransferClassifierPanelOptions {
  readonly maxCharacters?: number;
}

export function renderTelegramTokenMovementDirectTransferClassifierPanel(
  records: readonly DirectTransferClassifierSourceLike[],
  options: TelegramTokenMovementDirectTransferClassifierPanelOptions = {},
): string {
  const dashboard = classifyDirectTransfersForDashboard(records);
  const text = renderDirectTransferClassifierDashboardText(dashboard);
  const maxCharacters = options.maxCharacters ?? 3000;

  if (text.length <= maxCharacters) return text;
  return `${text.slice(0, maxCharacters - 80)}\n\n[truncated] Open the web dashboard for the full direct-transfer classification.`;
}
