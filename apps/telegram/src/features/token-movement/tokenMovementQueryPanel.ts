import type { TokenMovementQueryPreset, TokenMovementQueryResult } from "@watchtower/core";

export function renderTelegramTokenMovementQueryPanel(
  result: TokenMovementQueryResult,
  presets: readonly TokenMovementQueryPreset[],
): string {
  const presetLines = presets
    .slice(0, 4)
    .map((preset) => `• ${preset.label}`)
    .join("\n");

  const warningLines = result.warnings.length
    ? result.warnings.map((warning) => `⚠️ ${warning}`).join("\n")
    : "No query warnings.";

  return [
    "🔎 Token movement query",
    `Mode: ${result.query.mode ?? "all"}`,
    `Matches: ${result.totalBeforePagination}`,
    `Shown: ${result.returned}`,
    "",
    "Presets:",
    presetLines || "No presets available.",
    "",
    warningLines,
    "",
    "Read-only. This view never signs, sends, swaps, bridges, or asks for keys.",
  ].join("\n");
}
