import {
  createTokenMovementDashboardSessionState,
  renderTokenMovementDashboardSessionStateText,
  type TokenMovementDashboardSessionInput,
} from "@watchtower/core";

export interface TelegramTokenMovementDashboardSessionStatePanelOptions {
  readonly maxCharacters?: number;
}

export function renderTelegramTokenMovementDashboardSessionStatePanel(
  input: TokenMovementDashboardSessionInput,
  options: TelegramTokenMovementDashboardSessionStatePanelOptions = {},
): string {
  const state = createTokenMovementDashboardSessionState(input);
  const text = renderTokenMovementDashboardSessionStateText(state);
  const maxCharacters = options.maxCharacters ?? 2800;

  if (text.length <= maxCharacters) return text;
  return `${text.slice(0, maxCharacters - 80)}\n\n[truncated] Open Watchtower web view for the full session state.`;
}
