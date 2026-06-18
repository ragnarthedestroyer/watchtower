import type { AssetFlowVisualSummary } from "@watchtower/core";

export function renderTelegramAssetFlowVisualSummary(summary: AssetFlowVisualSummary): string {
  const lines: string[] = [];
  lines.push(`🔎 ${summary.title}`);
  lines.push(`Movements: ${summary.totals.movementCount} | Edges: ${summary.totals.edgeCount}`);
  lines.push(`✅ ${summary.totals.confirmedEdges} | 🟡 ${summary.totals.candidateEdges} | ⚠️ ${summary.totals.unresolvedEdges}`);
  lines.push("");

  for (const edge of summary.edges.slice(0, 8)) {
    const from = summary.nodes.find((node) => node.id === edge.fromNodeId)?.shortLabel ?? "unknown";
    const to = summary.nodes.find((node) => node.id === edge.toNodeId)?.shortLabel ?? "unknown";
    lines.push(`${statusIcon(edge.status)} ${edge.tokenSymbol} ${edge.amountText}`);
    lines.push(`${from} → ${to}`);
    lines.push(`${edge.status}; proof: ${edge.proofStatus}; confidence: ${edge.confidence}`);
    if (edge.warnings.length > 0) lines.push(`⚠️ ${edge.warnings[0]}`);
    lines.push("");
  }

  if (summary.edges.length > 8) {
    lines.push(`…and ${summary.edges.length - 8} more edge(s).`);
    lines.push("");
  }

  if (summary.warnings.length > 0) {
    lines.push("Warnings:");
    for (const warning of summary.warnings.slice(0, 3)) lines.push(`⚠️ ${warning}`);
    lines.push("");
  }

  lines.push("Read-only. Candidate/unresolved edges are not proof of final movement.");
  return lines.join("\n");
}

function statusIcon(status: string): string {
  if (status === "confirmed") return "✅";
  if (status === "candidate") return "🟡";
  if (status === "partial") return "🧩";
  return "⚠️";
}
