/**
 * Watchtower Batch 67 — Direct transfer classifier foundation
 *
 * Builds an on-the-fly, read-only classifier that separates direct NACKL,
 * SHELL, and USDC transfers in/out from mining rewards and unresolved or
 * contract-routed flows.
 *
 * This file does not fetch chain data, persist user data, use browser storage,
 * use analytics, sign transactions, custody assets, operate PrivateNote,
 * trade, or decode token transfers.
 */

export type DirectTransferAssetSymbol = "NACKL" | "SHELL" | "USDC";

export type DirectTransferSectionId =
  | "direct-nackl-in"
  | "direct-shell-in"
  | "direct-usdc-in"
  | "direct-nackl-out"
  | "direct-shell-out"
  | "direct-usdc-out"
  | "excluded-unresolved-or-routed";

export type DirectTransferConfidence = "confirmed" | "probable" | "possible" | "unresolved";

export interface DirectTransferClassifierSourceLike {
  readonly id?: unknown;
  readonly movementId?: unknown;
  readonly token?: unknown;
  readonly asset?: unknown;
  readonly symbol?: unknown;
  readonly direction?: unknown;
  readonly amount?: unknown;
  readonly amountDisplay?: unknown;
  readonly from?: unknown;
  readonly to?: unknown;
  readonly source?: unknown;
  readonly destination?: unknown;
  readonly observedAt?: unknown;
  readonly timestamp?: unknown;
  readonly proofStatus?: unknown;
  readonly confidence?: unknown;
  readonly label?: unknown;
  readonly labels?: unknown;
  readonly likelyAction?: unknown;
  readonly explanation?: unknown;
  readonly warning?: unknown;
  readonly warnings?: unknown;
  readonly contract?: unknown;
  readonly contractLabel?: unknown;
  readonly decoderStatus?: unknown;
  readonly evidence?: unknown;
}

export interface ClassifiedDirectTransferRow {
  readonly id: string;
  readonly sectionId: DirectTransferSectionId;
  readonly asset: DirectTransferAssetSymbol | "OTHER";
  readonly direction: "in" | "out" | "unknown";
  readonly amount: string;
  readonly from: string;
  readonly to: string;
  readonly observedAt: string;
  readonly confidence: DirectTransferConfidence;
  readonly reason: string;
  readonly warnings: readonly string[];
  readonly source: DirectTransferClassifierSourceLike;
}

export interface DirectTransferClassifierSection {
  readonly id: DirectTransferSectionId;
  readonly title: string;
  readonly description: string;
  readonly rows: readonly ClassifiedDirectTransferRow[];
  readonly totalRows: number;
  readonly unresolvedRows: number;
}

export interface DirectTransferClassifierDashboard {
  readonly generatedAt: string;
  readonly mode: "on-the-fly-no-storage";
  readonly sections: readonly DirectTransferClassifierSection[];
  readonly summary: {
    readonly totalRows: number;
    readonly directNacklInRows: number;
    readonly directShellInRows: number;
    readonly directUsdcInRows: number;
    readonly directNacklOutRows: number;
    readonly directShellOutRows: number;
    readonly directUsdcOutRows: number;
    readonly excludedRows: number;
  };
  readonly safetyNotes: readonly string[];
}

const SECTION_ORDER: readonly DirectTransferSectionId[] = [
  "direct-nackl-in",
  "direct-shell-in",
  "direct-usdc-in",
  "direct-nackl-out",
  "direct-shell-out",
  "direct-usdc-out",
  "excluded-unresolved-or-routed",
];

export function classifyDirectTransfersForDashboard(
  records: readonly DirectTransferClassifierSourceLike[],
  options: { readonly generatedAt?: string } = {},
): DirectTransferClassifierDashboard {
  const rows = records.map((record, index) => classifyOneDirectTransferRecord(record, index));
  const sections = SECTION_ORDER.map((sectionId) => createSection(sectionId, rows));

  return {
    generatedAt: options.generatedAt ?? new Date(0).toISOString(),
    mode: "on-the-fly-no-storage",
    sections,
    summary: {
      totalRows: rows.length,
      directNacklInRows: countRows(rows, "direct-nackl-in"),
      directShellInRows: countRows(rows, "direct-shell-in"),
      directUsdcInRows: countRows(rows, "direct-usdc-in"),
      directNacklOutRows: countRows(rows, "direct-nackl-out"),
      directShellOutRows: countRows(rows, "direct-shell-out"),
      directUsdcOutRows: countRows(rows, "direct-usdc-out"),
      excludedRows: countRows(rows, "excluded-unresolved-or-routed"),
    },
    safetyNotes: [
      "Direct transfer classification is derived on the fly from the current input only.",
      "NACKL mining rewards must remain in the mining reward section, not normal transfer-in.",
      "Accumulator, bridge, PrivateNote, DEX, unknown token, and decoder-needed rows are excluded from simple direct transfer visuals.",
      "No searched address or wallet movement history should be retained by this classifier.",
    ],
  };
}

export function renderDirectTransferClassifierDashboardText(
  dashboard: DirectTransferClassifierDashboard,
): string {
  const lines: string[] = [
    "Watchtower direct transfer dashboard",
    `Mode: ${dashboard.mode}`,
    `Generated: ${dashboard.generatedAt}`,
    `Total rows: ${dashboard.summary.totalRows}`,
    `NACKL in: ${dashboard.summary.directNacklInRows}`,
    `SHELL in: ${dashboard.summary.directShellInRows}`,
    `USDC in: ${dashboard.summary.directUsdcInRows}`,
    `NACKL out: ${dashboard.summary.directNacklOutRows}`,
    `SHELL out: ${dashboard.summary.directShellOutRows}`,
    `USDC out: ${dashboard.summary.directUsdcOutRows}`,
    `Excluded / unresolved: ${dashboard.summary.excludedRows}`,
    "",
  ];

  for (const section of dashboard.sections) {
    lines.push(`${section.title} (${section.totalRows})`);
    lines.push(section.description);

    if (section.rows.length === 0) {
      lines.push("- No rows in this section.");
    } else {
      for (const row of section.rows) {
        lines.push(`- ${row.asset} ${row.amount} · ${row.direction} · ${row.confidence} · ${row.reason}`);
      }
    }

    lines.push("");
  }

  lines.push("Safety notes:");
  for (const note of dashboard.safetyNotes) lines.push(`- ${note}`);

  return lines.join("\n");
}

function classifyOneDirectTransferRecord(
  record: DirectTransferClassifierSourceLike,
  index: number,
): ClassifiedDirectTransferRow {
  const asset = extractAsset(record);
  const direction = extractDirection(record);
  const amount = extractAmount(record);
  const from = extractText(record.from) ?? extractText(record.source) ?? "unknown";
  const to = extractText(record.to) ?? extractText(record.destination) ?? "unknown";
  const observedAt = extractText(record.observedAt) ?? extractText(record.timestamp) ?? "unknown";
  const text = searchableText(record);
  const warnings = extractWarnings(record);
  const id = extractText(record.id) ?? extractText(record.movementId) ?? `movement-${index + 1}`;

  if (asset === "OTHER") {
    return excludedRow(record, id, asset, direction, amount, from, to, observedAt, warnings, "Asset is not NACKL, SHELL, or USDC.");
  }

  if (direction === "unknown") {
    return excludedRow(record, id, asset, direction, amount, from, to, observedAt, warnings, "Direction is unknown, so this cannot be visualized as a direct transfer in/out.");
  }

  if (isMiningRewardCandidate(asset, direction, text)) {
    return excludedRow(record, id, asset, direction, amount, from, to, observedAt, warnings, "NACKL mining/reward signal belongs in the mining rewards visual, not direct transfer in.");
  }

  if (isContractSensitive(text)) {
    return excludedRow(record, id, asset, direction, amount, from, to, observedAt, warnings, "Movement appears contract-routed, decoder-needed, or unresolved.");
  }

  const sectionId = directSectionFor(asset, direction);
  return {
    id,
    sectionId,
    asset,
    direction,
    amount,
    from,
    to,
    observedAt,
    confidence: confidenceFromText(text, "possible"),
    reason: `${asset} direct transfer ${direction}.`,
    warnings,
    source: record,
  };
}

function excludedRow(
  record: DirectTransferClassifierSourceLike,
  id: string,
  asset: DirectTransferAssetSymbol | "OTHER",
  direction: "in" | "out" | "unknown",
  amount: string,
  from: string,
  to: string,
  observedAt: string,
  warnings: readonly string[],
  reason: string,
): ClassifiedDirectTransferRow {
  return {
    id,
    sectionId: "excluded-unresolved-or-routed",
    asset,
    direction,
    amount,
    from,
    to,
    observedAt,
    confidence: "unresolved",
    reason,
    warnings: warnings.length === 0 ? ["Requires review before simple direct-transfer classification."] : warnings,
    source: record,
  };
}

function directSectionFor(
  asset: DirectTransferAssetSymbol,
  direction: "in" | "out",
): DirectTransferSectionId {
  if (asset === "NACKL" && direction === "in") return "direct-nackl-in";
  if (asset === "SHELL" && direction === "in") return "direct-shell-in";
  if (asset === "USDC" && direction === "in") return "direct-usdc-in";
  if (asset === "NACKL" && direction === "out") return "direct-nackl-out";
  if (asset === "SHELL" && direction === "out") return "direct-shell-out";
  return "direct-usdc-out";
}

function createSection(
  sectionId: DirectTransferSectionId,
  rows: readonly ClassifiedDirectTransferRow[],
): DirectTransferClassifierSection {
  const sectionRows = rows.filter((row) => row.sectionId === sectionId);
  return {
    id: sectionId,
    title: sectionTitle(sectionId),
    description: sectionDescription(sectionId),
    rows: sectionRows,
    totalRows: sectionRows.length,
    unresolvedRows: sectionRows.filter((row) => row.confidence === "unresolved").length,
  };
}

function sectionTitle(sectionId: DirectTransferSectionId): string {
  switch (sectionId) {
    case "direct-nackl-in":
      return "NACKL direct transfers in";
    case "direct-shell-in":
      return "SHELL direct transfers in";
    case "direct-usdc-in":
      return "USDC direct transfers in";
    case "direct-nackl-out":
      return "NACKL direct transfers out";
    case "direct-shell-out":
      return "SHELL direct transfers out";
    case "direct-usdc-out":
      return "USDC direct transfers out";
    case "excluded-unresolved-or-routed":
      return "Excluded, unresolved, or contract-routed";
  }
}

function sectionDescription(sectionId: DirectTransferSectionId): string {
  switch (sectionId) {
    case "direct-nackl-in":
      return "Inbound NACKL rows that do not look like mining rewards or contract-routed flows.";
    case "direct-shell-in":
      return "Inbound SHELL rows that look like simple direct transfers.";
    case "direct-usdc-in":
      return "Inbound USDC rows that look like simple direct transfers.";
    case "direct-nackl-out":
      return "Outbound NACKL rows that look like simple direct transfers.";
    case "direct-shell-out":
      return "Outbound SHELL rows that look like simple direct transfers.";
    case "direct-usdc-out":
      return "Outbound USDC rows that look like simple direct transfers.";
    case "excluded-unresolved-or-routed":
      return "Mining rewards, unknown tokens, decoder-needed rows, accumulators, bridges, PrivateNote, DEX, and other contract-routed flows.";
  }
}

function countRows(
  rows: readonly ClassifiedDirectTransferRow[],
  sectionId: DirectTransferSectionId,
): number {
  return rows.filter((row) => row.sectionId === sectionId).length;
}

function extractAsset(record: DirectTransferClassifierSourceLike): DirectTransferAssetSymbol | "OTHER" {
  const raw = [record.token, record.asset, record.symbol].map(extractText).filter(isString).join(" ").toUpperCase();
  if (raw.indexOf("NACKL") >= 0) return "NACKL";
  if (raw.indexOf("SHELL") >= 0) return "SHELL";
  if (raw.indexOf("USDC") >= 0) return "USDC";
  return "OTHER";
}

function extractDirection(record: DirectTransferClassifierSourceLike): "in" | "out" | "unknown" {
  const raw = extractText(record.direction)?.toLowerCase() ?? "";
  if (containsExact(["in", "incoming", "inbound", "received", "receive"], raw)) return "in";
  if (containsExact(["out", "outgoing", "outbound", "sent", "send"], raw)) return "out";
  if (raw.indexOf("incoming") >= 0 || raw.indexOf("inbound") >= 0 || raw.indexOf("received") >= 0) return "in";
  if (raw.indexOf("outgoing") >= 0 || raw.indexOf("outbound") >= 0 || raw.indexOf("sent") >= 0) return "out";
  return "unknown";
}

function extractAmount(record: DirectTransferClassifierSourceLike): string {
  return extractText(record.amountDisplay) ?? extractText(record.amount) ?? "unknown amount";
}

function extractWarnings(record: DirectTransferClassifierSourceLike): readonly string[] {
  const values: string[] = [];
  for (const value of [record.warning, record.warnings]) {
    values.push(...extractTextList(value));
  }
  return values;
}

function isMiningRewardCandidate(asset: DirectTransferAssetSymbol, direction: "in" | "out", text: string): boolean {
  return asset === "NACKL" && direction === "in" && hasAny(text, [
    "mining",
    "miner",
    "reward",
    "rewards",
    "bee",
    "emission",
    "claim reward",
    "nackl mining",
  ]);
}

function isContractSensitive(text: string): boolean {
  return hasAny(text, [
    "accumulator",
    "bridge",
    "tokenbridge",
    "private note",
    "privatenote",
    "dex",
    "dodex",
    "contract-routed",
    "contract routed",
    "decoder needed",
    "unknown contract",
    "unresolved",
    "partial evidence",
  ]);
}

function confidenceFromText(text: string, fallback: DirectTransferConfidence): DirectTransferConfidence {
  if (hasAny(text, ["confirmed", "final", "verified"])) return "confirmed";
  if (hasAny(text, ["probable", "likely", "high confidence"])) return "probable";
  if (hasAny(text, ["possible", "candidate", "partial"])) return "possible";
  if (hasAny(text, ["unresolved", "unknown", "decoder needed"])) return "unresolved";
  return fallback;
}

function searchableText(record: DirectTransferClassifierSourceLike): string {
  const values: string[] = [];
  for (const value of [
    record.token,
    record.asset,
    record.symbol,
    record.direction,
    record.proofStatus,
    record.confidence,
    record.label,
    record.labels,
    record.likelyAction,
    record.explanation,
    record.warning,
    record.warnings,
    record.contract,
    record.contractLabel,
    record.decoderStatus,
    record.evidence,
  ]) {
    values.push(...extractTextList(value));
  }

  return values.join(" ").toLowerCase();
}

function hasAny(value: string, needles: readonly string[]): boolean {
  return needles.some((needle) => value.indexOf(needle) >= 0);
}

function containsExact(values: readonly string[], value: string): boolean {
  return values.some((candidate) => candidate === value);
}

function extractText(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "bigint" || typeof value === "boolean") return String(value);
  if (value && typeof value === "object") {
    const objectValue = value as Record<string, unknown>;
    for (const key of ["display", "displayAmount", "symbol", "kind", "value", "address", "label", "name", "id"]) {
      const nested = extractText(objectValue[key]);
      if (nested !== undefined) return nested;
    }
  }
  return undefined;
}

function extractTextList(value: unknown): readonly string[] {
  if (value === undefined || value === null) return [];
  if (Array.isArray(value)) {
    const values: string[] = [];
    for (const item of value) values.push(...extractTextList(item));
    return values;
  }
  const text = extractText(value);
  return text === undefined ? [] : [text];
}

function isString(value: string | undefined): value is string {
  return value !== undefined;
}
