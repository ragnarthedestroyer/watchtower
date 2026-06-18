import {
  createTokenMovementExportBundle,
  renderTokenMovementExportCsv,
  renderTokenMovementExportJson,
  renderTokenMovementExportMarkdown,
  type TokenMovementExportFormat,
  type TokenMovementExportScope,
  type TokenMovementExportSourceLike,
} from "@watchtower/core";

export interface TokenMovementExportPanelOptions {
  readonly title?: string;
  readonly scope?: TokenMovementExportScope;
  readonly format?: TokenMovementExportFormat;
  readonly generatedAt?: string;
}

export function renderTokenMovementExportPanel(
  records: readonly TokenMovementExportSourceLike[],
  options: TokenMovementExportPanelOptions = {},
): string {
  const format = options.format ?? "markdown";
  const bundle = createTokenMovementExportBundle(records, {
    title: options.title ?? "Token movement export",
    scope: options.scope ?? "all",
    ...(options.generatedAt === undefined ? {} : { generatedAt: options.generatedAt }),
  });

  const body = format === "csv"
    ? renderTokenMovementExportCsv(bundle)
    : format === "json"
      ? renderTokenMovementExportJson(bundle)
      : renderTokenMovementExportMarkdown(bundle);

  return [
    "<section data-watchtower-token-movement-export>",
    `  <h2>${escapeHtml(bundle.title)}</h2>`,
    "  <p>Read-only export preview. Unresolved rows are not proof of final asset movement.</p>",
    `  <p>Total: ${bundle.summary.totalRecords} · Confirmed: ${bundle.summary.confirmedRecords} · Unresolved: ${bundle.summary.unresolvedRecords}</p>`,
    `  <pre>${escapeHtml(body)}</pre>`,
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
