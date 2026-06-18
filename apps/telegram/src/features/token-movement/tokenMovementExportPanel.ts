import {
  createTokenMovementExportBundle,
  renderTokenMovementExportMarkdown,
  type TokenMovementExportScope,
  type TokenMovementExportSourceLike,
} from "@watchtower/core";

export interface TelegramTokenMovementExportPanelOptions {
  readonly title?: string;
  readonly scope?: TokenMovementExportScope;
  readonly generatedAt?: string;
  readonly maxCharacters?: number;
}

export function renderTelegramTokenMovementExportPanel(
  records: readonly TokenMovementExportSourceLike[],
  options: TelegramTokenMovementExportPanelOptions = {},
): string {
  const bundle = createTokenMovementExportBundle(records, {
    title: options.title ?? "Token movement export",
    scope: options.scope ?? "all",
    generatedAt: options.generatedAt,
  });

  const header = [
    `Watchtower export: ${bundle.title}`,
    `Scope: ${bundle.scope}`,
    `Total: ${bundle.summary.totalRecords}`,
    `Confirmed: ${bundle.summary.confirmedRecords}`,
    `Unresolved: ${bundle.summary.unresolvedRecords}`,
    "Read-only. Unresolved rows are not proof.",
    "",
  ].join("\n");

  const markdown = renderTokenMovementExportMarkdown(bundle);
  const maxCharacters = options.maxCharacters ?? 3500;
  const combined = `${header}${markdown}`;

  if (combined.length <= maxCharacters) return combined;
  return `${combined.slice(0, maxCharacters - 80)}\n\n[truncated] Open the web report or JSON/CSV export for full evidence.`;
}
