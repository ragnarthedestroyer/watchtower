import {
  createTokenMovementDashboardDemoPreview,
  renderTokenMovementDashboardDemoPreviewText,
  type TokenMovementDashboardDemoPreviewOptions,
} from "@watchtower/core";

export interface TelegramTokenMovementDashboardDemoPreviewPanelOptions extends TokenMovementDashboardDemoPreviewOptions {
  readonly maxCharacters?: number;
}

export function renderTelegramTokenMovementDashboardDemoPreviewPanel(
  options: TelegramTokenMovementDashboardDemoPreviewPanelOptions = {},
): string {
  const preview = createTokenMovementDashboardDemoPreview({
    title: options.title ?? "Watchtower token movement dashboard demo preview",
    generatedAt: options.generatedAt ?? new Date(0).toISOString(),
    watchedAddress: options.watchedAddress ?? "demo-wallet-address",
  });
  const text = renderTokenMovementDashboardDemoPreviewText(preview);
  const maxCharacters = options.maxCharacters ?? 3500;

  if (text.length <= maxCharacters) return text;
  return `${text.slice(0, maxCharacters - 90)}\n\n[truncated] Open the Web preview for the full demo dashboard and UX review notes.`;
}
