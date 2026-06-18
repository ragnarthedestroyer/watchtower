/**
 * Watchtower Batch 54 — Token movement normalizer
 *
 * Converts Batch 53 transaction/message observations into conservative
 * TokenMovement candidates. This file does not fetch chain data, sign,
 * broadcast, operate wallets, custody assets, or claim confirmed decoding
 * unless the source observation already contains confirmed decoded evidence.
 */

import type {
  TokenMovement,
  TokenMovementAmount,
  TokenMovementConfidence,
  TokenMovementDirection,
  TokenMovementHistory,
  TokenMovementParty,
  TokenMovementToken,
  TokenMovementUncertainty,
} from "./token-movement";
import { createParty, createUnknownAmount, UNKNOWN_TOKEN, summarizeMovement } from "./token-movement";
import type { KnownContractEntry, KnownContractLabel } from "./known-contract-registry";
import { labelKnownContractAddress, labelTokenMovement } from "./known-contract-registry";
import type {
  AccountHistoryAmountObservation,
  AccountHistoryMessage,
  AccountHistoryResponse,
  AccountHistoryTransaction,
} from "./transaction-history";
import { transactionToMovementEvidence } from "./transaction-history";

export type TokenMovementNormalizationMode =
  | "strict"
  | "evidence-first"
  | "research";

export type TokenMovementNormalizationDecision =
  | "candidate-created"
  | "candidate-skipped"
  | "needs-decoder"
  | "unsafe-to-claim";

export type TokenMovementNormalizerInput = {
  history: AccountHistoryResponse;
  registry?: KnownContractEntry[];
  mode?: TokenMovementNormalizationMode;
  includeUnsafeCandidates?: boolean;
};

export type TokenMovementNormalizerWarning = {
  transactionId: string | null;
  messageId: string | null;
  decision: TokenMovementNormalizationDecision;
  message: string;
};

export type TokenMovementNormalizationResult = {
  history: TokenMovementHistory;
  decisions: TokenMovementNormalizerWarning[];
  warnings: string[];
};

export const NORMALIZER_UNCONFIRMED_WARNING =
  "Normalized movement is a candidate only. It must not be shown as confirmed asset history unless proofStatus is confirmed.";

function confidenceRank(confidence: TokenMovementConfidence): number {
  switch (confidence) {
    case "confirmed":
      return 4;
    case "probable":
      return 3;
    case "possible":
      return 2;
    case "unknown":
    default:
      return 1;
  }
}

function lowestConfidence(...values: TokenMovementConfidence[]): TokenMovementConfidence {
  return values.reduce<TokenMovementConfidence>((lowest, value) =>
    confidenceRank(value) < confidenceRank(lowest) ? value : lowest,
  values[0] ?? "unknown");
}

function directionFromMessage(message: AccountHistoryMessage): TokenMovementDirection {
  if (message.direction === "incoming") return "incoming";
  if (message.direction === "outgoing") return "outgoing";
  if (message.direction === "self") return "internal";
  return "unknown";
}

function partyFromAddress(address: string | null, label: KnownContractLabel | null, fallbackRole: TokenMovementParty["role"]): TokenMovementParty {
  return createParty({
    address,
    label: label?.label ?? null,
    role: label?.entry ? label.role : fallbackRole,
    dappId: label?.entry?.dappId ?? null,
    accountId: label?.entry?.accountId ?? null,
  });
}

function amountFromObservation(value: AccountHistoryAmountObservation): TokenMovementAmount {
  if (!value.raw && !value.display) {
    return createUnknownAmount(value.unit || "unknown");
  }

  return {
    raw: value.raw,
    display: value.display,
    decimals: null,
    unit: value.unit || "unknown",
    confirmed: value.confirmed,
  };
}

function inferToken(value: AccountHistoryAmountObservation, sourceLabel: KnownContractLabel | null, destinationLabel: KnownContractLabel | null): TokenMovementToken {
  const unit = value.unit.trim().toUpperCase();
  const labelSymbols = [
    ...(sourceLabel?.entry?.tokenSymbols ?? []),
    ...(destinationLabel?.entry?.tokenSymbols ?? []),
  ].map((item) => item.toUpperCase());
  const labelFamilies = [
    ...(sourceLabel?.entry?.assetFamilies ?? []),
    ...(destinationLabel?.entry?.assetFamilies ?? []),
  ];

  if (unit === "NACKL" || labelSymbols.includes("NACKL") || labelFamilies.includes("NACKL")) {
    return { family: "NACKL", symbol: "NACKL", tokenType: 1, rootContract: null, walletContract: null, contractLabel: null, isKnown: true };
  }

  if (unit === "SHELL" || unit === "VMSHELL" || unit === "NANOVMSHELL" || labelSymbols.includes("SHELL") || labelFamilies.includes("SHELL")) {
    return { family: "SHELL", symbol: "SHELL", tokenType: 2, rootContract: null, walletContract: null, contractLabel: null, isKnown: true };
  }

  if (unit === "USDC" || labelSymbols.includes("USDC") || labelFamilies.includes("USDC")) {
    return { family: "USDC", symbol: "USDC", tokenType: 3, rootContract: null, walletContract: null, contractLabel: null, isKnown: true };
  }

  if (labelFamilies.includes("TIP3") || sourceLabel?.role === "token-wallet" || destinationLabel?.role === "token-wallet" || sourceLabel?.role === "token-root" || destinationLabel?.role === "token-root") {
    return { family: "TIP3", symbol: unit && unit !== "UNKNOWN" ? unit : "TIP-3", tokenType: null, rootContract: null, walletContract: null, contractLabel: "TIP-3 candidate", isKnown: false };
  }

  return UNKNOWN_TOKEN;
}

function likelyActionForMessage(message: AccountHistoryMessage, token: TokenMovementToken, destinationLabel: KnownContractLabel | null): string {
  if (message.decodedMethod) {
    return `Observed ${message.decodedMethod} message`;
  }

  if (destinationLabel?.role === "accumulator") {
    return `Possible ${token.symbol} transfer or interaction with accumulator`;
  }

  if (destinationLabel?.role === "bridge") {
    return `Possible ${token.symbol} bridge interaction`;
  }

  if (destinationLabel?.role === "token-wallet" || destinationLabel?.role === "token-root") {
    return `Possible ${token.symbol} token contract interaction`;
  }

  if (token.family !== "UNKNOWN") {
    return `Possible ${token.symbol} movement candidate`;
  }

  return "Observed message; token movement not decoded";
}

function createMovementId(transaction: AccountHistoryTransaction, message: AccountHistoryMessage, index: number): string {
  const txPart = transaction.hash ?? transaction.logicalTime ?? transaction.id;
  const msgPart = message.id ?? message.bodyHash ?? `message-${index}`;
  return `movement-candidate:${txPart}:${msgPart}`;
}

function proofStatusFor(transaction: AccountHistoryTransaction, message: AccountHistoryMessage, amount: TokenMovementAmount, token: TokenMovementToken): TokenMovementConfidence {
  if (transaction.safety === "safe-observation" && message.decodeState === "decoded" && amount.confirmed && token.family !== "UNKNOWN") {
    return lowestConfidence(transaction.confidence, message.confidence, "confirmed");
  }

  if (transaction.safety === "partial-observation" || message.decodeState === "partially-decoded") {
    return lowestConfidence(transaction.confidence, message.confidence, "possible");
  }

  if (message.sourceAddress || message.destinationAddress || amount.raw || amount.display) {
    return "possible";
  }

  return "unknown";
}

function buildUncertainty(transaction: AccountHistoryTransaction, message: AccountHistoryMessage, amount: TokenMovementAmount, token: TokenMovementToken): TokenMovementUncertainty[] {
  const uncertainty: TokenMovementUncertainty[] = [];

  if (token.family === "UNKNOWN") {
    uncertainty.push({ field: "token", reason: "Token identity was not decoded from a trusted token contract or event.", severity: "high" });
  }

  if (!amount.confirmed) {
    uncertainty.push({ field: "amount", reason: "Amount is raw, missing, approximate, or not confirmed by decoded token evidence.", severity: "high" });
  }

  if (message.decodeState !== "decoded") {
    uncertainty.push({ field: "message.decodeState", reason: `Message decode state is ${message.decodeState}.`, severity: message.decodeState === "partially-decoded" ? "medium" : "high" });
  }

  if (transaction.safety !== "safe-observation") {
    uncertainty.push({ field: "transaction.safety", reason: `Transaction safety is ${transaction.safety}.`, severity: transaction.safety === "partial-observation" ? "medium" : "high" });
  }

  if (!message.sourceAddress || !message.destinationAddress) {
    uncertainty.push({ field: "parties", reason: "Source or destination address is missing.", severity: "high" });
  }

  return uncertainty;
}

export function normalizeMessageToTokenMovement(
  transaction: AccountHistoryTransaction,
  message: AccountHistoryMessage,
  index: number,
  registry: KnownContractEntry[] = [],
): TokenMovement {
  const sourceLabel = message.sourceLabel ?? labelKnownContractAddress(message.sourceAddress, registry);
  const destinationLabel = message.destinationLabel ?? labelKnownContractAddress(message.destinationAddress, registry);
  const amount = amountFromObservation(message.value);
  const token = inferToken(message.value, sourceLabel, destinationLabel);
  const likelyAction = likelyActionForMessage(message, token, destinationLabel);
  const proofStatus = proofStatusFor(transaction, message, amount, token);
  const movement: TokenMovement = {
    id: createMovementId(transaction, message, index),
    observedAt: message.createdAtUnixSeconds
      ? new Date(message.createdAtUnixSeconds * 1000).toISOString()
      : transaction.createdAtUnixSeconds
        ? new Date(transaction.createdAtUnixSeconds * 1000).toISOString()
        : null,
    logicalTime: transaction.logicalTime,
    direction: directionFromMessage(message),
    token,
    amount,
    from: partyFromAddress(message.sourceAddress, sourceLabel, "unknown"),
    to: partyFromAddress(message.destinationAddress, destinationLabel, "unknown"),
    via: transaction.accountAddress ? createParty({ address: transaction.accountAddress, label: "observed account", role: "wallet", dappId: transaction.accountDappId, accountId: transaction.accountId }) : null,
    likelyAction,
    summary: "",
    proofStatus,
    evidence: [
      transactionToMovementEvidence(transaction),
      {
        kind: "message",
        id: message.id ?? message.bodyHash,
        source: "account-history-reader",
        description: message.decodedMethod ? `Observed message decoded as ${message.decodedMethod}.` : "Observed account message; token payload may still be raw or undecoded.",
        confidence: message.confidence,
      },
    ],
    uncertainty: buildUncertainty(transaction, message, amount, token),
    warnings: [
      NORMALIZER_UNCONFIRMED_WARNING,
      ...transaction.warnings,
      ...message.warnings,
      ...sourceLabel.warnings,
      ...destinationLabel.warnings,
    ],
    tags: [
      "normalized-candidate",
      token.family.toLowerCase(),
      directionFromMessage(message),
      destinationLabel.role,
    ].filter((item, index, all) => item && all.indexOf(item) === index),
  };

  const labeled = labelTokenMovement(movement, registry);
  return {
    ...labeled,
    summary: summarizeMovement(labeled),
  };
}

function shouldCreateCandidate(transaction: AccountHistoryTransaction, message: AccountHistoryMessage, includeUnsafeCandidates: boolean): boolean {
  if (transaction.safety === "invalid") return false;
  if (transaction.safety === "unsafe-to-claim" && !includeUnsafeCandidates) return false;
  return Boolean(message.sourceAddress || message.destinationAddress || message.value.raw || message.value.display || message.decodedMethod);
}

export function normalizeTransactionToTokenMovements(
  transaction: AccountHistoryTransaction,
  registry: KnownContractEntry[] = [],
  includeUnsafeCandidates = false,
): { movements: TokenMovement[]; decisions: TokenMovementNormalizerWarning[] } {
  const allMessages = [
    ...(transaction.inboundMessage ? [transaction.inboundMessage] : []),
    ...transaction.outboundMessages,
  ];

  const movements: TokenMovement[] = [];
  const decisions: TokenMovementNormalizerWarning[] = [];

  allMessages.forEach((message, index) => {
    if (!shouldCreateCandidate(transaction, message, includeUnsafeCandidates)) {
      decisions.push({
        transactionId: transaction.hash ?? transaction.logicalTime ?? transaction.id,
        messageId: message.id,
        decision: transaction.safety === "unsafe-to-claim" ? "unsafe-to-claim" : "candidate-skipped",
        message: "Message was not normalized because evidence is insufficient for even a candidate movement.",
      });
      return;
    }

    const movement = normalizeMessageToTokenMovement(transaction, message, index, registry);
    movements.push(movement);
    decisions.push({
      transactionId: transaction.hash ?? transaction.logicalTime ?? transaction.id,
      messageId: message.id,
      decision: movement.proofStatus === "confirmed" ? "candidate-created" : "needs-decoder",
      message: movement.proofStatus === "confirmed"
        ? "Confirmed movement candidate created from decoded evidence."
        : "Unconfirmed movement candidate created; decoder and proof review still required.",
    });
  });

  if (allMessages.length === 0) {
    decisions.push({
      transactionId: transaction.hash ?? transaction.logicalTime ?? transaction.id,
      messageId: null,
      decision: "candidate-skipped",
      message: "Transaction has no message observations to normalize.",
    });
  }

  return { movements, decisions };
}

export function normalizeAccountHistoryToTokenMovements(input: TokenMovementNormalizerInput): TokenMovementNormalizationResult {
  const registry = input.registry ?? [];
  const includeUnsafeCandidates = input.includeUnsafeCandidates ?? input.mode === "research";
  const movements: TokenMovement[] = [];
  const decisions: TokenMovementNormalizerWarning[] = [];

  for (const transaction of input.history.transactions) {
    const normalized = normalizeTransactionToTokenMovements(transaction, registry, includeUnsafeCandidates);
    movements.push(...normalized.movements);
    decisions.push(...normalized.decisions);
  }

  const subject = createParty({
    address: input.history.request.identity.address,
    label: input.history.request.identity.label,
    role: "wallet",
    dappId: input.history.request.identity.dappId,
    accountId: input.history.request.identity.accountId,
  });

  const warnings = [
    "Batch 54 normalizes candidates only; unresolved rows must stay visibly uncertain.",
    ...input.history.warnings,
    ...decisions.filter((item) => item.decision !== "candidate-created").map((item) => item.message),
  ].filter((item, index, all) => all.indexOf(item) === index);

  return {
    history: {
      subject,
      generatedAt: new Date().toISOString(),
      movements,
      warnings,
    },
    decisions,
    warnings,
  };
}
