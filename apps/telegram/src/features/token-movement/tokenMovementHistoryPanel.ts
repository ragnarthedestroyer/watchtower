import {
  buildTelegramTokenMovementSummary,
  renderTelegramTokenMovementSummary,
  type TelegramTokenMovementSummary,
  type TelegramTokenMovementViewOptions,
  type TokenMovementHistoryView,
  type TokenMovementHistoryViewModel,
} from "@watchtower/core";

export interface TelegramTokenMovementHistoryPanelResult {
  text: string;
  summary: TelegramTokenMovementSummary;
}

export function renderTokenMovementHistoryPanelForTelegram(
  view: TokenMovementHistoryView | TokenMovementHistoryViewModel,
  options: TelegramTokenMovementViewOptions = {},
): TelegramTokenMovementHistoryPanelResult {
  const summary = buildTelegramTokenMovementSummary(view, options);
  return {
    text: renderTelegramTokenMovementSummary(summary),
    summary,
  };
}

export const TELEGRAM_TOKEN_MOVEMENT_HISTORY_PANEL_COPY = {
  emptyTitle: "No token movements yet",
  unresolvedWarning: "Some movements are unresolved and should not be treated as confirmed proof.",
  readOnlyFooter: "Watchtower is read-only and never asks for seed phrases or private keys.",
} as const;
