import {
  createTokenMovementDashboardSessionState,
  renderTokenMovementDashboardSessionStateText,
  type TokenMovementDashboardSessionInput,
} from "@watchtower/core";

export function renderTokenMovementDashboardSessionStatePanel(
  input: TokenMovementDashboardSessionInput,
): string {
  const state = createTokenMovementDashboardSessionState(input);
  const checklist = state.noStorageChecklist
    .map((check) => `<li data-severity="${escapeHtml(check.severity)}">${check.passed ? "OK" : "REVIEW"}: ${escapeHtml(check.label)}</li>`)
    .join("\n");

  return [
    "<section data-watchtower-token-movement-session-state>",
    `  <h2>${escapeHtml(state.title)}</h2>`,
    `  <p>${escapeHtml(state.message)}</p>`,
    `  <p>Address: ${escapeHtml(state.watchedAddressPreview)}</p>`,
    `  <p>Storage mode: ${escapeHtml(state.storageMode)} · Privacy guard: ${state.privacySafe ? "passed" : "needs review"}</p>`,
    "  <ul>",
    checklist,
    "  </ul>",
    `  <pre>${escapeHtml(renderTokenMovementDashboardSessionStateText(state))}</pre>`,
    "</section>",
  ].join("\n");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");
}
