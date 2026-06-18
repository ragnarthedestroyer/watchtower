import type { AssetFlowVisualSummary } from "@watchtower/core";

export function renderAssetFlowVisualSummaryPanel(summary: AssetFlowVisualSummary): string {
  const warnings = summary.warnings.length
    ? `<section class="asset-flow-warnings"><strong>Warnings</strong><ul>${summary.warnings.map((warning) => `<li>${escapeHtml(warning)}</li>`).join("")}</ul></section>`
    : "";

  const nodes = summary.nodes
    .map(
      (node) => `
        <li class="asset-flow-node asset-flow-node-${escapeHtml(node.kind)}">
          <strong>${escapeHtml(node.shortLabel)}</strong>
          <span>${escapeHtml(node.kind)}</span>
          <span>confidence: ${escapeHtml(node.confidence)}</span>
          ${node.isWatched ? "<em>watched</em>" : ""}
        </li>`,
    )
    .join("");

  const edges = summary.edges
    .map((edge) => {
      const from = summary.nodes.find((node) => node.id === edge.fromNodeId)?.shortLabel ?? edge.fromNodeId;
      const to = summary.nodes.find((node) => node.id === edge.toNodeId)?.shortLabel ?? edge.toNodeId;
      return `
        <li class="asset-flow-edge asset-flow-edge-${escapeHtml(edge.status)}">
          <strong>${escapeHtml(edge.tokenSymbol)} ${escapeHtml(edge.amountText)}</strong>
          <span>${escapeHtml(from)} → ${escapeHtml(to)}</span>
          <small>${escapeHtml(edge.status)} · ${escapeHtml(edge.proofStatus)} · ${escapeHtml(edge.confidence)}</small>
          <small>${escapeHtml(edge.likelyAction)}</small>
        </li>`;
    })
    .join("");

  return `
    <section class="watchtower-panel asset-flow-summary-panel">
      <header>
        <h2>${escapeHtml(summary.title)}</h2>
        <p>Movements: ${summary.totals.movementCount} · Nodes: ${summary.totals.nodeCount} · Edges: ${summary.totals.edgeCount}</p>
        <p>Confirmed: ${summary.totals.confirmedEdges} · Candidate/partial: ${summary.totals.candidateEdges} · Unresolved: ${summary.totals.unresolvedEdges}</p>
      </header>
      ${warnings}
      <section>
        <h3>Flow edges</h3>
        <ul>${edges || "<li>No movement edges available.</li>"}</ul>
      </section>
      <section>
        <h3>Nodes</h3>
        <ul>${nodes || "<li>No nodes available.</li>"}</ul>
      </section>
      <footer>Read-only asset-flow summary. Candidate or unresolved edges are not proof of final token movement.</footer>
    </section>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
