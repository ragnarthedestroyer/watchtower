import type {
  TokenMovement,
  TokenMovementConfidence,
  TokenMovementDirection,
  TokenMovementAssetFamily,
} from "./token-movement";

export type TokenSymbol = string;
export type TokenMovementProofStatus = TokenMovementConfidence;

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
      tokenSymbols: ["USDC", "TIP-3", "TIP3", "UNKNOWN"],
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
  if (query.tokenSymbols?.length && !matchesTokenSymbol(movement, query.tokenSymbols)) return false;
  if (query.directions?.length && !query.directions.includes(movement.direction)) return false;
  if (query.proofStatuses?.length && !query.proofStatuses.includes(movement.proofStatus)) return false;
  if (query.confidence?.length && !query.confidence.includes(movement.proofStatus)) return false;
  if (query.addressContains && !movementContainsAddressText(movement, query.addressContains)) return false;
  if (query.contractAddressContains && !movementContainsContractText(movement, query.contractAddressContains)) return false;

  const observed = movementObservedAtUnix(movement);
  if (typeof query.observedAfterUnix === "number" && observed < query.observedAfterUnix) return false;
  if (typeof query.observedBeforeUnix === "number" && observed > query.observedBeforeUnix) return false;

  switch (query.mode ?? "all") {
    case "all":
      return true;
    case "watched-address-only":
      return movement.tags.includes("watched") || movement.via?.label === "observed account";
    case "unresolved-only":
      return movement.proofStatus !== "confirmed";
    case "needs-decoder-only":
      return movement.proofStatus !== "confirmed" || movement.uncertainty.length > 0 || movement.tags.includes("decoder-needed");
    case "incident-relevant-only":
      return ["incident", "accumulator", "bridge", "usdc", "shell"].some((tag) => movement.tags.includes(tag));
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
    sortBy: query.sortBy ?? "observedAtUnix",
    sortDirection: query.sortDirection ?? "desc",
    mode: query.mode ?? "all",
    ...(typeof limit === "number" ? { limit } : {}),
    ...(typeof offset === "number" ? { offset } : {}),
  };
}

function normalizeNonNegativeInteger(value: number | undefined, fieldName: string, warnings: string[]): number | undefined {
  if (typeof value !== "number") return undefined;
  if (!Number.isFinite(value) || value < 0) {
    warnings.push(`${fieldName} was ignored because it is not a non-negative finite number.`);
    return undefined;
  }
  return Math.floor(value);
}

function movementObservedAtUnix(movement: TokenMovement): number {
  if (!movement.observedAt) return 0;
  const millis = Date.parse(movement.observedAt);
  return Number.isFinite(millis) ? Math.floor(millis / 1000) : 0;
}

function compareTokenMovements(left: TokenMovement, right: TokenMovement, query: TokenMovementQuery): number {
  const direction = query.sortDirection === "asc" ? 1 : -1;
  const sortBy = query.sortBy ?? "observedAtUnix";
  const leftValue = tokenMovementSortValue(left, sortBy);
  const rightValue = tokenMovementSortValue(right, sortBy);

  if (leftValue < rightValue) return -1 * direction;
  if (leftValue > rightValue) return 1 * direction;
  return 0;
}

function tokenMovementSortValue(movement: TokenMovement, sortBy: TokenMovementSortField): string | number {
  switch (sortBy) {
    case "observedAtUnix":
      return movementObservedAtUnix(movement);
    case "tokenSymbol":
      return movement.token.symbol;
    case "confidence":
    case "proofStatus":
      return confidenceRank(movement.proofStatus);
    case "direction":
      return movement.direction;
  }
}

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

function matchesTokenSymbol(movement: TokenMovement, tokenSymbols: readonly string[]): boolean {
  const wanted = new Set(tokenSymbols.map((item) => item.toUpperCase()));
  const family: TokenMovementAssetFamily = movement.token.family;
  return wanted.has(movement.token.symbol.toUpperCase()) || wanted.has(family) || (family === "TIP3" && wanted.has("TIP-3"));
}

function movementContainsAddressText(movement: TokenMovement, needle: string): boolean {
  const normalized = needle.toLowerCase();
  return [movement.from.address, movement.to.address, movement.via?.address]
    .filter((value): value is string => Boolean(value))
    .some((value) => value.toLowerCase().includes(normalized));
}

function movementContainsContractText(movement: TokenMovement, needle: string): boolean {
  const normalized = needle.toLowerCase();
  return [movement.token.rootContract, movement.token.walletContract, movement.via?.address]
    .filter((value): value is string => Boolean(value))
    .some((value) => value.toLowerCase().includes(normalized));
}
