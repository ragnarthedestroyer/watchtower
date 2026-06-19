/**
 * Watchtower Batch 81 — Live raw decoder worklist foundation
 *
 * Turns live AccountHistoryResponse data into a decoder/review worklist.
 * This is still read-only and evidence-first: it identifies what must be
 * decoded or reviewed before Watchtower can claim NACKL/SHELL/USDC movement.
 */

import type {
  AccountHistoryDirection,
  AccountHistoryMessage,
  AccountHistoryResponse,
  AccountHistoryTransaction,
} from "./transaction-history";

export type TokenMovementLiveDecoderWorklistCategory =
  | "body-decoder-needed"
  | "decoded-method-review"
  | "native-value-review"
  | "mining-reward-proof-needed"
  | "contract-route-review"
  | "unusable-evidence";

export type TokenMovementLiveDecoderWorklistPriority = "high" | "medium" | "low";

export interface TokenMovementLiveDecoderWorklistItem {
  readonly id: string;
  readonly category: TokenMovementLiveDecoderWorklistCategory;
  readonly priority: TokenMovementLiveDecoderWorklistPriority;
  readonly transactionHash: string;
  readonly logicalTime: string;
  readonly whenLabel: string;
  readonly direction: AccountHistoryDirection;
  readonly source: string;
  readonly destination: string;
  readonly valueLabel: string;
  readonly bodyEvidence: string;
  readonly decodedMethod: string;
  readonly decodeState: string;
  readonly confidence: string;
  readonly task: string;
  readonly requiredProof: string;
  readonly warnings: readonly string[];
}

export interface TokenMovementLiveDecoderWorklistSection {
  readonly category: TokenMovementLiveDecoderWorklistCategory;
  readonly title: string;
  readonly description: string;
  readonly emptyState: string;
  readonly items: readonly TokenMovementLiveDecoderWorklistItem[];
}

export interface TokenMovementLiveDecoderWorklistSummary {
  readonly transactionCount: number;
  readonly messageCount: number;
  readonly totalItems: number;
  readonly highPriorityItems: number;
  readonly bodyDecoderNeeded: number;
  readonly decodedMethodReview: number;
  readonly miningRewardProofNeeded: number;
  readonly contractRouteReview: number;
  readonly unusableEvidence: number;
  readonly privacyMode: "on-the-fly-no-storage";
}

export interface TokenMovementLiveDecoderWorklistOptions {
  readonly title?: string;
  readonly watchedAddress?: string;
  readonly maxItemsPerSection?: number;
}

export interface TokenMovementLiveDecoderWorklist {
  readonly title: string;
  readonly generatedAt: string;
  readonly watchedAddress: string;
  readonly summary: TokenMovementLiveDecoderWorklistSummary;
  readonly sections: readonly TokenMovementLiveDecoderWorklistSection[];
  readonly safetyNotes: readonly string[];
}

export function createTokenMovementLiveDecoderWorklist(
  response: AccountHistoryResponse,
  options: TokenMovementLiveDecoderWorklistOptions = {},
): TokenMovementLiveDecoderWorklist {
  const maxItemsPerSection = normalizeMaxItemsPerSection(options.maxItemsPerSection);
  const allItems = response.transactions.flatMap((transaction) => itemsFromTransaction(transaction));
  const sections = createWorklistSections(allItems, maxItemsPerSection);
  const summary = summarizeWorklist(response, allItems);

  return {
    title: options.title ?? "Live decoder worklist",
    generatedAt: response.generatedAt,
    watchedAddress: options.watchedAddress
      ?? response.request.identity.address
      ?? response.request.identity.accountId
      ?? "unknown account",
    summary,
    sections,
    safetyNotes: [
      "The worklist identifies what still needs decoding; it does not confirm token movement.",
      "NACKL mining rewards require source/contract proof and must not be inferred from inbound value alone.",
      "SHELL, USDC, and TIP-3 movements require token-body/event decoding or verified token-contract context.",
      "Keep this view on-the-fly only: do not persist wallet history, searched addresses, or generated worklist rows.",
    ],
  };
}

function itemsFromTransaction(transaction: AccountHistoryTransaction): readonly TokenMovementLiveDecoderWorklistItem[] {
  const messages = [
    ...(transaction.inboundMessage ? [transaction.inboundMessage] : []),
    ...transaction.outboundMessages,
  ];

  if (messages.length === 0) {
    return [itemForTransactionWithoutMessages(transaction)];
  }

  return messages.map((message, index) => itemFromMessage(transaction, message, index));
}

function itemForTransactionWithoutMessages(
  transaction: AccountHistoryTransaction,
): TokenMovementLiveDecoderWorklistItem {
  return {
    id: `${transaction.id}:no-message-evidence`,
    category: "unusable-evidence",
    priority: "low",
    transactionHash: transaction.hash ?? "unknown hash",
    logicalTime: transaction.logicalTime ?? "unknown lt",
    whenLabel: formatUnixSeconds(transaction.createdAtUnixSeconds),
    direction: "unknown",
    source: transaction.accountAddress ?? transaction.accountId ?? "unknown account",
    destination: "unknown destination",
    valueLabel: formatValue(transaction.totalFees.display, transaction.totalFees.raw, transaction.totalFees.unit),
    bodyEvidence: "no message body evidence",
    decodedMethod: "not decoded",
    decodeState: transaction.decodeState,
    confidence: transaction.confidence,
    task: "Keep this transaction as unresolved evidence until message-level data is available.",
    requiredProof: "Need inbound or outbound message evidence before movement classification.",
    warnings: [
      ...transaction.warnings,
      "Transaction has no extracted message rows, so it cannot be used as token movement proof.",
    ],
  };
}

function itemFromMessage(
  transaction: AccountHistoryTransaction,
  message: AccountHistoryMessage,
  index: number,
): TokenMovementLiveDecoderWorklistItem {
  const category = categoryForMessage(message);
  const priority = priorityForMessage(category, message);
  const bodyEvidence = describeBodyEvidence(message);
  const warnings = [
    ...transaction.warnings,
    ...message.warnings,
    warningForCategory(category),
  ];

  return {
    id: message.id ?? `${transaction.id}:message:${index}`,
    category,
    priority,
    transactionHash: transaction.hash ?? "unknown hash",
    logicalTime: transaction.logicalTime ?? "unknown lt",
    whenLabel: formatUnixSeconds(message.createdAtUnixSeconds ?? transaction.createdAtUnixSeconds),
    direction: message.direction,
    source: message.sourceAddress ?? "unknown source",
    destination: message.destinationAddress ?? "unknown destination",
    valueLabel: formatValue(message.value.display, message.value.raw, message.value.unit),
    bodyEvidence,
    decodedMethod: message.decodedMethod ?? "not decoded",
    decodeState: message.decodeState,
    confidence: message.confidence,
    task: taskForCategory(category, message),
    requiredProof: proofForCategory(category),
    warnings,
  };
}

function categoryForMessage(message: AccountHistoryMessage): TokenMovementLiveDecoderWorklistCategory {
  const hasBodyEvidence = Boolean(message.bodyBase64 || message.bodyHash);
  const hasDecodedMethod = Boolean(message.decodedMethod);
  const hasKnownContractLabel = Boolean(message.sourceLabel || message.destinationLabel);
  const hasObservedValue = Boolean(message.value.raw || message.value.display);

  if (hasDecodedMethod || message.decodeState === "decoded" || message.decodeState === "partially-decoded") {
    return "decoded-method-review";
  }

  if (hasBodyEvidence) {
    return "body-decoder-needed";
  }

  if (hasKnownContractLabel) {
    return "contract-route-review";
  }

  if (message.direction === "incoming" && hasObservedValue) {
    return "mining-reward-proof-needed";
  }

  if ((message.direction === "incoming" || message.direction === "outgoing") && hasObservedValue) {
    return "native-value-review";
  }

  return "unusable-evidence";
}

function priorityForMessage(
  category: TokenMovementLiveDecoderWorklistCategory,
  message: AccountHistoryMessage,
): TokenMovementLiveDecoderWorklistPriority {
  if (category === "body-decoder-needed" || category === "decoded-method-review") return "high";
  if (category === "contract-route-review") return "high";
  if (category === "mining-reward-proof-needed") return "medium";
  if (category === "native-value-review" && message.value.confirmed) return "medium";
  return "low";
}

function taskForCategory(
  category: TokenMovementLiveDecoderWorklistCategory,
  message: AccountHistoryMessage,
): string {
  if (category === "body-decoder-needed") {
    return "Decode the message body and map method/params before classifying token movement.";
  }

  if (category === "decoded-method-review") {
    return "Review decoded method and parameters against known token/contract ABI rules.";
  }

  if (category === "contract-route-review") {
    return "Review source/destination contract labels before deciding whether this is direct or contract-routed.";
  }

  if (category === "mining-reward-proof-needed") {
    return "Check whether the inbound value has proven mining reward source evidence; do not infer from value alone.";
  }

  if (category === "native-value-review") {
    return `Review native value evidence for ${message.direction} movement while keeping token identity unconfirmed.`;
  }

  return "Keep unresolved until more transaction/message evidence is available.";
}

function proofForCategory(category: TokenMovementLiveDecoderWorklistCategory): string {
  if (category === "body-decoder-needed") {
    return "Decoded method, decoded parameters, token contract context, and matching account direction.";
  }

  if (category === "decoded-method-review") {
    return "Known ABI/method mapping plus token identity and amount decimals.";
  }

  if (category === "contract-route-review") {
    return "Verified contract registry label and rule for whether this flow is direct, bridge, accumulator, DEX, or PrivateNote.";
  }

  if (category === "mining-reward-proof-needed") {
    return "Verified mining reward source/contract evidence and NACKL unit/decimals.";
  }

  if (category === "native-value-review") {
    return "Confirmed native-unit semantics and direction relative to the watched account.";
  }

  return "Additional message-level evidence.";
}

function warningForCategory(category: TokenMovementLiveDecoderWorklistCategory): string {
  if (category === "mining-reward-proof-needed") {
    return "Inbound value is not enough to call this a NACKL mining reward.";
  }

  if (category === "body-decoder-needed") {
    return "Body evidence exists but has not been decoded into safe token movement yet.";
  }

  if (category === "contract-route-review") {
    return "Contract-routed evidence must stay out of direct transfer visuals until reviewed.";
  }

  if (category === "native-value-review") {
    return "Native value evidence may be fees/gas or chain value; do not label as SHELL/USDC/TIP-3 without decoder context.";
  }

  if (category === "decoded-method-review") {
    return "Decoded method still needs ABI and token context review before user-facing classification.";
  }

  return "Evidence is insufficient for token movement classification.";
}

function createWorklistSections(
  items: readonly TokenMovementLiveDecoderWorklistItem[],
  maxItemsPerSection: number,
): readonly TokenMovementLiveDecoderWorklistSection[] {
  return WORKLIST_SECTION_ORDER.map((category) => {
    const sectionItems = items.filter((item) => item.category === category);
    return {
      category,
      title: titleForCategory(category),
      description: descriptionForCategory(category),
      emptyState: emptyStateForCategory(category),
      items: sectionItems.slice(0, maxItemsPerSection),
    };
  });
}

function summarizeWorklist(
  response: AccountHistoryResponse,
  items: readonly TokenMovementLiveDecoderWorklistItem[],
): TokenMovementLiveDecoderWorklistSummary {
  const messageCount = response.transactions.reduce(
    (total, transaction) => total + (transaction.inboundMessage ? 1 : 0) + transaction.outboundMessages.length,
    0,
  );

  return {
    transactionCount: response.transactions.length,
    messageCount,
    totalItems: items.length,
    highPriorityItems: items.filter((item) => item.priority === "high").length,
    bodyDecoderNeeded: items.filter((item) => item.category === "body-decoder-needed").length,
    decodedMethodReview: items.filter((item) => item.category === "decoded-method-review").length,
    miningRewardProofNeeded: items.filter((item) => item.category === "mining-reward-proof-needed").length,
    contractRouteReview: items.filter((item) => item.category === "contract-route-review").length,
    unusableEvidence: items.filter((item) => item.category === "unusable-evidence").length,
    privacyMode: "on-the-fly-no-storage",
  };
}

const WORKLIST_SECTION_ORDER: readonly TokenMovementLiveDecoderWorklistCategory[] = [
  "body-decoder-needed",
  "decoded-method-review",
  "contract-route-review",
  "mining-reward-proof-needed",
  "native-value-review",
  "unusable-evidence",
];

function titleForCategory(category: TokenMovementLiveDecoderWorklistCategory): string {
  switch (category) {
    case "body-decoder-needed": return "Body decoder needed";
    case "decoded-method-review": return "Decoded method review";
    case "contract-route-review": return "Contract-route review";
    case "mining-reward-proof-needed": return "Mining reward proof needed";
    case "native-value-review": return "Native value review";
    case "unusable-evidence": return "Unusable / incomplete evidence";
  }
}

function descriptionForCategory(category: TokenMovementLiveDecoderWorklistCategory): string {
  switch (category) {
    case "body-decoder-needed": return "Rows with body hash or body payload that need ABI/body decoding before classification.";
    case "decoded-method-review": return "Rows that already expose a method or partial decoding but still need token/contract context.";
    case "contract-route-review": return "Rows touching labeled contracts that must not be shown as simple transfers until reviewed.";
    case "mining-reward-proof-needed": return "Inbound value rows that might be relevant to reward research but are not proven mining rewards.";
    case "native-value-review": return "Incoming/outgoing value rows that need native-unit interpretation.";
    case "unusable-evidence": return "Rows without enough message-level evidence for movement classification.";
  }
}

function emptyStateForCategory(category: TokenMovementLiveDecoderWorklistCategory): string {
  switch (category) {
    case "body-decoder-needed": return "No message body evidence returned in this live history response.";
    case "decoded-method-review": return "No decoded or partially decoded methods returned yet.";
    case "contract-route-review": return "No known contract label evidence returned yet.";
    case "mining-reward-proof-needed": return "No inbound value rows reserved for mining reward proof review.";
    case "native-value-review": return "No simple native value rows available for review.";
    case "unusable-evidence": return "No incomplete rows beyond the review categories above.";
  }
}

function describeBodyEvidence(message: AccountHistoryMessage): string {
  if (message.bodyBase64) return "body payload available";
  if (message.bodyHash) return `body hash ${shorten(message.bodyHash)}`;
  return "no body evidence";
}

function formatValue(display: string | null, raw: string | null, unit: string): string {
  const value = display ?? raw ?? "unknown amount";
  return `${value} ${unit}`.trim();
}

function formatUnixSeconds(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "unknown time";
  return new Date(value * 1000).toISOString();
}

function normalizeMaxItemsPerSection(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value)) return 8;
  return Math.max(1, Math.min(25, Math.trunc(value)));
}

function shorten(value: string): string {
  if (value.length <= 24) return value;
  return `${value.slice(0, 10)}…${value.slice(-10)}`;
}
