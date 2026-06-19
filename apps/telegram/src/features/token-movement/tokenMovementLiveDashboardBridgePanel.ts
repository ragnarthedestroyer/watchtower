import {
  createTokenMovementLiveDashboardBridge,
  type AccountHistoryResponse,
  type TokenMovementLiveDashboardBridgeOptions,
} from "@watchtower/core";

export interface TelegramTokenMovementLiveDashboardBridgePanelOptions extends TokenMovementLiveDashboardBridgeOptions {
  readonly maxCharacters?: number;
}

export function renderTelegramTokenMovementLiveDashboardBridgePanel(
  response: AccountHistoryResponse,
  options: TelegramTokenMovementLiveDashboardBridgePanelOptions = {},
): string {
  const bridge = createTokenMovementLiveDashboardBridge(response, options);
  const lines: string[] = [
    `Watchtower live dashboard bridge: ${bridge.title}`,
    `Status: ${bridge.summary.status}`,
    `Transactions: ${bridge.summary.transactionCount}`,
    `Messages: ${bridge.summary.messageCount}`,
    `Rows shown: ${bridge.summary.visibleRowCount}`,
    `Privacy: ${bridge.summary.privacyMode}`,
    "",
  ];

  for (const section of bridge.sections) {
    lines.push(`${section.title}: ${section.rows.length}`);

    if (section.rows.length === 0) {
      lines.push(`- ${section.emptyState}`);
      lines.push("");
      continue;
    }

    for (const row of section.rows.slice(0, 4)) {
      lines.push(`- ${row.whenLabel} · ${row.amount} ${row.unit} · ${shorten(row.from)} → ${shorten(row.to)} · ${row.decodeState}`);
    }

    lines.push("");
  }

  lines.push("Read-only live evidence. Raw rows are not decoded NACKL/SHELL/USDC movement yet.");

  const maxCharacters = options.maxCharacters ?? 3500;
  const output = lines.join("\n");
  if (output.length <= maxCharacters) return output;
  return `${output.slice(0, maxCharacters - 80)}\n\n[truncated] Open the web dashboard for the full live raw bridge view.`;
}

function shorten(value: string): string {
  if (value.length <= 22) return value;
  return `${value.slice(0, 8)}…${value.slice(-8)}`;
}
