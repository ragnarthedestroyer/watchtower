import {
  createTokenMovementLiveRawHistoryView,
  type AccountHistoryResponse,
  type TokenMovementLiveRawHistoryViewOptions,
} from "@watchtower/core";

export interface TelegramTokenMovementLiveRawHistoryPanelOptions extends TokenMovementLiveRawHistoryViewOptions {
  readonly maxRows?: number;
  readonly maxCharacters?: number;
}

export function renderTelegramTokenMovementLiveRawHistoryPanel(
  response: AccountHistoryResponse,
  options: TelegramTokenMovementLiveRawHistoryPanelOptions = {},
): string {
  const view = createTokenMovementLiveRawHistoryView(response, options);
  const maxRows = normalizeMaxRows(options.maxRows);
  const lines = [
    `Watchtower live raw history: ${view.summary.status}`,
    `Account: ${shorten(view.watchedAddress)}`,
    `Transactions: ${view.summary.transactionCount}`,
    `Inbound messages: ${view.summary.inboundMessageCount}`,
    `Outbound messages: ${view.summary.outboundMessageCount}`,
    `Warnings: ${view.summary.warningCount}`,
    "Read-only / on-the-fly / not decoded token movement yet.",
    "",
    ...view.rows.slice(0, maxRows).flatMap((row) => [
      `• ${row.whenLabel}`,
      `  ${shorten(row.hash)} · ${row.safety} · ${row.decodeState}`,
      row.inboundMessage ? `  In: ${row.inboundMessage.amount} ${row.inboundMessage.unit}` : "  In: none observed",
      `  Out messages: ${row.outboundMessages.length}`,
    ]),
  ];

  const output = lines.join("\n");
  const maxCharacters = options.maxCharacters ?? 3500;
  if (output.length <= maxCharacters) return output;
  return `${output.slice(0, maxCharacters - 80)}\n\n[truncated] Open the web dashboard for full live raw evidence.`;
}

function normalizeMaxRows(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value)) return 8;
  return Math.max(1, Math.min(25, Math.trunc(value)));
}

function shorten(value: string): string {
  if (value.length <= 24) return value;
  return `${value.slice(0, 10)}…${value.slice(-10)}`;
}
