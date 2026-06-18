import type { TokenMovementEvidenceBundle, TokenMovementEvidenceBundleCollection } from "@watchtower/core";

function trimLine(value: string, max = 120): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

export function renderTelegramTokenMovementEvidenceBundle(bundle: TokenMovementEvidenceBundle): string {
  const missing = bundle.missingEvidence.length > 0 ? bundle.missingEvidence.map((item) => `• ${trimLine(item)}`).join("\n") : "None";
  const checks = bundle.recommendedNextChecks.map((item) => `• ${trimLine(item)}`).join("\n");

  return [
    `🔎 ${bundle.title}`,
    `Movement: ${bundle.movementId}`,
    `Status: ${bundle.status}`,
    `Proof: ${bundle.proofStatus}`,
    `Review: ${bundle.needsReview ? "needed" : "not flagged"}`,
    ``,
    trimLine(bundle.summary, 180),
    ``,
    `Missing evidence:`,
    missing,
    ``,
    `Next checks:`,
    checks,
    ``,
    `Read-only. No signing, custody, trading, recovery, or proof claim for unresolved rows.`,
  ].join("\n");
}

export function renderTelegramTokenMovementEvidenceBundleCollection(collection: TokenMovementEvidenceBundleCollection): string {
  const header = [
    `🔎 Token movement evidence bundles`,
    `Total: ${collection.totalMovements}`,
    `Confirmed: ${collection.confirmedBundles}`,
    `Unresolved: ${collection.unresolvedBundles}`,
  ].join("\n");

  const body = collection.bundles.slice(0, 5).map(renderTelegramTokenMovementEvidenceBundle).join("\n\n---\n\n");
  const footer = collection.bundles.length > 5 ? `\n\nShowing first 5 of ${collection.bundles.length}.` : "";

  return `${header}\n\n${body || "No evidence bundles available."}${footer}`;
}
