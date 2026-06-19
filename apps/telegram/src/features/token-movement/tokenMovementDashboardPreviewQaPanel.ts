import {
  createTokenMovementDashboardPreviewQaReport,
  renderTokenMovementDashboardPreviewQaText,
  type TokenMovementDashboardPreviewQaOptions,
} from "@watchtower/core";

export interface TelegramTokenMovementDashboardPreviewQaPanelOptions extends TokenMovementDashboardPreviewQaOptions {
  readonly maxCharacters?: number;
}

export function renderTelegramTokenMovementDashboardPreviewQaPanel(
  options: TelegramTokenMovementDashboardPreviewQaPanelOptions = {},
): string {
  const report = createTokenMovementDashboardPreviewQaReport({
    ...(options.title === undefined ? {} : { title: options.title }),
    ...(options.generatedAt === undefined ? {} : { generatedAt: options.generatedAt }),
    ...(options.watchedAddress === undefined ? {} : { watchedAddress: options.watchedAddress }),
  });
  const text = renderTokenMovementDashboardPreviewQaText(report);
  const maxCharacters = options.maxCharacters ?? 3500;

  if (text.length <= maxCharacters) return text;
  return `${text.slice(0, maxCharacters - 92)}\n\n[truncated] Open the Web preview QA panel for the full synthetic dashboard review checklist.`;
}
