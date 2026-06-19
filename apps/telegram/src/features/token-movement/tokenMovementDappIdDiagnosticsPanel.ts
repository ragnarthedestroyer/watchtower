import {
  createTokenMovementDappIdDiagnostics,
  type AccountHistoryResponse,
  type TokenMovementDappIdDiagnosticsInput,
} from "@watchtower/core";

export interface TelegramTokenMovementDappIdDiagnosticsPanelOptions extends TokenMovementDappIdDiagnosticsInput {
  readonly response?: AccountHistoryResponse | null;
  readonly maxCharacters?: number;
}

export function renderTelegramTokenMovementDappIdDiagnosticsPanel(
  options: TelegramTokenMovementDappIdDiagnosticsPanelOptions = {},
): string {
  const diagnostics = createTokenMovementDappIdDiagnostics(options);
  const maxCharacters = options.maxCharacters ?? 3500;

  const lines: string[] = [
    `Watchtower State V2 diagnostics: ${diagnostics.title}`,
    `Status: ${diagnostics.status}`,
    `Account ID: ${diagnostics.accountId ?? "missing"}`,
    `DApp ID: ${diagnostics.dappId ?? "missing"}`,
    `Legacy address: ${shorten(diagnostics.legacyAddress ?? "missing")}`,
    `Multifactor address: ${shorten(diagnostics.multifactorAddress ?? "not provided")}`,
    `Can attempt State V2: ${diagnostics.canAttemptStateV2 ? "yes" : "no"}`,
    "",
    "Blockers:",
    ...toBulletLines(diagnostics.blockers, "No diagnostic blockers detected."),
    "",
    "Next steps:",
    ...toBulletLines(diagnostics.nextSteps, "No next steps returned."),
    "",
    "Safety: do not guess the DApp ID from the account address or multifactor address.",
  ];

  if (diagnostics.stateV2Curl) {
    lines.push("", "State V2 curl template:", diagnostics.stateV2Curl);
  }

  const text = lines.join("\n");
  if (text.length <= maxCharacters) return text;
  return `${text.slice(0, maxCharacters - 80)}\n\n[truncated] Open the web dashboard for the full DApp ID diagnostics.`;
}

function toBulletLines(values: readonly string[], emptyState: string): string[] {
  if (values.length === 0) return [`- ${emptyState}`];
  return values.slice(0, 8).map((value) => `- ${value}`);
}

function shorten(value: string): string {
  if (value.length <= 28) return value;
  return `${value.slice(0, 12)}…${value.slice(-12)}`;
}
