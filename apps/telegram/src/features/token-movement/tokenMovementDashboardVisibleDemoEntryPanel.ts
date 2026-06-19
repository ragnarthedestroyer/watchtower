import {
  createTokenMovementDashboardVisibleDemoEntry,
  renderTokenMovementDashboardVisibleDemoEntryText,
  type TokenMovementDashboardVisibleDemoEntryOptions,
} from "@watchtower/core";

export interface TelegramTokenMovementDashboardVisibleDemoEntryPanelOptions extends TokenMovementDashboardVisibleDemoEntryOptions {
  readonly maxCharacters?: number;
}

export function renderTelegramTokenMovementDashboardVisibleDemoEntryPanel(
  options: TelegramTokenMovementDashboardVisibleDemoEntryPanelOptions = {},
): string {
  const entry = createTokenMovementDashboardVisibleDemoEntry({
    ...(options.title === undefined ? {} : { title: options.title }),
    ...(options.generatedAt === undefined ? {} : { generatedAt: options.generatedAt }),
    ...(options.watchedAddress === undefined ? {} : { watchedAddress: options.watchedAddress }),
  });
  const text = renderTokenMovementDashboardVisibleDemoEntryText(entry);
  const maxCharacters = normalizeMaxCharacters(options.maxCharacters);

  if (text.length <= maxCharacters) return text;
  return `${text.slice(0, maxCharacters - 96)}\n\n[truncated] Open the Web demo preview for the full visual-card and timeline review surface.`;
}

function normalizeMaxCharacters(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value)) return 3500;
  return Math.max(500, Math.min(12000, Math.trunc(value)));
}
