import {
  createTokenMovementLiveDecoderWorklist,
  type AccountHistoryResponse,
  type TokenMovementLiveDecoderWorklistOptions,
} from "@watchtower/core";

export interface TelegramTokenMovementLiveDecoderWorklistPanelOptions extends TokenMovementLiveDecoderWorklistOptions {
  readonly maxCharacters?: number;
}

export function renderTelegramTokenMovementLiveDecoderWorklistPanel(
  response: AccountHistoryResponse,
  options: TelegramTokenMovementLiveDecoderWorklistPanelOptions = {},
): string {
  const worklist = createTokenMovementLiveDecoderWorklist(response, options);
  const maxCharacters = options.maxCharacters ?? 3500;

  const lines: string[] = [
    `Watchtower live decoder worklist: ${worklist.title}`,
    `Account: ${shorten(worklist.watchedAddress)}`,
    `Transactions: ${worklist.summary.transactionCount}`,
    `Messages: ${worklist.summary.messageCount}`,
    `Items: ${worklist.summary.totalItems}`,
    `High priority: ${worklist.summary.highPriorityItems}`,
    `Body decoder needed: ${worklist.summary.bodyDecoderNeeded}`,
    `Mining proof needed: ${worklist.summary.miningRewardProofNeeded}`,
    `Privacy: ${worklist.summary.privacyMode}`,
    "",
  ];

  for (const section of worklist.sections) {
    lines.push(`${section.title}: ${section.items.length}`);
    if (section.items.length === 0) {
      lines.push(`- ${section.emptyState}`);
      lines.push("");
      continue;
    }

    for (const item of section.items.slice(0, 4)) {
      lines.push(`- ${item.priority}: ${item.valueLabel} · ${item.direction}`);
      lines.push(`  ${item.task}`);
      lines.push(`  Proof: ${item.requiredProof}`);
    }
    lines.push("");
  }

  lines.push("Read-only. Decoder worklist rows are not confirmed token movement.");

  const text = lines.join("\n");
  if (text.length <= maxCharacters) return text;
  return `${text.slice(0, maxCharacters - 80)}\n\n[truncated] Open the web dashboard for the full decoder worklist.`;
}

function shorten(value: string): string {
  if (value.length <= 24) return value;
  return `${value.slice(0, 10)}…${value.slice(-10)}`;
}
