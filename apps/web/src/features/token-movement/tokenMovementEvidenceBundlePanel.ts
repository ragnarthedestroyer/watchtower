import type { TokenMovementEvidenceBundle, TokenMovementEvidenceBundleCollection } from "@watchtower/core";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderList(items: readonly string[]): string {
  if (items.length === 0) return "<p>None.</p>";
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

export function renderTokenMovementEvidenceBundlePanel(bundle: TokenMovementEvidenceBundle): string {
  const facts = bundle.observedFacts
    .map((fact) => `<tr><td>${escapeHtml(fact.label)}</td><td>${escapeHtml(fact.value)}</td><td>${escapeHtml(fact.confidence)}</td></tr>`)
    .join("");
  const checklist = bundle.checklist
    .map((item) => `<li><strong>${escapeHtml(item.label)}</strong>: ${escapeHtml(item.status)} — ${escapeHtml(item.detail)}</li>`)
    .join("");

  return [
    `<section data-watchtower-panel="token-movement-evidence-bundle">`,
    `<h2>${escapeHtml(bundle.title)}</h2>`,
    `<p><strong>Status:</strong> ${escapeHtml(bundle.status)} | <strong>Proof:</strong> ${escapeHtml(bundle.proofStatus)} | <strong>Needs review:</strong> ${bundle.needsReview ? "yes" : "no"}</p>`,
    `<p>${escapeHtml(bundle.summary)}</p>`,
    `<table><thead><tr><th>Fact</th><th>Value</th><th>Confidence</th></tr></thead><tbody>${facts}</tbody></table>`,
    `<h3>Checklist</h3><ul>${checklist}</ul>`,
    `<h3>Missing evidence</h3>${renderList(bundle.missingEvidence)}`,
    `<h3>Recommended next checks</h3>${renderList(bundle.recommendedNextChecks)}`,
    `<p><strong>Safety:</strong> Read-only evidence view. It does not recover funds and does not prove unresolved movements.</p>`,
    `</section>`,
  ].join("\n");
}

export function renderTokenMovementEvidenceBundleCollectionPanel(collection: TokenMovementEvidenceBundleCollection): string {
  const cards = collection.bundles.map(renderTokenMovementEvidenceBundlePanel).join("\n");
  return [
    `<section data-watchtower-panel="token-movement-evidence-bundle-collection">`,
    `<h1>Token movement evidence bundles</h1>`,
    `<p>Total: ${collection.totalMovements} | Confirmed: ${collection.confirmedBundles} | Unresolved: ${collection.unresolvedBundles}</p>`,
    cards || `<p>No token movement evidence bundles available.</p>`,
    `</section>`,
  ].join("\n");
}
