/**
 * Watchtower Batch 79 — Live raw token movement history frontend view
 *
 * Converts on-the-fly AccountHistoryResponse data from the live raw history
 * route into conservative frontend rows. This is a read-only view model only:
 * it does not store wallet history, decode token bodies, sign transactions,
 * operate wallets, or claim confirmed NACKL/SHELL/USDC movement.
 */

import type {
  AccountHistoryMessage,
  AccountHistoryResponse,
  AccountHistorySafety,
  AccountHistoryTransaction,
} from "./transaction-history";
import type { TokenMovementConfidence } from "./token-movement";

export type TokenMovementLiveRawHistoryViewStatus =
  | "empty"
  | "raw-evidence"
  | "partial-evidence"
  | "decoded-evidence"
  | "needs-review";

export interface TokenMovementLiveRawHistoryMessagePreview {
  readonly id: string;
  readonly direction: string;
  readonly source: string;
  readonly destination: string;
  readonly amount: string;
  readonly unit: string;
  readonly bodyHash: string;
  readonly decodeState: string;
  readonly warningCount: number;
}

export interface TokenMovementLiveRawHistoryRow {
  readonly id: string;
  readonly createdAtUnixSeconds: number | null;
  readonly whenLabel: string;
  readonly hash: string;
  readonly logicalTime: string;
  readonly safety: AccountHistorySafety;
  readonly confidence: TokenMovementConfidence;
  readonly decodeState: string;
  readonly likelyAction: string;
  readonly inboundMessage: TokenMovementLiveRawHistoryMessagePreview | null;
  readonly outboundMessages: readonly TokenMovementLiveRawHistoryMessagePreview[];
  readonly warningCount: number;
}

export interface TokenMovementLiveRawHistorySummary {
  readonly status: TokenMovementLiveRawHistoryViewStatus;
  readonly transactionCount: number;
  readonly inboundMessageCount: number;
  readonly outboundMessageCount: number;
  readonly rawOnlyTransactionCount: number;
  readonly partiallyDecodedTransactionCount: number;
  readonly decodedTransactionCount: number;
  readonly unsafeToClaimCount: number;
  readonly warningCount: number;
  readonly privacyMode: "on-the-fly-no-storage";
}

export interface TokenMovementLiveRawHistoryViewOptions {
  readonly title?: string;
  readonly watchedAddress?: string;
  readonly maxRows?: number;
}

export interface TokenMovementLiveRawHistoryView {
  readonly title: string;
  readonly generatedAt: string;
  readonly watchedAddress: string;
  readonly source: string;
  readonly summary: TokenMovementLiveRawHistorySummary;
  readonly rows: readonly TokenMovementLiveRawHistoryRow[];
  readonly warnings: readonly string[];
  readonly safetyNotes: readonly string[];
}

export function createTokenMovementLiveRawHistoryView(
  response: AccountHistoryResponse,
  options: TokenMovementLiveRawHistoryViewOptions = {},
): TokenMovementLiveRawHistoryView {
  const maxRows = normalizeMaxRows(options.maxRows);
  const rows = response.transactions
    .slice(0, maxRows)
    .map((transaction) => createLiveRawHistoryRow(transaction));

  const summary = summarizeLiveRawHistory(response.transactions, response.warnings);

  return {
    title: options.title ?? "Live raw token movement history",
    generatedAt: response.generatedAt,
    watchedAddress: options.watchedAddress
      ?? response.request.identity.address
      ?? response.request.identity.accountId
      ?? "unknown account",
    source: response.request.source,
    summary,
    rows,
    warnings: response.warnings,
    safetyNotes: [
      "This view is live and on-the-fly only; it must not persist wallet history or searched addresses.",
      "Rows are raw transaction/message observations, not confirmed decoded token transfers yet.",
      "Token classification must remain conservative until decoder evidence is available.",
    ],
  };
}

export function summarizeLiveRawHistory(
  transactions: readonly AccountHistoryTransaction[],
  warnings: readonly string[] = [],
): TokenMovementLiveRawHistorySummary {
  const inboundMessageCount = transactions.filter((transaction) => transaction.inboundMessage !== null).length;
  const outboundMessageCount = transactions.reduce(
    (total, transaction) => total + transaction.outboundMessages.length,
    0,
  );
  const rawOnlyTransactionCount = transactions.filter(
    (transaction) => transaction.decodeState === "raw" || transaction.decodeState === "not-attempted",
  ).length;
  const partiallyDecodedTransactionCount = transactions.filter(
    (transaction) => transaction.decodeState === "partially-decoded",
  ).length;
  const decodedTransactionCount = transactions.filter(
    (transaction) => transaction.decodeState === "decoded",
  ).length;
  const unsafeToClaimCount = transactions.filter(
    (transaction) => transaction.safety === "unsafe-to-claim" || transaction.safety === "invalid",
  ).length;

  return {
    status: liveRawHistoryStatus({
      transactionCount: transactions.length,
      rawOnlyTransactionCount,
      partiallyDecodedTransactionCount,
      decodedTransactionCount,
      unsafeToClaimCount,
      warningCount: warnings.length,
    }),
    transactionCount: transactions.length,
    inboundMessageCount,
    outboundMessageCount,
    rawOnlyTransactionCount,
    partiallyDecodedTransactionCount,
    decodedTransactionCount,
    unsafeToClaimCount,
    warningCount: warnings.length,
    privacyMode: "on-the-fly-no-storage",
  };
}

function liveRawHistoryStatus(input: {
  readonly transactionCount: number;
  readonly rawOnlyTransactionCount: number;
  readonly partiallyDecodedTransactionCount: number;
  readonly decodedTransactionCount: number;
  readonly unsafeToClaimCount: number;
  readonly warningCount: number;
}): TokenMovementLiveRawHistoryViewStatus {
  if (input.transactionCount === 0) return "empty";
  if (input.unsafeToClaimCount > 0 || input.warningCount > 0) return "needs-review";
  if (input.decodedTransactionCount > 0) return "decoded-evidence";
  if (input.partiallyDecodedTransactionCount > 0) return "partial-evidence";
  return "raw-evidence";
}

function createLiveRawHistoryRow(transaction: AccountHistoryTransaction): TokenMovementLiveRawHistoryRow {
  return {
    id: transaction.id,
    createdAtUnixSeconds: transaction.createdAtUnixSeconds,
    whenLabel: formatUnixSeconds(transaction.createdAtUnixSeconds),
    hash: transaction.hash ?? "unknown hash",
    logicalTime: transaction.logicalTime ?? "unknown lt",
    safety: transaction.safety,
    confidence: transaction.confidence,
    decodeState: transaction.decodeState,
    likelyAction: transaction.likelyAction ?? "Raw transaction/message evidence",
    inboundMessage: transaction.inboundMessage ? createMessagePreview(transaction.inboundMessage) : null,
    outboundMessages: transaction.outboundMessages.map((message) => createMessagePreview(message)),
    warningCount: transaction.warnings.length,
  };
}

function createMessagePreview(message: AccountHistoryMessage): TokenMovementLiveRawHistoryMessagePreview {
  return {
    id: message.id ?? message.bodyHash ?? "unknown message",
    direction: message.direction,
    source: message.sourceAddress ?? "unknown source",
    destination: message.destinationAddress ?? "unknown destination",
    amount: message.value.display ?? message.value.raw ?? "unknown amount",
    unit: message.value.unit,
    bodyHash: message.bodyHash ?? "no body hash",
    decodeState: message.decodeState,
    warningCount: message.warnings.length,
  };
}

function formatUnixSeconds(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "unknown time";
  return new Date(value * 1000).toISOString();
}

function normalizeMaxRows(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value)) return 12;
  return Math.max(1, Math.min(50, Math.trunc(value)));
}
