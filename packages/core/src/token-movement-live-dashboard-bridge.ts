/**
 * Watchtower Batch 80 — Live raw dashboard bridge foundation
 *
 * Bridges live AccountHistoryResponse data into a dashboard-shaped, read-only
 * view model. This is deliberately conservative: raw messages are grouped for
 * visibility, but they are not presented as decoded NACKL/SHELL/USDC movement
 * or as confirmed mining rewards until a decoder proves it.
 */

import type {
  AccountHistoryDirection,
  AccountHistoryMessage,
  AccountHistoryResponse,
  AccountHistoryTransaction,
} from "./transaction-history";

export type TokenMovementLiveDashboardBridgeSectionId =
  | "nackl-mining-reward-candidates"
  | "raw-direct-transfer-in-candidates"
  | "raw-direct-transfer-out-candidates"
  | "unresolved-or-contract-routed";

export type TokenMovementLiveDashboardBridgeSeverity = "info" | "warning" | "danger";

export interface TokenMovementLiveDashboardBridgeRow {
  readonly id: string;
  readonly sectionId: TokenMovementLiveDashboardBridgeSectionId;
  readonly whenLabel: string;
  readonly transactionHash: string;
  readonly logicalTime: string;
  readonly direction: AccountHistoryDirection;
  readonly amount: string;
  readonly unit: string;
  readonly from: string;
  readonly to: string;
  readonly decodeState: string;
  readonly evidenceStatus: string;
  readonly confidence: string;
  readonly reason: string;
  readonly warnings: readonly string[];
}

export interface TokenMovementLiveDashboardBridgeSection {
  readonly id: TokenMovementLiveDashboardBridgeSectionId;
  readonly title: string;
  readonly description: string;
  readonly severity: TokenMovementLiveDashboardBridgeSeverity;
  readonly emptyState: string;
  readonly rows: readonly TokenMovementLiveDashboardBridgeRow[];
  readonly warnings: readonly string[];
}

export interface TokenMovementLiveDashboardBridgeSummary {
  readonly transactionCount: number;
  readonly messageCount: number;
  readonly visibleRowCount: number;
  readonly unresolvedRowCount: number;
  readonly rawOnlyRowCount: number;
  readonly privacyMode: "on-the-fly-no-storage";
  readonly status: "empty" | "raw-live-evidence" | "needs-decoder" | "needs-review";
}

export interface TokenMovementLiveDashboardBridgeOptions {
  readonly title?: string;
  readonly watchedAddress?: string;
  readonly maxRowsPerSection?: number;
}

export interface TokenMovementLiveDashboardBridge {
  readonly title: string;
  readonly generatedAt: string;
  readonly watchedAddress: string;
  readonly summary: TokenMovementLiveDashboardBridgeSummary;
  readonly sections: readonly TokenMovementLiveDashboardBridgeSection[];
  readonly safetyNotes: readonly string[];
}

export function createTokenMovementLiveDashboardBridge(
  response: AccountHistoryResponse,
  options: TokenMovementLiveDashboardBridgeOptions = {},
): TokenMovementLiveDashboardBridge {
  const maxRowsPerSection = normalizeMaxRowsPerSection(options.maxRowsPerSection);
  const allRows = response.transactions.flatMap((transaction) => rowsFromTransaction(transaction));

  const sections = createBridgeSections(allRows, maxRowsPerSection);
  const visibleRowCount = sections.reduce((total, section) => total + section.rows.length, 0);
  const unresolvedRowCount = allRows.filter((row) => row.sectionId === "unresolved-or-contract-routed").length;
  const rawOnlyRowCount = allRows.filter((row) => row.decodeState === "raw" || row.decodeState === "not-attempted").length;
  const messageCount = response.transactions.reduce(
    (total, transaction) => total + (transaction.inboundMessage ? 1 : 0) + transaction.outboundMessages.length,
    0,
  );

  return {
    title: options.title ?? "Live raw dashboard bridge",
    generatedAt: response.generatedAt,
    watchedAddress: options.watchedAddress
      ?? response.request.identity.address
      ?? response.request.identity.accountId
      ?? "unknown account",
    summary: {
      transactionCount: response.transactions.length,
      messageCount,
      visibleRowCount,
      unresolvedRowCount,
      rawOnlyRowCount,
      privacyMode: "on-the-fly-no-storage",
      status: bridgeStatus({
        transactionCount: response.transactions.length,
        messageCount,
        unresolvedRowCount,
        rawOnlyRowCount,
        warningCount: response.warnings.length,
      }),
    },
    sections,
    safetyNotes: [
      "This is live on-the-fly data; do not persist wallet history, searched addresses, or generated rows.",
      "Rows are raw message evidence grouped for visibility, not confirmed decoded token movement.",
      "NACKL mining reward detection remains disabled until source/contract/decoder evidence can prove it.",
      "SHELL, USDC, and NACKL labels must remain candidate-level until token body/event decoding is implemented.",
    ],
  };
}

function rowsFromTransaction(transaction: AccountHistoryTransaction): readonly TokenMovementLiveDashboardBridgeRow[] {
  const rows: TokenMovementLiveDashboardBridgeRow[] = [];

  if (transaction.inboundMessage) {
    rows.push(rowFromMessage(transaction, transaction.inboundMessage, "inbound"));
  }

  for (const message of transaction.outboundMessages) {
    rows.push(rowFromMessage(transaction, message, "outbound"));
  }

  if (rows.length === 0) {
    rows.push({
      id: `${transaction.id}:unresolved-transaction`,
      sectionId: "unresolved-or-contract-routed",
      whenLabel: formatUnixSeconds(transaction.createdAtUnixSeconds),
      transactionHash: transaction.hash ?? "unknown hash",
      logicalTime: transaction.logicalTime ?? "unknown lt",
      direction: "unknown",
      amount: transaction.totalFees.display ?? transaction.totalFees.raw ?? "unknown amount",
      unit: transaction.totalFees.unit,
      from: transaction.accountAddress ?? transaction.accountId ?? "unknown account",
      to: "unknown destination",
      decodeState: transaction.decodeState,
      evidenceStatus: "observed",
      confidence: transaction.confidence,
      reason: "Transaction has no extracted message rows yet; keep it in unresolved evidence.",
      warnings: transaction.warnings,
    });
  }

  return rows;
}

function rowFromMessage(
  transaction: AccountHistoryTransaction,
  message: AccountHistoryMessage,
  fallbackDirection: "inbound" | "outbound",
): TokenMovementLiveDashboardBridgeRow {
  const sectionId = sectionForMessage(message, fallbackDirection);
  const warnings = [
    ...transaction.warnings,
    ...message.warnings,
    "Raw live message evidence is not decoded token movement yet.",
  ];

  return {
    id: message.id ?? `${transaction.id}:${fallbackDirection}:${message.bodyHash ?? "message"}`,
    sectionId,
    whenLabel: formatUnixSeconds(message.createdAtUnixSeconds ?? transaction.createdAtUnixSeconds),
    transactionHash: transaction.hash ?? "unknown hash",
    logicalTime: transaction.logicalTime ?? "unknown lt",
    direction: message.direction,
    amount: message.value.display ?? message.value.raw ?? "unknown amount",
    unit: message.value.unit,
    from: message.sourceAddress ?? "unknown source",
    to: message.destinationAddress ?? "unknown destination",
    decodeState: message.decodeState,
    evidenceStatus: message.evidenceStatus,
    confidence: message.confidence,
    reason: reasonForSection(sectionId, message),
    warnings,
  };
}

function sectionForMessage(
  message: AccountHistoryMessage,
  fallbackDirection: "inbound" | "outbound",
): TokenMovementLiveDashboardBridgeSectionId {
  if (message.decodeState !== "decoded" && message.decodeState !== "partially-decoded") {
    if (message.direction === "incoming" || fallbackDirection === "inbound") {
      return "raw-direct-transfer-in-candidates";
    }

    if (message.direction === "outgoing" || fallbackDirection === "outbound") {
      return "raw-direct-transfer-out-candidates";
    }
  }

  if (message.direction === "incoming") return "raw-direct-transfer-in-candidates";
  if (message.direction === "outgoing") return "raw-direct-transfer-out-candidates";
  return "unresolved-or-contract-routed";
}

function reasonForSection(
  sectionId: TokenMovementLiveDashboardBridgeSectionId,
  message: AccountHistoryMessage,
): string {
  if (sectionId === "raw-direct-transfer-in-candidates") {
    return `Incoming raw message evidence. Unit observed as ${message.value.unit}; token identity still requires decoder evidence.`;
  }

  if (sectionId === "raw-direct-transfer-out-candidates") {
    return `Outgoing raw message evidence. Unit observed as ${message.value.unit}; token identity still requires decoder evidence.`;
  }

  if (sectionId === "nackl-mining-reward-candidates") {
    return "Potential mining reward evidence; disabled until proven by source/contract decoder evidence.";
  }

  return "Unresolved, self-directed, unknown, or contract-routed evidence; do not classify as a simple transfer.";
}

function createBridgeSections(
  rows: readonly TokenMovementLiveDashboardBridgeRow[],
  maxRowsPerSection: number,
): readonly TokenMovementLiveDashboardBridgeSection[] {
  const miningRows = rows.filter((row) => row.sectionId === "nackl-mining-reward-candidates");
  const incomingRows = rows.filter((row) => row.sectionId === "raw-direct-transfer-in-candidates");
  const outgoingRows = rows.filter((row) => row.sectionId === "raw-direct-transfer-out-candidates");
  const unresolvedRows = rows.filter((row) => row.sectionId === "unresolved-or-contract-routed");

  return [
    {
      id: "nackl-mining-reward-candidates",
      title: "NACKL mining rewards",
      description: "Reserved section for real NACKL reward evidence once decoder/source proof is available.",
      severity: "info",
      emptyState: "No confirmed mining reward evidence yet. This is expected before decoder work.",
      rows: miningRows.slice(0, maxRowsPerSection),
      warnings: ["Mining rewards are not inferred from raw inbound messages alone."],
    },
    {
      id: "raw-direct-transfer-in-candidates",
      title: "Raw transfer-in candidates",
      description: "Live inbound message evidence. Token identity and direct-transfer status are still unconfirmed.",
      severity: incomingRows.length > 0 ? "warning" : "info",
      emptyState: "No inbound raw message evidence returned for this request.",
      rows: incomingRows.slice(0, maxRowsPerSection),
      warnings: ["Inbound raw messages are not automatically NACKL/SHELL/USDC transfers."],
    },
    {
      id: "raw-direct-transfer-out-candidates",
      title: "Raw transfer-out candidates",
      description: "Live outbound message evidence. Token identity and direct-transfer status are still unconfirmed.",
      severity: outgoingRows.length > 0 ? "warning" : "info",
      emptyState: "No outbound raw message evidence returned for this request.",
      rows: outgoingRows.slice(0, maxRowsPerSection),
      warnings: ["Outbound raw messages are not automatically NACKL/SHELL/USDC transfers."],
    },
    {
      id: "unresolved-or-contract-routed",
      title: "Unresolved or contract-routed",
      description: "Raw evidence that cannot safely be shown as a simple transfer.",
      severity: unresolvedRows.length > 0 ? "warning" : "info",
      emptyState: "No unresolved raw rows beyond the candidate in/out sections.",
      rows: unresolvedRows.slice(0, maxRowsPerSection),
      warnings: ["Bridge, accumulator, PrivateNote, DEX, or unknown flows must stay unresolved until decoded."],
    },
  ];
}

function bridgeStatus(input: {
  readonly transactionCount: number;
  readonly messageCount: number;
  readonly unresolvedRowCount: number;
  readonly rawOnlyRowCount: number;
  readonly warningCount: number;
}): TokenMovementLiveDashboardBridgeSummary["status"] {
  if (input.transactionCount === 0 && input.messageCount === 0) return "empty";
  if (input.warningCount > 0 || input.unresolvedRowCount > 0) return "needs-review";
  if (input.rawOnlyRowCount > 0) return "needs-decoder";
  return "raw-live-evidence";
}

function formatUnixSeconds(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "unknown time";
  return new Date(value * 1000).toISOString();
}

function normalizeMaxRowsPerSection(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value)) return 8;
  return Math.max(1, Math.min(25, Math.trunc(value)));
}
