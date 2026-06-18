export type TokenMovementExportFormat = "json" | "csv" | "markdown";

export type TokenMovementExportScope =
  | "all"
  | "confirmed"
  | "unresolved"
  | "decoder-needed"
  | "incident-review";

export interface TokenMovementExportRecord {
  readonly id: string;
  readonly token: string;
  readonly amount: string;
  readonly direction: string;
  readonly from: string;
  readonly to: string;
  readonly observedAt: string;
  readonly proofStatus: string;
  readonly confidence: string;
  readonly likelyExplanation: string;
  readonly warnings: readonly string[];
  readonly evidenceCount: number;
}

export interface TokenMovementExportBundle {
  readonly id: string;
  readonly title: string;
  readonly scope: TokenMovementExportScope;
  readonly generatedAt: string;
  readonly records: readonly TokenMovementExportRecord[];
  readonly summary: TokenMovementExportSummary;
  readonly safetyNotes: readonly string[];
}

export interface TokenMovementExportSummary {
  readonly totalRecords: number;
  readonly confirmedRecords: number;
  readonly unresolvedRecords: number;
  readonly decoderNeededRecords: number;
  readonly tokens: readonly string[];
}

export interface TokenMovementExportOptions {
  readonly id?: string;
  readonly title?: string;
  readonly scope?: TokenMovementExportScope;
  readonly generatedAt?: string;
  readonly safetyNotes?: readonly string[];
}

export interface TokenMovementExportSourceLike {
  readonly id?: unknown;
  readonly token?: unknown;
  readonly amount?: unknown;
  readonly direction?: unknown;
  readonly from?: unknown;
  readonly to?: unknown;
  readonly observedAt?: unknown;
  readonly proofStatus?: unknown;
  readonly confidence?: unknown;
  readonly likelyExplanation?: unknown;
  readonly explanation?: unknown;
  readonly warnings?: unknown;
  readonly evidence?: unknown;
  readonly decoderStatus?: unknown;
}

const DEFAULT_SAFETY_NOTES: readonly string[] = [
  "Read-only export: this file is not a wallet, signer, transaction builder, or custody tool.",
  "Unresolved or candidate rows must not be treated as proven asset movement.",
  "Amounts, token labels, and contract labels may remain approximate until decoded and independently verified.",
];

export function createTokenMovementExportBundle(
  source: readonly TokenMovementExportSourceLike[],
  options: TokenMovementExportOptions = {},
): TokenMovementExportBundle {
  const records = source.map((item, index) => normalizeExportRecord(item, index));
  const scope = options.scope ?? "all";
  const scopedRecords = filterRecordsByScope(records, scope);

  return {
    id: options.id ?? `movement-export-${stableExportTimestamp(options.generatedAt)}`,
    title: options.title ?? "Token movement evidence export",
    scope,
    generatedAt: options.generatedAt ?? new Date(0).toISOString(),
    records: scopedRecords,
    summary: summarizeTokenMovementExportRecords(scopedRecords),
    safetyNotes: options.safetyNotes ?? DEFAULT_SAFETY_NOTES,
  };
}

export function summarizeTokenMovementExportRecords(
  records: readonly TokenMovementExportRecord[],
): TokenMovementExportSummary {
  const tokens = Array.from(new Set(records.map((record) => record.token))).sort();

  return {
    totalRecords: records.length,
    confirmedRecords: records.filter((record) => record.proofStatus === "confirmed").length,
    unresolvedRecords: records.filter((record) =>
      record.proofStatus === "unresolved" || record.confidence === "unresolved",
    ).length,
    decoderNeededRecords: records.filter((record) =>
      record.warnings.some((warning) => warning.toLowerCase().includes("decoder")),
    ).length,
    tokens,
  };
}

export function renderTokenMovementExportMarkdown(bundle: TokenMovementExportBundle): string {
  const lines: string[] = [
    `# ${bundle.title}`,
    "",
    `Export ID: ${bundle.id}`,
    `Scope: ${bundle.scope}`,
    `Generated: ${bundle.generatedAt}`,
    "",
    "## Summary",
    "",
    `- Total records: ${bundle.summary.totalRecords}`,
    `- Confirmed records: ${bundle.summary.confirmedRecords}`,
    `- Unresolved records: ${bundle.summary.unresolvedRecords}`,
    `- Decoder-needed records: ${bundle.summary.decoderNeededRecords}`,
    `- Tokens: ${bundle.summary.tokens.length > 0 ? bundle.summary.tokens.join(", ") : "none"}`,
    "",
    "## Safety notes",
    "",
    ...bundle.safetyNotes.map((note) => `- ${note}`),
    "",
    "## Records",
    "",
  ];

  if (bundle.records.length === 0) {
    lines.push("No records matched this export scope.");
    return lines.join("\n");
  }

  for (const record of bundle.records) {
    lines.push(
      `### ${record.id}`,
      "",
      `- Token: ${record.token}`,
      `- Amount: ${record.amount}`,
      `- Direction: ${record.direction}`,
      `- From: ${record.from}`,
      `- To: ${record.to}`,
      `- Observed: ${record.observedAt}`,
      `- Proof status: ${record.proofStatus}`,
      `- Confidence: ${record.confidence}`,
      `- Evidence count: ${record.evidenceCount}`,
      `- Likely explanation: ${record.likelyExplanation}`,
    );

    if (record.warnings.length > 0) {
      lines.push("- Warnings:");
      lines.push(...record.warnings.map((warning) => `  - ${warning}`));
    }

    lines.push("");
  }

  return lines.join("\n");
}

export function renderTokenMovementExportCsv(bundle: TokenMovementExportBundle): string {
  const header = [
    "id",
    "token",
    "amount",
    "direction",
    "from",
    "to",
    "observedAt",
    "proofStatus",
    "confidence",
    "evidenceCount",
    "likelyExplanation",
    "warnings",
  ];

  const rows = bundle.records.map((record) => [
    record.id,
    record.token,
    record.amount,
    record.direction,
    record.from,
    record.to,
    record.observedAt,
    record.proofStatus,
    record.confidence,
    String(record.evidenceCount),
    record.likelyExplanation,
    record.warnings.join(" | "),
  ]);

  return [header, ...rows].map((row) => row.map(escapeCsvCell).join(",")).join("\n");
}

export function renderTokenMovementExportJson(bundle: TokenMovementExportBundle): string {
  return JSON.stringify(bundle, null, 2);
}

function normalizeExportRecord(item: TokenMovementExportSourceLike, index: number): TokenMovementExportRecord {
  const warnings = toStringArray(item.warnings);
  const decoderStatus = toText(item.decoderStatus, "");

  if (decoderStatus.toLowerCase().includes("needed") && !warnings.some((warning) => warning.toLowerCase().includes("decoder"))) {
    warnings.push("Decoder needed before this movement can be treated as confirmed.");
  }

  return {
    id: toText(item.id, `movement-${index + 1}`),
    token: toText(item.token, "UNKNOWN"),
    amount: toAmountText(item.amount),
    direction: toText(item.direction, "unknown"),
    from: toText(item.from, "unknown"),
    to: toText(item.to, "unknown"),
    observedAt: toText(item.observedAt, "unknown"),
    proofStatus: toText(item.proofStatus, "unresolved"),
    confidence: toText(item.confidence, "unresolved"),
    likelyExplanation: toText(item.likelyExplanation, toText(item.explanation, "No explanation available yet.")),
    warnings,
    evidenceCount: Array.isArray(item.evidence) ? item.evidence.length : 0,
  };
}

function filterRecordsByScope(
  records: readonly TokenMovementExportRecord[],
  scope: TokenMovementExportScope,
): readonly TokenMovementExportRecord[] {
  switch (scope) {
    case "confirmed":
      return records.filter((record) => record.proofStatus === "confirmed");
    case "unresolved":
      return records.filter((record) => record.proofStatus !== "confirmed" || record.confidence === "unresolved");
    case "decoder-needed":
      return records.filter((record) => record.warnings.some((warning) => warning.toLowerCase().includes("decoder")));
    case "incident-review":
      return records.filter((record) =>
        record.token === "SHELL" ||
        record.token === "USDC" ||
        record.likelyExplanation.toLowerCase().includes("accumulator") ||
        record.likelyExplanation.toLowerCase().includes("bridge"),
      );
    case "all":
    default:
      return records;
  }
}

function toText(value: unknown, fallback: string): string {
  if (typeof value === "string" && value.trim().length > 0) return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
}

function toAmountText(value: unknown): string {
  if (typeof value === "string" && value.trim().length > 0) return value;
  if (typeof value === "number") return String(value);
  if (isRecord(value)) {
    const display = value["display"];
    const raw = value["raw"];
    const valueText = value["value"];
    return toText(display, toText(valueText, toText(raw, "unknown")));
  }
  return "unknown";
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (typeof item === "string" && item.trim().length > 0) return [item];
    if (isRecord(item)) {
      const reason = item["reason"];
      const message = item["message"];
      const label = item["label"];
      const text = toText(reason, toText(message, toText(label, "")));
      return text.length > 0 ? [text] : [];
    }
    return [];
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function stableExportTimestamp(value: string | undefined): string {
  return (value ?? new Date(0).toISOString()).replace(/[^0-9]/g, "").slice(0, 14);
}

function escapeCsvCell(value: string): string {
  const escaped = value.replace(/"/g, '""');
  return `"${escaped}"`;
}
