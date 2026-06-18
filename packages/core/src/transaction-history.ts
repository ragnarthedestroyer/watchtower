/**
 * Watchtower Batch 53 — Transaction/message history reader foundation
 *
 * Read-only model and safety layer for account transaction/message history.
 * This file does not fetch live chain data by itself, sign messages, operate
 * wallets, broadcast transactions, decode token balances, or claim asset
 * movement. It only defines conservative structures that server/client readers
 * can use before Batch 54 normalizes movements.
 */

import type {
  TokenMovementConfidence,
  TokenMovementEvidence,
  TokenMovementEvidenceKind,
} from "./token-movement";
import type { KnownContractLabel } from "./known-contract-registry";

export type AccountHistorySource =
  | "public-api"
  | "graphql"
  | "indexer"
  | "manual-import"
  | "fixture"
  | "unknown";

export type AccountHistoryNetwork =
  | "mainnet"
  | "shellnet"
  | "local"
  | "unknown";

export type AccountHistoryDirection =
  | "incoming"
  | "outgoing"
  | "self"
  | "unknown";

export type AccountHistoryDecodeState =
  | "raw"
  | "partially-decoded"
  | "decoded"
  | "decode-failed"
  | "not-attempted";

export type AccountHistorySafety =
  | "safe-observation"
  | "partial-observation"
  | "unsafe-to-claim"
  | "invalid";

export type AccountHistoryEvidenceStatus =
  | "observed"
  | "linked"
  | "decoded"
  | "inferred"
  | "unverified";

export type AccountHistoryIdentity = {
  /** Legacy address, for example `0:<64 hex>`, when still available. */
  address: string | null;
  /** State V2 DApp ID, when known. */
  dappId: string | null;
  /** State V2 account ID, when known. */
  accountId: string | null;
  /** Optional user-facing wallet/watchlist name. */
  label: string | null;
};

export type AccountHistoryRequest = {
  identity: AccountHistoryIdentity;
  network: AccountHistoryNetwork;
  source: AccountHistorySource;
  limit: number;
  cursor: string | null;
  fromUnixSeconds: number | null;
  toUnixSeconds: number | null;
  includeRawPayloads: boolean;
  includeLabelHints: boolean;
};

export type AccountHistoryAmountObservation = {
  /** Raw integer amount as provided by the history source. */
  raw: string | null;
  /** Human display value only when unit/decimals are known. */
  display: string | null;
  /** Unit as seen from source, e.g. SHELL, nanovmshell, gas, unknown. */
  unit: string;
  /** True only when the source amount can be treated as a confirmed value. */
  confirmed: boolean;
};

export type AccountHistoryMessage = {
  id: string | null;
  transactionId: string | null;
  createdAtUnixSeconds: number | null;
  direction: AccountHistoryDirection;
  sourceAddress: string | null;
  destinationAddress: string | null;
  sourceLabel: KnownContractLabel | null;
  destinationLabel: KnownContractLabel | null;
  value: AccountHistoryAmountObservation;
  bodyHash: string | null;
  bodyBase64: string | null;
  decodedMethod: string | null;
  decodedParams: Record<string, unknown> | null;
  decodeState: AccountHistoryDecodeState;
  evidenceStatus: AccountHistoryEvidenceStatus;
  confidence: TokenMovementConfidence;
  warnings: string[];
};

export type AccountHistoryTransaction = {
  id: string;
  accountAddress: string | null;
  accountDappId: string | null;
  accountId: string | null;
  logicalTime: string | null;
  hash: string | null;
  createdAtUnixSeconds: number | null;
  status: "finalized" | "pending" | "failed" | "unknown";
  totalFees: AccountHistoryAmountObservation;
  inboundMessage: AccountHistoryMessage | null;
  outboundMessages: AccountHistoryMessage[];
  raw: Record<string, unknown> | null;
  decodeState: AccountHistoryDecodeState;
  safety: AccountHistorySafety;
  confidence: TokenMovementConfidence;
  likelyAction: string | null;
  warnings: string[];
  evidence: TokenMovementEvidence[];
};

export type AccountHistoryResponse = {
  request: AccountHistoryRequest;
  generatedAt: string;
  nextCursor: string | null;
  transactions: AccountHistoryTransaction[];
  warnings: string[];
};

export type AccountHistoryReaderCapability = {
  source: AccountHistorySource;
  canReadTransactions: boolean;
  canReadMessages: boolean;
  canReadRawPayloads: boolean;
  canDecodeBodies: boolean;
  notes: string[];
  warnings: string[];
};

export const DEFAULT_ACCOUNT_HISTORY_LIMIT = 25;
export const MAX_ACCOUNT_HISTORY_LIMIT = 100;

export function normalizeHistoryAddress(address: string | null | undefined): string | null {
  if (!address) {
    return null;
  }

  const trimmed = address.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.toLowerCase();
}

export function clampAccountHistoryLimit(limit: number | null | undefined): number {
  if (typeof limit !== "number" || Number.isNaN(limit) || limit <= 0) {
    return DEFAULT_ACCOUNT_HISTORY_LIMIT;
  }

  return Math.min(Math.floor(limit), MAX_ACCOUNT_HISTORY_LIMIT);
}

export function createAccountHistoryRequest(input: Partial<AccountHistoryRequest>): AccountHistoryRequest {
  return {
    identity: {
      address: normalizeHistoryAddress(input.identity?.address ?? null),
      dappId: input.identity?.dappId ?? null,
      accountId: input.identity?.accountId ?? null,
      label: input.identity?.label ?? null,
    },
    network: input.network ?? "unknown",
    source: input.source ?? "unknown",
    limit: clampAccountHistoryLimit(input.limit),
    cursor: input.cursor ?? null,
    fromUnixSeconds: input.fromUnixSeconds ?? null,
    toUnixSeconds: input.toUnixSeconds ?? null,
    includeRawPayloads: input.includeRawPayloads ?? false,
    includeLabelHints: input.includeLabelHints ?? true,
  };
}

export function createUnknownAmountObservation(unit = "unknown"): AccountHistoryAmountObservation {
  return {
    raw: null,
    display: null,
    unit,
    confirmed: false,
  };
}

export function createRawMessageObservation(input: Partial<AccountHistoryMessage>): AccountHistoryMessage {
  const warnings = [...(input.warnings ?? [])];

  if (!input.id && !input.bodyHash && !input.bodyBase64) {
    warnings.push("Message has no stable id, body hash, or raw body evidence yet.");
  }

  if (!input.sourceAddress && !input.destinationAddress) {
    warnings.push("Message direction cannot be proven because both source and destination are unknown.");
  }

  return {
    id: input.id ?? null,
    transactionId: input.transactionId ?? null,
    createdAtUnixSeconds: input.createdAtUnixSeconds ?? null,
    direction: input.direction ?? "unknown",
    sourceAddress: normalizeHistoryAddress(input.sourceAddress ?? null),
    destinationAddress: normalizeHistoryAddress(input.destinationAddress ?? null),
    sourceLabel: input.sourceLabel ?? null,
    destinationLabel: input.destinationLabel ?? null,
    value: input.value ?? createUnknownAmountObservation(),
    bodyHash: input.bodyHash ?? null,
    bodyBase64: input.bodyBase64 ?? null,
    decodedMethod: input.decodedMethod ?? null,
    decodedParams: input.decodedParams ?? null,
    decodeState: input.decodeState ?? "not-attempted",
    evidenceStatus: input.evidenceStatus ?? "observed",
    confidence: input.confidence ?? "unknown",
    warnings,
  };
}

export function classifyTransactionSafety(transaction: Pick<AccountHistoryTransaction, "inboundMessage" | "outboundMessages" | "decodeState" | "hash" | "logicalTime">): AccountHistorySafety {
  if (!transaction.hash && !transaction.logicalTime) {
    return "invalid";
  }

  if (transaction.decodeState === "decoded") {
    return "safe-observation";
  }

  if (transaction.decodeState === "partially-decoded") {
    return "partial-observation";
  }

  const hasMessageEvidence = Boolean(transaction.inboundMessage) || transaction.outboundMessages.length > 0;
  if (hasMessageEvidence) {
    return "partial-observation";
  }

  return "unsafe-to-claim";
}

export function createRawTransactionObservation(input: Partial<AccountHistoryTransaction> & { id: string }): AccountHistoryTransaction {
  const inboundMessage = input.inboundMessage ?? null;
  const outboundMessages = input.outboundMessages ?? [];
  const decodeState = input.decodeState ?? "not-attempted";
  const base: AccountHistoryTransaction = {
    id: input.id,
    accountAddress: normalizeHistoryAddress(input.accountAddress ?? null),
    accountDappId: input.accountDappId ?? null,
    accountId: input.accountId ?? null,
    logicalTime: input.logicalTime ?? null,
    hash: input.hash ?? null,
    createdAtUnixSeconds: input.createdAtUnixSeconds ?? null,
    status: input.status ?? "unknown",
    totalFees: input.totalFees ?? createUnknownAmountObservation("gas"),
    inboundMessage,
    outboundMessages,
    raw: input.raw ?? null,
    decodeState,
    safety: "unsafe-to-claim",
    confidence: input.confidence ?? "unknown",
    likelyAction: input.likelyAction ?? null,
    warnings: [...(input.warnings ?? [])],
    evidence: input.evidence ?? [],
  };

  base.safety = classifyTransactionSafety(base);

  if (base.safety !== "safe-observation") {
    base.warnings.push("Transaction is raw or partially decoded; do not present it as confirmed token movement.");
  }

  return base;
}

export function transactionToMovementEvidence(transaction: AccountHistoryTransaction): TokenMovementEvidence {
  const kind: TokenMovementEvidenceKind = "transaction";
  return {
    kind,
    source: "account-history-reader",
    id: transaction.hash ?? transaction.logicalTime ?? transaction.id,
    description: transaction.likelyAction ?? "Observed account transaction history record.",
    confidence: transaction.confidence,
  };
}

export const ACCOUNT_HISTORY_READER_CAPABILITIES: AccountHistoryReaderCapability[] = [
  {
    source: "graphql",
    canReadTransactions: true,
    canReadMessages: true,
    canReadRawPayloads: true,
    canDecodeBodies: false,
    notes: [
      "GraphQL/history data can provide evidence for transaction and message existence.",
      "Token movement decoding remains a later normalization step.",
    ],
    warnings: [
      "Raw message values are not enough to prove TIP-3/NACKL/USDC movement without decoding and contract context.",
    ],
  },
  {
    source: "public-api",
    canReadTransactions: true,
    canReadMessages: false,
    canReadRawPayloads: false,
    canDecodeBodies: false,
    notes: ["Public API history support may be limited by endpoint availability and rate limits."],
    warnings: ["Public API responses must be treated as observational evidence until cross-checked."],
  },
  {
    source: "manual-import",
    canReadTransactions: true,
    canReadMessages: true,
    canReadRawPayloads: true,
    canDecodeBodies: false,
    notes: ["Manual imports are useful for incident reports and screenshots/exported JSON."],
    warnings: ["Manual imports need provenance notes and should not be treated as independent proof."],
  },
];

export const DEMO_SHELL_ACCUMULATOR_HISTORY_RESPONSE: AccountHistoryResponse = {
  request: createAccountHistoryRequest({
    identity: {
      address: "0:example-user-wallet-placeholder",
      dappId: null,
      accountId: null,
      label: "example watched wallet",
    },
    network: "mainnet",
    source: "fixture",
    limit: 10,
    includeRawPayloads: false,
    includeLabelHints: true,
  }),
  generatedAt: "1970-01-01T00:00:00.000Z",
  nextCursor: null,
  transactions: [
    createRawTransactionObservation({
      id: "demo-shell-accumulator-incident-raw-history",
      accountAddress: "0:example-user-wallet-placeholder",
      logicalTime: "unknown-lt",
      hash: null,
      createdAtUnixSeconds: null,
      status: "unknown",
      decodeState: "not-attempted",
      confidence: "possible",
      likelyAction: "Possible outgoing SHELL-related interaction with an accumulator/recovery contract.",
      outboundMessages: [
        createRawMessageObservation({
          id: "demo-out-message-placeholder",
          direction: "outgoing",
          sourceAddress: "0:example-user-wallet-placeholder",
          destinationAddress: "0:example-accumulator-placeholder",
          value: {
            raw: null,
            display: "~30,000 SHELL reported by user; not decoded by Watchtower yet",
            unit: "SHELL",
            confirmed: false,
          },
          decodeState: "not-attempted",
          evidenceStatus: "unverified",
          confidence: "possible",
          warnings: [
            "This is a fixture for the reported accumulator incident, not live chain proof.",
            "Batch 53 can model the history row but cannot yet prove token movement.",
          ],
        }),
      ],
      warnings: [
        "Demo record only. Replace placeholders with observed transaction/message evidence before reporting.",
      ],
    }),
  ],
  warnings: [
    "Batch 53 history output is evidence-first and must not be displayed as confirmed token movement until Batch 54 normalization validates it.",
  ],
};
