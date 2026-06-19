import {
  createAccountHistoryRequest,
  createRawMessageObservation,
  createRawTransactionObservation,
  endpointConfigIsUsableForLiveReads,
  normalizeHistoryAddress,
  type AccountHistoryMessage,
  type AccountHistoryNetwork,
  type AccountHistoryResponse,
  type AccountHistoryTransaction,
  type WatchtowerEndpointConfig,
} from "@watchtower/core";

export type TokenMovementLiveRawHistoryMode = "legacy" | "state_v2";

export interface TokenMovementLiveRawHistoryRequest {
  readonly mode: TokenMovementLiveRawHistoryMode;
  readonly legacyAddress?: string;
  readonly accountId?: string;
  readonly dappId?: string;
  readonly network?: AccountHistoryNetwork;
  readonly limit?: number;
  readonly includeRawPayloads?: boolean;
}

export interface TokenMovementLiveRawHistoryInput {
  readonly endpointConfig: WatchtowerEndpointConfig;
  readonly request: TokenMovementLiveRawHistoryRequest;
  readonly requestTimeoutMs?: number;
}

export interface TokenMovementLiveRawHistoryGraphqlQuery {
  readonly endpoint: string;
  readonly body: {
    readonly query: string;
    readonly variables: Record<string, string | number>;
  };
}

interface GraphqlEnvelope {
  readonly data?: unknown;
  readonly errors?: readonly unknown[];
}

const DEFAULT_LIVE_HISTORY_LIMIT = 25;
const MAX_LIVE_HISTORY_LIMIT = 50;

export function normalizeTokenMovementLiveRawHistoryLimit(limit: number | undefined): number {
  if (typeof limit !== "number" || Number.isNaN(limit) || limit <= 0) return DEFAULT_LIVE_HISTORY_LIMIT;
  return Math.min(Math.floor(limit), MAX_LIVE_HISTORY_LIMIT);
}

export function buildTokenMovementLiveRawHistoryGraphqlQuery(
  endpoint: string,
  request: TokenMovementLiveRawHistoryRequest,
): TokenMovementLiveRawHistoryGraphqlQuery {
  const limit = normalizeTokenMovementLiveRawHistoryLimit(request.limit);

  if (request.mode === "state_v2") {
    return {
      endpoint,
      body: {
        query: `
          query WatchtowerTokenMovementStateV2RawHistory($accountId: String!, $dappId: String!, $limit: Int!) {
            blockchain {
              account(account_id: { eq: $accountId }, dapp_id: { eq: $dappId }) {
                transactions(last: $limit) {
                  edges {
                    node {
                      id
                      lt
                      now
                      in_message
                      out_messages
                    }
                  }
                }
              }
            }
          }
        `,
        variables: {
          accountId: request.accountId ?? "",
          dappId: request.dappId ?? "",
          limit,
        },
      },
    };
  }

  return {
    endpoint,
    body: {
      query: `
        query WatchtowerTokenMovementLegacyRawHistorySchemaProbe($address: String!) {
          accounts(filter: { id: { eq: $address } }) {
            id
          }
          accountType: __type(name: "Account") {
            fields {
              name
            }
          }
          queryType: __schema {
            queryType {
              fields {
                name
              }
            }
          }
        }
      `,
      variables: {
        address: request.legacyAddress ?? "",
      },
    },
  };
}

export async function readLiveTokenMovementRawHistory(
  input: TokenMovementLiveRawHistoryInput,
): Promise<AccountHistoryResponse> {
  const generatedAt = new Date().toISOString();
  const limit = normalizeTokenMovementLiveRawHistoryLimit(input.request.limit);
  const warnings: string[] = [
    "Live raw token movement history is read-only and on-the-fly only.",
    "Rows returned by this route are raw transaction/message observations, not confirmed decoded token transfers yet.",
  ];

  if (input.request.mode === "legacy") {
    warnings.push(
      "Legacy 0:<address> history is now treated as a schema probe unless a DApp ID is supplied. This endpoint appears to require State V2 account_id + dapp_id for transaction history.",
    );
  }

  const baseRequest = createAccountHistoryRequest({
    identity: {
      address: normalizeHistoryAddress(input.request.legacyAddress ?? null),
      dappId: input.request.mode === "state_v2" ? input.request.dappId ?? null : null,
      accountId: input.request.mode === "state_v2" ? input.request.accountId ?? null : null,
      label: "live token movement subject",
    },
    network: input.request.network ?? "mainnet",
    source: "graphql",
    limit,
    cursor: null,
    fromUnixSeconds: null,
    toUnixSeconds: null,
    includeRawPayloads: input.request.includeRawPayloads ?? false,
    includeLabelHints: true,
  });

  if (!endpointConfigIsUsableForLiveReads(input.endpointConfig) || !input.endpointConfig.graphqlEndpoint) {
    return {
      request: baseRequest,
      generatedAt,
      nextCursor: null,
      transactions: [],
      warnings: [
        ...warnings,
        "Live raw history requires live-read mode and WATCHTOWER_GRAPHQL_ENDPOINT.",
        ...input.endpointConfig.errors,
      ],
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), input.requestTimeoutMs ?? 12_000);
  const query = buildTokenMovementLiveRawHistoryGraphqlQuery(
    input.endpointConfig.graphqlEndpoint,
    input.request,
  );

  try {
    const response = await fetch(query.endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(query.body),
      signal: controller.signal,
    });

    const rawText = await response.text();
    const raw = parseRawJson(rawText);
    const normalized = normalizeTokenMovementLiveRawHistoryResponse({
      raw,
      request: baseRequest,
      generatedAt,
      includeRawPayloads: input.request.includeRawPayloads ?? false,
      requestMode: input.request.mode,
    });

    const responseWarnings = [...warnings, ...normalized.warnings];

    if (!response.ok) {
      responseWarnings.push(`GraphQL live raw history request failed with HTTP ${response.status}.`);
    }

    const graphqlErrors = extractGraphqlErrors(raw);
    if (graphqlErrors.length > 0) {
      responseWarnings.push(...graphqlErrors.map((error) => `GraphQL error: ${error}`));
    }

    if (normalized.transactions.length === 0) {
      responseWarnings.push(
        input.request.mode === "legacy"
          ? "No transaction/message records were extracted from the legacy address probe. Provide account_id + dapp_id, or pass dapp_id together with address=0:<64hex>, to attempt the State V2 history path."
          : "No transaction/message records were extracted. The endpoint may use a different history schema, or the account may have no visible history.",
      );
    }

    return {
      request: baseRequest,
      generatedAt,
      nextCursor: null,
      transactions: normalized.transactions,
      warnings: responseWarnings,
    };
  } catch (error) {
    return {
      request: baseRequest,
      generatedAt,
      nextCursor: null,
      transactions: [],
      warnings: [
        ...warnings,
        error instanceof Error ? error.message : "Unknown live raw history read error.",
      ],
    };
  } finally {
    clearTimeout(timeout);
  }
}

export function normalizeTokenMovementLiveRawHistoryResponse(input: {
  readonly raw: unknown;
  readonly request: AccountHistoryResponse["request"];
  readonly generatedAt: string;
  readonly includeRawPayloads: boolean;
  readonly requestMode?: TokenMovementLiveRawHistoryMode;
}): Pick<AccountHistoryResponse, "transactions" | "warnings"> {
  const warnings: string[] = [];
  const candidates = findTransactionCandidates(input.raw).slice(0, input.request.limit);
  const transactions: AccountHistoryTransaction[] = candidates.map((candidate, index) =>
    transactionCandidateToObservation(candidate, input, index),
  );

  if (transactions.length > 0) {
    warnings.push(
      "Extracted raw transaction/message candidates from live GraphQL response. Token decoding still needs a dedicated decoder batch.",
    );
  }

  if (input.requestMode === "legacy") {
    warnings.push(...describeLegacySchemaProbe(input.raw));
  }

  return {
    transactions,
    warnings,
  };
}

function transactionCandidateToObservation(
  candidate: Record<string, unknown>,
  input: {
    readonly request: AccountHistoryResponse["request"];
    readonly includeRawPayloads: boolean;
  },
  index: number,
): AccountHistoryTransaction {
  const txId = firstString(candidate, ["id", "transaction_id", "transactionId"]) ?? `live-raw-transaction-${index + 1}`;
  const hash = firstString(candidate, ["hash", "transaction_hash", "transactionHash"]);
  const logicalTime = firstString(candidate, ["lt", "logical_time", "logicalTime"]);
  const createdAtUnixSeconds = firstNumber(candidate, ["now", "created_at", "createdAt", "timestamp"]);
  const inboundMessage = messageCandidateToObservation(
    firstRecord(candidate, ["inMessage", "in_message", "in_msg", "inboundMessage"]),
    "incoming",
    txId,
    createdAtUnixSeconds,
  );
  const outboundMessages = firstRecordArray(candidate, ["outMessages", "out_messages", "out_msgs", "outboundMessages"])
    .map((message, messageIndex) => messageCandidateToObservation(message, "outgoing", txId, createdAtUnixSeconds, messageIndex))
    .filter((message): message is AccountHistoryMessage => message !== null);

  return createRawTransactionObservation({
    id: txId,
    accountAddress: input.request.identity.address,
    accountDappId: input.request.identity.dappId,
    accountId: input.request.identity.accountId,
    logicalTime,
    hash,
    createdAtUnixSeconds,
    status: "unknown",
    inboundMessage,
    outboundMessages,
    raw: input.includeRawPayloads ? candidate : null,
    decodeState: "raw",
    confidence: "possible",
    likelyAction: "Observed live account transaction/message history candidate.",
    warnings: [
      "Raw live history observation. Do not present as confirmed token transfer until decoded and normalized.",
    ],
  });
}

function messageCandidateToObservation(
  message: Record<string, unknown> | null,
  direction: AccountHistoryMessage["direction"],
  transactionId: string,
  createdAtUnixSeconds: number | null,
  index = 0,
): AccountHistoryMessage | null {
  if (!message) return null;

  const value = firstStringOrNumber(message, ["value", "amount", "value_raw", "valueRaw"]);
  const sourceAddress = firstString(message, ["src", "source", "sourceAddress", "src_addr"]);
  const destinationAddress = firstString(message, ["dst", "destination", "destinationAddress", "dst_addr"]);
  const id = firstString(message, ["id", "message_id", "messageId"]);
  const bodyBase64 = firstString(message, ["body", "bodyBase64", "body_base64"]);
  const bodyHash = firstString(message, ["bodyHash", "body_hash", "hash"]);

  return createRawMessageObservation({
    id: id ?? `${transactionId}-${direction}-${index + 1}`,
    transactionId,
    createdAtUnixSeconds,
    direction,
    sourceAddress: normalizeHistoryAddress(sourceAddress ?? null),
    destinationAddress: normalizeHistoryAddress(destinationAddress ?? null),
    value: {
      raw: value === null ? null : String(value),
      display: value === null ? null : String(value),
      unit: "raw-chain-value",
      confirmed: false,
    },
    bodyHash,
    bodyBase64,
    decodedMethod: null,
    decodedParams: null,
    decodeState: "raw",
    evidenceStatus: "observed",
    confidence: "possible",
    warnings: [
      "Message is live raw chain evidence only; token family and amount are not decoded yet.",
    ],
  });
}

function parseRawJson(rawText: string): unknown {
  try {
    return rawText ? JSON.parse(rawText) : null;
  } catch {
    return rawText;
  }
}

function extractGraphqlErrors(raw: unknown): string[] {
  if (!isRecord(raw)) return [];
  const envelope = raw as GraphqlEnvelope;
  if (!Array.isArray(envelope.errors)) return [];
  return envelope.errors.map((error) => {
    if (isRecord(error) && typeof error.message === "string") return error.message;
    return JSON.stringify(error);
  });
}

function describeLegacySchemaProbe(raw: unknown): string[] {
  const accountFields = extractNamedFields(raw, "accountType");
  const queryFields = extractNamedFields(raw, "queryType");
  const warnings: string[] = [];

  if (accountFields.length > 0 && !accountFields.includes("transactions")) {
    warnings.push(
      "GraphQL Account type does not expose a transactions field on the root accounts query. Watchtower will need the State V2 blockchain.account history path for live history.",
    );
  }

  if (queryFields.length > 0) {
    const interestingFields = queryFields
      .filter((field) => /account|transaction|message|blockchain/i.test(field))
      .slice(0, 12);

    if (interestingFields.length > 0) {
      warnings.push(`GraphQL schema probe visible query fields: ${interestingFields.join(", ")}.`);
    }
  }

  return warnings;
}

function extractNamedFields(raw: unknown, marker: "accountType" | "queryType"): string[] {
  const data = isRecord(raw) && isRecord(raw.data) ? raw.data : null;
  if (!data) return [];

  if (marker === "accountType") {
    const accountType = isRecord(data.accountType) ? data.accountType : null;
    return fieldsToNames(accountType?.fields);
  }

  const queryTypeRoot = isRecord(data.queryType) ? data.queryType : null;
  const queryType = isRecord(queryTypeRoot?.queryType) ? queryTypeRoot.queryType : null;
  return fieldsToNames(queryType?.fields);
}

function fieldsToNames(fields: unknown): string[] {
  if (!Array.isArray(fields)) return [];

  return fields
    .map((field) => (isRecord(field) && typeof field.name === "string" ? field.name : null))
    .filter((field): field is string => field !== null && field.trim().length > 0);
}

function findTransactionCandidates(raw: unknown): Record<string, unknown>[] {
  const output: Record<string, unknown>[] = [];
  visitGraph(raw, (node, key) => {
    if (!Array.isArray(node)) return;
    const normalizedKey = key.toLowerCase();
    if (!normalizedKey.includes("transaction") && normalizedKey !== "edges") return;

    for (const item of node) {
      const candidate = edgeOrRecord(item);
      if (candidate && looksLikeTransaction(candidate)) output.push(candidate);
    }
  });
  return dedupeRecords(output);
}

function visitGraph(value: unknown, visitor: (value: unknown, key: string) => void, key = "root", seen = new Set<unknown>()): void {
  visitor(value, key);
  if (value === null || typeof value !== "object" || seen.has(value)) return;
  seen.add(value);

  if (Array.isArray(value)) {
    value.forEach((item, index) => visitGraph(item, visitor, `${key}[${index}]`, seen));
    return;
  }

  for (const [childKey, childValue] of Object.entries(value as Record<string, unknown>)) {
    visitGraph(childValue, visitor, childKey, seen);
  }
}

function edgeOrRecord(value: unknown): Record<string, unknown> | null {
  if (!isRecord(value)) return null;
  if (isRecord(value.node)) return value.node;
  return value;
}

function looksLikeTransaction(value: Record<string, unknown>): boolean {
  return Boolean(
    firstString(value, ["id", "hash", "lt", "logical_time", "logicalTime"]) ||
    firstRecord(value, ["inMessage", "in_message", "in_msg", "inboundMessage"]) ||
    firstRecordArray(value, ["outMessages", "out_messages", "out_msgs", "outboundMessages"]).length > 0
  );
}

function dedupeRecords(records: readonly Record<string, unknown>[]): Record<string, unknown>[] {
  const seen = new Set<string>();
  const output: Record<string, unknown>[] = [];

  for (const record of records) {
    const key = firstString(record, ["id", "hash", "lt", "logical_time", "logicalTime"]) ?? JSON.stringify(record).slice(0, 240);
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(record);
  }

  return output;
}

function firstString(record: Record<string, unknown>, keys: readonly string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function firstNumber(record: Record<string, unknown>, keys: readonly string[]): number | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const parsed = Number.parseInt(value, 10);
      if (!Number.isNaN(parsed)) return parsed;
    }
  }
  return null;
}

function firstStringOrNumber(record: Record<string, unknown>, keys: readonly string[]): string | number | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return null;
}

function firstRecord(record: Record<string, unknown>, keys: readonly string[]): Record<string, unknown> | null {
  for (const key of keys) {
    const value = record[key];
    if (isRecord(value)) return value;
  }
  return null;
}

function firstRecordArray(record: Record<string, unknown>, keys: readonly string[]): Record<string, unknown>[] {
  for (const key of keys) {
    const value = record[key];
    if (!Array.isArray(value)) continue;
    return value.map(edgeOrRecord).filter((item): item is Record<string, unknown> => item !== null);
  }
  return [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
