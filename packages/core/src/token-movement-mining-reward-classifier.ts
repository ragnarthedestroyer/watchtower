/**
 * Watchtower Batch 66 — NACKL mining reward classifier foundation
 *
 * Builds an on-the-fly, read-only classifier that separates probable NACKL
 * mining rewards from direct transfers and unresolved/contract-routed flows.
 *
 * This file does not fetch chain data, persist user data, use browser storage,
 * use analytics, sign transactions, custody assets, operate PrivateNote,
 * trade, or decode token transfers.
 */

export type MiningRewardClassifierSectionId =
  | "nackl-mining-rewards"
  | "direct-transfers-in"
  | "direct-transfers-out"
  | "unresolved-or-contract-routed";

export type MiningRewardClassifierConfidence = "confirmed" | "probable" | "possible" | "unresolved";

export type MiningRewardClassifierToken = "NACKL" | "SHELL" | "USDC" | "TIP3" | "UNKNOWN";

export interface MiningRewardClassifierSourceLike {
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

export interface ClassifiedTokenMovementRow {
  readonly id: string;
  readonly sectionId: MiningRewardClassifierSectionId;
  readonly token: MiningRewardClassifierToken;
  readonly amount: string;
  readonly direction: "in" | "out" | "unknown";
  readonly from: string;
  readonly to: string;
  readonly observedAt: string;
  readonly confidence: MiningRewardClassifierConfidence;
  readonly reason: string;
  readonly warnings: readonly string[];
  readonly source: MiningRewardClassifierSourceLike;
}

export interface MiningRewardClassifierSection {
  readonly id: MiningRewardClassifierSectionId;
  readonly title: string;
  readonly description: string;
  readonly rows: readonly ClassifiedTokenMovementRow[];
  readonly totalRows: number;
  readonly unresolvedRows: number;
}

export interface MiningRewardClassifierDashboard {
  readonly generatedAt: string;
  readonly mode: "on-the-fly-no-storage";
  readonly sections: readonly MiningRewardClassifierSection[];
  readonly summary: {
    readonly totalRows: number;
    readonly miningRewardRows: number;
    readonly directTransferInRows: number;
    readonly directTransferOutRows: number;
    readonly unresolvedOrContractRoutedRows: number;
  };
  readonly safetyNotes: readonly string[];
}

const SECTION_ORDER: readonly MiningRewardClassifierSectionId[] = [
  "nackl-mining-rewards",
  "direct-transfers-in",
  "direct-transfers-out",
  "unresolved-or-contract-routed",
];

export function classifyTokenMovementsForMiningRewardDashboard(
  records: readonly MiningRewardClassifierSourceLike[],
  options: { readonly generatedAt?: string } = {},
): MiningRewardClassifierDashboard {
  const rows = records.map((record, index) => classifyOneRecord(record, index));
  const sections = SECTION_ORDER.map((sectionId) => createSection(sectionId, rows));

  return {
    generatedAt: options.generatedAt ?? new Date(0).toISOString(),
    mode: "on-the-fly-no-storage",
    sections,
    summary: {
      totalRows: rows.length,
      miningRewardRows: countRows(rows, "nackl-mining-rewards"),
      directTransferInRows: countRows(rows, "direct-transfers-in"),
      directTransferOutRows: countRows(rows, "direct-transfers-out"),
      unresolvedOrContractRoutedRows: countRows(rows, "unresolved-or-contract-routed"),
    },
    safetyNotes: [
      "Dashboard classification is derived on the fly from the current input only.",
      "NACKL mining rewards should remain visually separate from normal inbound transfers.",
      "Contract-routed, bridge, accumulator, PrivateNote, DEX, or decoder-needed rows remain unresolved until evidence is strong enough.",
      "No wallet movement history should be retained by this classifier.",
    ],
  };
}

export function renderMiningRewardClassifierDashboardText(
  dashboard: MiningRewardClassifierDashboard,
): string {
  const lines: string[] = [
    "Watchtower token movement dashboard",
    `Mode: ${dashboard.mode}`,
    `Generated: ${dashboard.generatedAt}`,
    `Total rows: ${dashboard.summary.totalRows}`,
    `NACKL mining rewards: ${dashboard.summary.miningRewardRows}`,
    `Transfers in: ${dashboard.summary.directTransferInRows}`,
    `Transfers out: ${dashboard.summary.directTransferOutRows}`,
    `Unresolved / contract-routed: ${dashboard.summary.unresolvedOrContractRoutedRows}`,
    "",
  ];

  for (const section of dashboard.sections) {
    lines.push(`${section.title} (${section.totalRows})`);
    lines.push(section.description);

    if (section.rows.length === 0) {
      lines.push("- No rows in this section.");
    } else {
      for (const row of section.rows) {
        lines.push(
          `- ${row.token} ${row.amount} · ${row.direction} · ${row.confidence} · ${row.reason}`,
        );
      }
    }

    lines.push("");
  }

  lines.push("Safety notes:");
  for (const note of dashboard.safetyNotes) lines.push(`- ${note}`);

  return lines.join("\n");
}

function classifyOneRecord(
  record: MiningRewardClassifierSourceLike,
  index: number,
): ClassifiedTokenMovementRow {
  const token = extractToken(record);
  const direction = extractDirection(record);
  const amount = extractAmount(record);
  const from = extractText(record.from) ?? extractText(record.source) ?? "unknown";
  const to = extractText(record.to) ?? extractText(record.destination) ?? "unknown";
  const observedAt = extractText(record.observedAt) ?? extractText(record.timestamp) ?? "unknown";
  const text = searchableText(record);
  const warnings = extractWarnings(record);
  const contractRouted = hasAny(text, [
    "accumulator",
    "bridge",
    "private note",
    "privatenote",
    "dex",
    "dodex",
    "contract-routed",
    "contract routed",
    "decoder needed",
    "unknown contract",
    "unresolved",
  ]);

  const miningSignal = token === "NACKL" && direction === "in" && hasAny(text, [
    "mining",
    "miner",
    "reward",
    "rewards",
    "bee",
    "emission",
    "claim reward",
    "nackl mining",
  ]);

  if (miningSignal && !contractRouted) {
    return {
      id: extractText(record.id) ?? extractText(record.movementId) ?? `movement-${index + 1}`,
      sectionId: "nackl-mining-rewards",
      token,
      amount,
      direction,
      from,
      to,
      observedAt,
      confidence: confidenceFromText(text, "probable"),
      reason: "NACKL inbound movement contains mining/reward signals.",
      warnings,
      source: record,
    };
  }

  if (contractRouted || token === "UNKNOWN" || direction === "unknown") {
    return {
      id: extractText(record.id) ?? extractText(record.movementId) ?? `movement-${index + 1}`,
      sectionId: "unresolved-or-contract-routed",
      token,
      amount,
      direction,
      from,
      to,
      observedAt,
      confidence: "unresolved",
      reason: "Movement is unknown, decoder-needed, or routed through a contract-sensitive path.",
      warnings: warnings.length === 0 ? ["Requires review before visual classification as a simple transfer."] : warnings,
      source: record,
    };
  }

  if (direction === "in") {
    return {
      id: extractText(record.id) ?? extractText(record.movementId) ?? `movement-${index + 1}`,
      sectionId: "direct-transfers-in",
      token,
      amount,
      direction,
      from,
      to,
      observedAt,
      confidence: confidenceFromText(text, "possible"),
      reason: "Inbound NACKL/SHELL/USDC movement without mining reward signal.",
      warnings,
      source: record,
    };
  }

  return {
    id: extractText(record.id) ?? extractText(record.movementId) ?? `movement-${index + 1}`,
    sectionId: "direct-transfers-out",
    token,
    amount,
    direction,
    from,
    to,
    observedAt,
    confidence: confidenceFromText(text, "possible"),
    reason: "Outbound NACKL/SHELL/USDC movement without unresolved contract signal.",
    warnings,
    source: record,
  };
}

function createSection(
  sectionId: MiningRewardClassifierSectionId,
  rows: readonly ClassifiedTokenMovementRow[],
): MiningRewardClassifierSection {
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

function sectionTitle(sectionId: MiningRewardClassifierSectionId): string {
  switch (sectionId) {
    case "nackl-mining-rewards":
      return "NACKL mining rewards";
    case "direct-transfers-in":
      return "Direct transfers in";
    case "direct-transfers-out":
      return "Direct transfers out";
    case "unresolved-or-contract-routed":
      return "Unresolved or contract-routed flows";
  }
}

function sectionDescription(sectionId: MiningRewardClassifierSectionId): string {
  switch (sectionId) {
    case "nackl-mining-rewards":
      return "Inbound NACKL rows that look like mining or reward activity.";
    case "direct-transfers-in":
      return "Inbound NACKL, SHELL, or USDC rows that do not look like mining rewards.";
    case "direct-transfers-out":
      return "Outbound NACKL, SHELL, or USDC rows that do not look contract-sensitive.";
    case "unresolved-or-contract-routed":
      return "Unknown, decoder-needed, accumulator, bridge, PrivateNote, DEX, or other contract-routed rows.";
  }
}

function countRows(
  rows: readonly ClassifiedTokenMovementRow[],
  sectionId: MiningRewardClassifierSectionId,
): number {
  return rows.filter((row) => row.sectionId === sectionId).length;
}

function extractToken(record: MiningRewardClassifierSourceLike): MiningRewardClassifierToken {
  const raw = [record.token, record.asset, record.symbol].map(extractText).filter(isString).join(" ").toUpperCase();
  if (raw.indexOf("NACKL") >= 0) return "NACKL";
  if (raw.indexOf("SHELL") >= 0) return "SHELL";
  if (raw.indexOf("USDC") >= 0) return "USDC";
  if (raw.indexOf("TIP3") >= 0 || raw.indexOf("TIP-3") >= 0) return "TIP3";
  return "UNKNOWN";
}

function extractDirection(record: MiningRewardClassifierSourceLike): "in" | "out" | "unknown" {
  const raw = extractText(record.direction)?.toLowerCase() ?? "";
  if (containsExact(["in", "incoming", "inbound", "received", "receive"], raw)) return "in";
  if (containsExact(["out", "outgoing", "outbound", "sent", "send"], raw)) return "out";
  if (raw.indexOf("incoming") >= 0 || raw.indexOf("inbound") >= 0) return "in";
  if (raw.indexOf("outgoing") >= 0 || raw.indexOf("outbound") >= 0) return "out";
  return "unknown";
}

function extractAmount(record: MiningRewardClassifierSourceLike): string {
  return extractText(record.amountDisplay) ?? extractText(record.amount) ?? "unknown amount";
}

function extractWarnings(record: MiningRewardClassifierSourceLike): readonly string[] {
  const values: string[] = [];
  for (const value of [record.warning, record.warnings]) {
    values.push(...extractTextList(value));
  }
  return values.length === 0 ? [] : values;
}

function confidenceFromText(text: string, fallback: MiningRewardClassifierConfidence): MiningRewardClassifierConfidence {
  if (hasAny(text, ["confirmed", "final", "verified"])) return "confirmed";
  if (hasAny(text, ["probable", "likely", "high confidence"])) return "probable";
  if (hasAny(text, ["possible", "candidate", "partial"])) return "possible";
  if (hasAny(text, ["unresolved", "unknown", "decoder needed"])) return "unresolved";
  return fallback;
}

function searchableText(record: MiningRewardClassifierSourceLike): string {
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
