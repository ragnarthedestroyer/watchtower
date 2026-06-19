import {
  assessTokenMovementNoStorageContext,
  createDefaultTokenMovementNoStorageContext,
  tokenMovementNoStorageAssessmentToLines,
  type TokenMovementNoStorageContext,
} from "@watchtower/core";

export interface TelegramTokenMovementNoStorageNoticeOptions {
  readonly context?: TokenMovementNoStorageContext;
  readonly maxCharacters?: number;
}

export function renderTelegramTokenMovementNoStorageNoticePanel(
  options: TelegramTokenMovementNoStorageNoticeOptions = {},
): string {
  const context = options.context ?? createDefaultTokenMovementNoStorageContext("telegram", "Token movement dashboard");
  const assessment = assessTokenMovementNoStorageContext(context);
  const maxCharacters = options.maxCharacters ?? 1800;
  const text = [
    "Watchtower no-storage boundary",
    `Status: ${assessment.ok ? "OK" : "Blocked"}`,
    `Risk: ${assessment.risk}`,
    "",
    ...tokenMovementNoStorageAssessmentToLines(assessment),
    "",
    "Read-only. No wallet, no signer, no custody, no stored movement history.",
  ].join("\n");

  if (text.length <= maxCharacters) return text;
  return `${text.slice(0, maxCharacters - 80)}\n\n[truncated] Open the web notice for the full no-storage boundary.`;
}
