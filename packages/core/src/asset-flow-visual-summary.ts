import type { TokenMovement, TokenMovementDirection, TokenMovementProofStatus } from "./token-movement";
import type { KnownContractRegistry } from "./known-contract-registry";
import { createKnownContractLabeler } from "./known-contract-registry";

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

export type AssetFlowEdgeStatus =
  | "confirmed"
  | "candidate"
  | "partial"
  | "unresolved";

export interface AssetFlowNode {
  id: string;
  address?: string;
  label: string;
  shortLabel: string;
  kind: AssetFlowNodeKind;
  confidence: "high" | "medium" | "low" | "unknown";
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
  proofStatus: TokenMovementProofStatus;
  status: AssetFlowEdgeStatus;
  confidence: "high" | "medium" | "low" | "unknown";
  likelyAction: string;
  evidenceSummary: string[];
  warnings: string[];
}

export interface AssetFlowVisualSummaryInput {
  movements: TokenMovement[];
  watchedAddresses?: string[];
  registry?: KnownContractRegistry;
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

export function buildAssetFlowVisualSummary(input: AssetFlowVisualSummaryInput): AssetFlowVisualSummary {
  const watched = new Set((input.watchedAddresses ?? []).map(normalizeAddressKey));
  const labeler = createKnownContractLabeler(input.registry);
  const nodeMap = new Map<string, AssetFlowNode>();
  const edgeMap = new Map<string, AssetFlowEdge>();
  const warnings = new Set<string>();

  const ensureNode = (address: string | undefined, fallback: string): AssetFlowNode => {
    const key = address ? normalizeAddressKey(address) : UNKNOWN_NODE_ID;
    const existing = nodeMap.get(key);
    if (existing) return existing;

    const label = address ? labeler.labelAddress(address) : undefined;
    const isWatched = address ? watched.has(normalizeAddressKey(address)) : false;
    const kind = isWatched ? "watch-address" : toNodeKind(label?.kind);
    const nodeWarnings: string[] = [];

    if (!address) {
      nodeWarnings.push("Address is missing or not decoded from available evidence.");
      warnings.add("Some flow endpoints are unknown because the source history is incomplete or undecoded.");
    }

    if (label?.warnings?.length) {
      nodeWarnings.push(...label.warnings);
    }

    const node: AssetFlowNode = {
      id: key,
      address,
      label: isWatched ? `Watched address ${shortAddress(address)}` : label?.label ?? fallback,
      shortLabel: isWatched ? `Watch ${shortAddress(address)}` : label?.shortLabel ?? shortAddress(address ?? "unknown"),
      kind,
      confidence: label?.confidence ?? (address ? "unknown" : "low"),
      isWatched,
      warnings: dedupe(nodeWarnings),
    };

    nodeMap.set(key, node);
    return node;
  };

  for (const movement of input.movements) {
    const fromNode = ensureNode(movement.from?.address, "Unknown source");
    const toNode = ensureNode(movement.to?.address, "Unknown destination");
    const tokenSymbol = movement.asset.symbol ?? movement.asset.family ?? "UNKNOWN";
    const amountText = movement.amount.display ?? movement.amount.raw ?? "unknown amount";
    const edgeKey = [fromNode.id, toNode.id, tokenSymbol, movement.direction, movement.proof.status].join("|");
    const evidenceSummary = movement.evidence.map((item) => `${item.kind}: ${item.reference}`).filter(Boolean);
    const movementWarnings = [
      ...movement.warnings,
      ...movement.uncertainty.reasons,
      ...(movement.amount.isApproximate ? ["Amount is approximate or inferred."] : []),
    ];

    const existing = edgeMap.get(edgeKey);
    if (existing) {
      existing.movementIds.push(movement.id);
      existing.movementCount += 1;
      existing.evidenceSummary = dedupe([...existing.evidenceSummary, ...evidenceSummary]).slice(0, 8);
      existing.warnings = dedupe([...existing.warnings, ...movementWarnings]).slice(0, 8);
      existing.confidence = mergeConfidence(existing.confidence, movement.confidence);
      existing.status = mergeEdgeStatus(existing.status, toEdgeStatus(movement));
      continue;
    }

    const edgeStatus = toEdgeStatus(movement);
    if (edgeStatus !== "confirmed") {
      warnings.add("One or more asset-flow edges are candidates or unresolved and must not be treated as proven transfers.");
    }

    edgeMap.set(edgeKey, {
      id: `edge:${edgeMap.size + 1}`,
      fromNodeId: fromNode.id,
      toNodeId: toNode.id,
      tokenSymbol,
      amountText,
      movementIds: [movement.id],
      movementCount: 1,
      direction: movement.direction,
      proofStatus: movement.proof.status,
      status: edgeStatus,
      confidence: movement.confidence,
      likelyAction: movement.likelyAction.label,
      evidenceSummary: evidenceSummary.slice(0, 8),
      warnings: dedupe(movementWarnings).slice(0, 8),
    });
  }

  const edges = [...edgeMap.values()];

  return {
    title: input.title ?? "Asset flow visual summary",
    generatedAtIso: new Date().toISOString(),
    nodes: [...nodeMap.values()],
    edges,
    totals: {
      movementCount: input.movements.length,
      nodeCount: nodeMap.size,
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

export function renderAssetFlowSummaryText(summary: AssetFlowVisualSummary): string {
  const lines: string[] = [];
  lines.push(summary.title);
  lines.push(`Movements: ${summary.totals.movementCount} | Nodes: ${summary.totals.nodeCount} | Edges: ${summary.totals.edgeCount}`);
  lines.push(`Confirmed: ${summary.totals.confirmedEdges} | Candidate/partial: ${summary.totals.candidateEdges} | Unresolved: ${summary.totals.unresolvedEdges}`);
  lines.push("");

  for (const edge of summary.edges) {
    const from = summary.nodes.find((node) => node.id === edge.fromNodeId)?.shortLabel ?? edge.fromNodeId;
    const to = summary.nodes.find((node) => node.id === edge.toNodeId)?.shortLabel ?? edge.toNodeId;
    lines.push(`${edge.tokenSymbol} ${edge.amountText}: ${from} -> ${to}`);
    lines.push(`  status=${edge.status}; proof=${edge.proofStatus}; confidence=${edge.confidence}; likely=${edge.likelyAction}`);
    if (edge.warnings.length > 0) lines.push(`  warnings=${edge.warnings.join(" | ")}`);
  }

  if (summary.warnings.length > 0) {
    lines.push("");
    lines.push("Warnings:");
    for (const warning of summary.warnings) lines.push(`- ${warning}`);
  }

  lines.push("");
  lines.push("Read-only summary. Candidate and unresolved edges are not proof of final token movement.");
  return lines.join("\n");
}

function toEdgeStatus(movement: TokenMovement): AssetFlowEdgeStatus {
  if (movement.proof.status === "proven") return "confirmed";
  if (movement.proof.status === "partial") return "partial";
  if (movement.proof.status === "unproven" || movement.confidence === "low") return "unresolved";
  return "candidate";
}

function mergeEdgeStatus(a: AssetFlowEdgeStatus, b: AssetFlowEdgeStatus): AssetFlowEdgeStatus {
  const rank: Record<AssetFlowEdgeStatus, number> = { confirmed: 0, candidate: 1, partial: 2, unresolved: 3 };
  return rank[a] >= rank[b] ? a : b;
}

function mergeConfidence(a: AssetFlowNode["confidence"], b: AssetFlowNode["confidence"]): AssetFlowNode["confidence"] {
  const rank: Record<AssetFlowNode["confidence"], number> = { high: 0, medium: 1, low: 2, unknown: 3 };
  return rank[a] >= rank[b] ? a : b;
}

function toNodeKind(kind?: string): AssetFlowNodeKind {
  switch (kind) {
    case "wallet":
    case "token-wallet":
    case "token-root":
    case "accumulator":
    case "bridge":
    case "dex":
    case "private-note":
    case "multifactor":
    case "contract":
      return kind;
    default:
      return "unknown";
  }
}

function normalizeAddressKey(address: string): string {
  return address.trim().toLowerCase();
}

function shortAddress(address: string): string {
  if (address.length <= 16) return address;
  return `${address.slice(0, 8)}…${address.slice(-6)}`;
}

function dedupe(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}
