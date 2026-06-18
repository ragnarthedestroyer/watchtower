import type { TokenMovementQueryPreset, TokenMovementQueryResult } from "@watchtower/core";

export function renderTokenMovementQueryPanel(
  result: TokenMovementQueryResult,
  presets: readonly TokenMovementQueryPreset[],
): string {
  const presetItems = presets
    .map((preset) => `<li><strong>${escapeHtml(preset.label)}</strong>: ${escapeHtml(preset.description)}</li>`)
    .join("");

  const warnings = result.warnings.length
    ? `<ul>${result.warnings.map((warning) => `<li>${escapeHtml(warning)}</li>`).join("")}</ul>`
    : "<p>No query warnings.</p>";

  return `
<section class="watchtower-token-movement-query-panel">
  <h2>Token movement query</h2>
  <p class="safety-note">Read-only view. Filters only change what Watchtower displays; they never trigger wallet, bridge, DEX, or token actions.</p>
  <dl>
    <dt>Total matching movements</dt>
    <dd>${result.totalBeforePagination}</dd>
    <dt>Returned movements</dt>
    <dd>${result.returned}</dd>
    <dt>Mode</dt>
    <dd>${escapeHtml(result.query.mode ?? "all")}</dd>
  </dl>
  <h3>Useful presets</h3>
  <ul>${presetItems}</ul>
  <h3>Warnings</h3>
  ${warnings}
</section>`.trim();
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
