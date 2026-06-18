import type { TokenMovement, TokenMovementConfidence, TokenMovementDirection } from "./token-movement";
import type { KnownContractEntry, KnownContractRegistry } from "./known-contract-registry";
import { labelKnownContractAddress } from "./known-contract-registry";

export type AssetFlowNodeKind =
  | "watch-address"
  | "wallet"
  | "token-wallet"
  | "token-root"
  | "accumulator"
  | "bridge"
  | "dex"
  | "private-note"
  | "multifactor"
  | "contract"
  | "unknown";

export type AssetFlowEdgeStatus = "confirmed" | "candidate" | "partial" | "unresolved";

export interface AssetFlowNode {
  id: string;
  address: string | undefined;
  label: string;
  shortLabel: string;
  kind: AssetFlowNodeKind;
  confidence: TokenMovementConfidence;
  isWatched: boolean;
  warnings: string[];
}

export interface AssetFlowEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  tokenSymbol: string;
  amountText: string;
  movementIds: string[];
  movementCount: number;
  direction: TokenMovementDirection;
  proofStatus: TokenMovementConfidence;
  status: AssetFlowEdgeStatus;
  confidence: TokenMovementConfidence;
  likelyAction: string;
  evidenceSummary: string[];
  warnings: string[];
}

export interface AssetFlowVisualSummaryInput {
  movements: TokenMovement[];
  watchedAddresses?: string[];
  registry?: KnownContractRegistry | KnownContractEntry[];
  title?: string;
}

export interface AssetFlowVisualSummary {
  title: string;
  generatedAtIso: string;
  nodes: AssetFlowNode[];
  edges: AssetFlowEdge[];
  totals: {
    movementCount: number;
    nodeCount: number;
    edgeCount: number;
    confirmedEdges: number;
    candidateEdges: number;
    unresolvedEdges: number;
  };
  warnings: string[];
  safety: {
    readOnly: true;
    doesNotDecodeBalances: true;
    doesNotProveUndecodedTransfers: true;
  };
}

const UNKNOWN_NODE_ID = "node:unknown";

function registryEntries(registry: KnownContractRegistry | KnownContractEntry[] | undefined): KnownContractEntry[] {
  if (!registry) return [];
  return Array.isArray(registry) ? registry : registry.entries;
}

function normalizeAddressKey(address: string | null | undefined): string {
  return address?.trim().toLowerCase() || UNKNOWN_NODE_ID;
}

function shortAddress(address: string | null | undefined): string {
  if (!address) return "unknown";
  if (address.length <= 18) return address;
  return `${address.slice(0, 8)}…${address.slice(-6)}`;
}

function nodeKindFromRole(role: string | undefined): AssetFlowNodeKind {
  switch (role) {
    case "wallet":
    case "token-wallet":
    case "token-root":
    case "accumulator":
    case "bridge":
    case "dex":
    case "private-note":
    case "multifactor":
    case "contract":
      return role;
    default:
      return "unknown";
  }
}

function statusFromProof(proofStatus: TokenMovementConfidence): AssetFlowEdgeStatus {
  switch (proofStatus) {
    case "confirmed":
      return "confirmed";
    case "probable":
      return "candidate";
    case "possible":
      return "partial";
    case "unknown":
    default:
      return "unresolved";
  }
}

function amountText(movement: TokenMovement): string {
  return `${movement.amount.display ?? movement.amount.raw ?? "unknown amount"} ${movement.amount.unit || movement.token.symbol}`.trim();
}

function movementWarnings(movement: TokenMovement): string[] {
  return [
    ...movement.warnings,
    ...movement.uncertainty.map((item) => `${item.field}: ${item.reason}`),
    ...(movement.amount.confirmed ? [] : ["Amount is not confirmed by decoded token evidence."]),
  ].filter((item, index, all) => all.indexOf(item) === index);
}

function evidenceSummary(movement: TokenMovement): string[] {
  return movement.evidence.map((item) => `${item.kind}: ${item.id ?? item.description}`).slice(0, 5);
}

export function buildAssetFlowVisualSummary(input: AssetFlowVisualSummaryInput): AssetFlowVisualSummary {
  const entries = registryEntries(input.registry);
  const watched = new Set((input.watchedAddresses ?? []).map(normalizeAddressKey));
  const nodeMap = new Map<string, AssetFlowNode>();
  const edgeMap = new Map<string, AssetFlowEdge>();
  const warnings = new Set<string>();

  const ensureNode = (address: string | null | undefined, fallback: string): AssetFlowNode => {
    const key = normalizeAddressKey(address);
    const existing = nodeMap.get(key);
    if (existing) return existing;

    const label = labelKnownContractAddress(address, entries);
    const isWatched = address ? watched.has(normalizeAddressKey(address)) : false;
    const nodeWarnings = [...label.warnings];

    if (!address) {
      nodeWarnings.push("Address is missing or not decoded from available evidence.");
      warnings.add("Some flow endpoints are unknown because source history is incomplete or undecoded.");
    }

    const node: AssetFlowNode = {
      id: key,
      address: address ?? undefined,
      label: isWatched ? `Watched address ${shortAddress(address)}` : label.label ?? fallback,
      shortLabel: isWatched ? `Watch ${shortAddress(address)}` : label.label ?? shortAddress(address),
      kind: isWatched ? "watch-address" : nodeKindFromRole(label.role),
      confidence: label.confidence,
      isWatched,
      warnings: nodeWarnings.filter((item, index, all) => all.indexOf(item) === index),
    };

    nodeMap.set(key, node);
    return node;
  };

  for (const movement of input.movements) {
    const fromNode = ensureNode(movement.from.address, "Unknown source");
    const toNode = ensureNode(movement.to.address, "Unknown destination");
    const tokenSymbol = movement.token.symbol || movement.token.family || "UNKNOWN";
    const edgeKey = [fromNode.id, toNode.id, tokenSymbol, movement.direction, movement.proofStatus].join("|");
    const existing = edgeMap.get(edgeKey);

    if (existing) {
      existing.movementIds.push(movement.id);
      existing.movementCount += 1;
      existing.warnings = [...existing.warnings, ...movementWarnings(movement)].filter((item, index, all) => all.indexOf(item) === index);
      existing.evidenceSummary = [...existing.evidenceSummary, ...evidenceSummary(movement)].filter((item, index, all) => all.indexOf(item) === index).slice(0, 5);
      continue;
    }

    const status = statusFromProof(movement.proofStatus);
    if (status !== "confirmed") warnings.add("Asset-flow summary contains candidate or unresolved edges that are not proof.");

    edgeMap.set(edgeKey, {
      id: `edge:${edgeKey}`,
      fromNodeId: fromNode.id,
      toNodeId: toNode.id,
      tokenSymbol,
      amountText: amountText(movement),
      movementIds: [movement.id],
      movementCount: 1,
      direction: movement.direction,
      proofStatus: movement.proofStatus,
      status,
      confidence: movement.proofStatus,
      likelyAction: movement.likelyAction,
      evidenceSummary: evidenceSummary(movement),
      warnings: movementWarnings(movement),
    });
  }

  const edges = [...edgeMap.values()];
  const nodes = [...nodeMap.values()];

  return {
    title: input.title ?? "Asset-flow visual summary",
    generatedAtIso: new Date().toISOString(),
    nodes,
    edges,
    totals: {
      movementCount: input.movements.length,
      nodeCount: nodes.length,
      edgeCount: edges.length,
      confirmedEdges: edges.filter((edge) => edge.status === "confirmed").length,
      candidateEdges: edges.filter((edge) => edge.status === "candidate" || edge.status === "partial").length,
      unresolvedEdges: edges.filter((edge) => edge.status === "unresolved").length,
    },
    warnings: [...warnings],
    safety: {
      readOnly: true,
      doesNotDecodeBalances: true,
      doesNotProveUndecodedTransfers: true,
    },
  };
}
