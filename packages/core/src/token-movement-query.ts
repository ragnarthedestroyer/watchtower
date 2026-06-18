import type {
  TokenMovement,
  TokenMovementConfidence,
  TokenMovementDirection,
  TokenMovementProofStatus,
  TokenSymbol,
} from "./token-movement";

export type TokenMovementSortField =
  | "observedAtUnix"
  | "tokenSymbol"
  | "confidence"
  | "proofStatus"
  | "direction";

export type TokenMovementSortDirection = "asc" | "desc";

export type TokenMovementQueryMode =
  | "all"
  | "watched-address-only"
  | "unresolved-only"
  | "needs-decoder-only"
  | "incident-relevant-only";

export interface TokenMovementQuery {
  readonly tokenSymbols?: readonly TokenSymbol[];
  readonly directions?: readonly TokenMovementDirection[];
  readonly proofStatuses?: readonly TokenMovementProofStatus[];
  readonly confidence?: readonly TokenMovementConfidence[];
  readonly addressContains?: string;
  readonly contractAddressContains?: string;
  readonly observedAfterUnix?: number;
  readonly observedBeforeUnix?: number;
  readonly mode?: TokenMovementQueryMode;
  readonly sortBy?: TokenMovementSortField;
  readonly sortDirection?: TokenMovementSortDirection;
  readonly limit?: number;
  readonly offset?: number;
}

export interface TokenMovementQueryResult {
  readonly query: TokenMovementQuery;
  readonly totalBeforePagination: number;
  readonly returned: number;
  readonly movements: readonly TokenMovement[];
  readonly warnings: readonly string[];
}

export interface TokenMovementQueryPreset {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly query: TokenMovementQuery;
}

export const TOKEN_MOVEMENT_QUERY_PRESETS: readonly TokenMovementQueryPreset[] = [
  {
    id: "all-recent",
    label: "All recent movement candidates",
    description: "Shows every available token movement candidate, newest first.",
    query: { mode: "all", sortBy: "observedAtUnix", sortDirection: "desc" },
  },
  {
    id: "shell-unresolved",
    label: "Unresolved SHELL movements",
    description: "Focuses on SHELL movements that are not yet proven or decoded.",
    query: {
      tokenSymbols: ["SHELL"],
      mode: "unresolved-only",
      sortBy: "observedAtUnix",
      sortDirection: "desc",
    },
  },
  {
    id: "usdc-bridge-review",
    label: "USDC / bridge review",
    description: "Surfaces USDC and TIP-3 candidates that may need bridge or token-root review.",
    query: {
      tokenSymbols: ["USDC", "TIP-3", "UNKNOWN"],
      mode: "incident-relevant-only",
      sortBy: "observedAtUnix",
      sortDirection: "desc",
    },
  },
  {
    id: "decoder-needed",
    label: "Decoder needed",
    description: "Shows observations that still need ABI, body, event, or token-wallet decoding.",
    query: { mode: "needs-decoder-only", sortBy: "observedAtUnix", sortDirection: "desc" },
  },
];

export function queryTokenMovements(
  movements: readonly TokenMovement[],
  query: TokenMovementQuery = {},
): TokenMovementQueryResult {
  const warnings: string[] = [];
  const normalizedQuery = normalizeTokenMovementQuery(query, warnings);

  const filtered = movements.filter((movement) => tokenMovementMatchesQuery(movement, normalizedQuery));
  const sorted = [...filtered].sort((left, right) => compareTokenMovements(left, right, normalizedQuery));
  const offset = normalizedQuery.offset ?? 0;
  const limit = normalizedQuery.limit ?? sorted.length;
  const paged = sorted.slice(offset, offset + limit);

  if (filtered.length > paged.length) {
    warnings.push("Result is paginated. Some matching movements are not shown in this response.");
  }

  return {
    query: normalizedQuery,
    totalBeforePagination: filtered.length,
    returned: paged.length,
    movements: paged,
    warnings,
  };
}

export function tokenMovementMatchesQuery(movement: TokenMovement, query: TokenMovementQuery): boolean {
  if (query.tokenSymbols?.length && !query.tokenSymbols.includes(movement.token.symbol)) {
    return false;
  }

  if (query.directions?.length && !query.directions.includes(movement.direction)) {
    return false;
  }

  if (query.proofStatuses?.length && !query.proofStatuses.includes(movement.proof.status)) {
    return false;
  }

  if (query.confidence?.length && !query.confidence.includes(movement.confidence)) {
    return false;
  }

  if (query.addressContains && !movementContainsAddressText(movement, query.addressContains)) {
    return false;
  }

  if (query.contractAddressContains && !movement.contract?.address?.includes(query.contractAddressContains)) {
    return false;
  }

  if (typeof query.observedAfterUnix === "number" && movement.observedAtUnix < query.observedAfterUnix) {
    return false;
  }

  if (typeof query.observedBeforeUnix === "number" && movement.observedAtUnix > query.observedBeforeUnix) {
    return false;
  }

  switch (query.mode ?? "all") {
    case "all":
      return true;
    case "watched-address-only":
      return movement.involvesWatchedAddress === true;
    case "unresolved-only":
      return movement.proof.status !== "proven" || movement.confidence === "low" || movement.confidence === "unknown";
    case "needs-decoder-only":
      return movement.decoderStatus !== "decoded" || movement.proof.status === "unproven";
    case "incident-relevant-only":
      return movement.tags.includes("incident") || movement.tags.includes("accumulator") || movement.tags.includes("bridge") || movement.tags.includes("usdc") || movement.tags.includes("shell");
  }
}

export function getTokenMovementQueryPreset(id: string): TokenMovementQueryPreset | undefined {
  return TOKEN_MOVEMENT_QUERY_PRESETS.find((preset) => preset.id === id);
}

function normalizeTokenMovementQuery(query: TokenMovementQuery, warnings: string[]): TokenMovementQuery {
  const limit = normalizeNonNegativeInteger(query.limit, "limit", warnings);
  const offset = normalizeNonNegativeInteger(query.offset, "offset", warnings);

  if (
    typeof query.observedAfterUnix === "number" &&
    typeof query.observedBeforeUnix === "number" &&
    query.observedAfterUnix > query.observedBeforeUnix
  ) {
    warnings.push("observedAfterUnix is later than observedBeforeUnix. The query may return no results.");
  }

  return {
    ...query,
    limit,
    offset,
    sortBy: query.sortBy ?? "observedAtUnix",
    sortDirection: query.sortDirection ?? "desc",
    mode: query.mode ?? "all",
  };
}

function normalizeNonNegativeInteger(
  value: number | undefined,
  fieldName: string,
  warnings: string[],
): number | undefined {
  if (typeof value !== "number") {
    return undefined;
  }

  if (!Number.isFinite(value) || value < 0) {
    warnings.push(`${fieldName} was ignored because it is not a non-negative finite number.`);
    return undefined;
  }

  return Math.floor(value);
}

function compareTokenMovements(left: TokenMovement, right: TokenMovement, query: TokenMovementQuery): number {
  const direction = query.sortDirection === "asc" ? 1 : -1;
  const sortBy = query.sortBy ?? "observedAtUnix";

  const leftValue = tokenMovementSortValue(left, sortBy);
  const rightValue = tokenMovementSortValue(right, sortBy);

  if (leftValue < rightValue) {
    return -1 * direction;
  }

  if (leftValue > rightValue) {
    return 1 * direction;
  }

  return left.id.localeCompare(right.id);
}

function tokenMovementSortValue(movement: TokenMovement, sortBy: TokenMovementSortField): string | number {
  switch (sortBy) {
    case "observedAtUnix":
      return movement.observedAtUnix;
    case "tokenSymbol":
      return movement.token.symbol;
    case "confidence":
      return movement.confidence;
    case "proofStatus":
      return movement.proof.status;
    case "direction":
      return movement.direction;
  }
}

function movementContainsAddressText(movement: TokenMovement, addressText: string): boolean {
  const needle = addressText.trim().toLowerCase();

  if (!needle) {
    return true;
  }

  return [
    movement.from?.address,
    movement.to?.address,
    movement.contract?.address,
    movement.relatedTransactionId,
    movement.relatedMessageId,
  ]
    .filter((value): value is string => Boolean(value))
    .some((value) => value.toLowerCase().includes(needle));
}
