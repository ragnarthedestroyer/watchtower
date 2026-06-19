/**
 * Watchtower Batch 68 — On-the-fly frontend dashboard composer
 *
 * Composes the mining reward classifier and direct transfer classifier into
 * one frontend-ready, read-only dashboard model.
 *
 * This file does not fetch chain data, persist user data, use browser storage,
 * use analytics, sign transactions, custody assets, operate PrivateNote,
 * trade, or decode token transfers.
 */

import {
  classifyTokenMovementsForMiningRewardDashboard,
  type ClassifiedTokenMovementRow,
  type MiningRewardClassifierSourceLike,
} from "./token-movement-mining-reward-classifier";
import {
  classifyDirectTransfersForDashboard,
  type ClassifiedDirectTransferRow,
  type DirectTransferClassifierSourceLike,
} from "./token-movement-direct-transfer-classifier";

export type TokenMovementOnTheFlyFrontendDashboardSourceLike =
  MiningRewardClassifierSourceLike & DirectTransferClassifierSourceLike;

export type TokenMovementOnTheFlyFrontendDashboardSectionId =
  | "nackl-mining-rewards"
  | "direct-transfers-in"
  | "direct-transfers-out"
  | "unresolved-or-routed";

export type TokenMovementOnTheFlyFrontendDashboardToken = "NACKL" | "SHELL" | "USDC" | "TIP3" | "UNKNOWN" | "OTHER";

export type TokenMovementOnTheFlyFrontendDashboardDirection = "in" | "out" | "unknown";

export type TokenMovementOnTheFlyFrontendDashboardConfidence = "confirmed" | "probable" | "possible" | "unresolved";

export interface TokenMovementOnTheFlyFrontendDashboardOptions {
  readonly title?: string;
  readonly generatedAt?: string;
  readonly watchedAddress?: string;
}

export interface TokenMovementOnTheFlyFrontendDashboardRow {
  readonly id: string;
  readonly token: TokenMovementOnTheFlyFrontendDashboardToken;
  readonly amount: string;
  readonly direction: TokenMovementOnTheFlyFrontendDashboardDirection;
  readonly from: string;
  readonly to: string;
  readonly observedAt: string;
  readonly confidence: TokenMovementOnTheFlyFrontendDashboardConfidence;
  readonly reason: string;
  readonly warnings: readonly string[];
}

export interface TokenMovementOnTheFlyFrontendDashboardSection {
  readonly id: TokenMovementOnTheFlyFrontendDashboardSectionId;
  readonly title: string;
  readonly description: string;
  readonly rows: readonly TokenMovementOnTheFlyFrontendDashboardRow[];
  readonly totalRows: number;
  readonly unresolvedRows: number;
  readonly tokenBreakdown: {
    readonly nackl: number;
    readonly shell: number;
    readonly usdc: number;
    readonly other: number;
  };
}

export interface TokenMovementOnTheFlyFrontendDashboard {
  readonly title: string;
  readonly generatedAt: string;
  readonly watchedAddress: string;
  readonly mode: "on-the-fly-no-storage";
  readonly sections: readonly TokenMovementOnTheFlyFrontendDashboardSection[];
  readonly summary: {
    readonly totalInputRows: number;
    readonly visibleRows: number;
    readonly nacklMiningRewardRows: number;
    readonly directTransferInRows: number;
    readonly directTransferOutRows: number;
    readonly unresolvedOrRoutedRows: number;
    readonly nacklDirectInRows: number;
    readonly shellDirectInRows: number;
    readonly usdcDirectInRows: number;
    readonly nacklDirectOutRows: number;
    readonly shellDirectOutRows: number;
    readonly usdcDirectOutRows: number;
  };
  readonly privacyNotes: readonly string[];
  readonly safetyNotes: readonly string[];
}

export function createOnTheFlyTokenMovementFrontendDashboard(
  records: readonly TokenMovementOnTheFlyFrontendDashboardSourceLike[],
  options: TokenMovementOnTheFlyFrontendDashboardOptions = {},
): TokenMovementOnTheFlyFrontendDashboard {
  const generatedAt = options.generatedAt ?? new Date(0).toISOString();
  const miningDashboard = classifyTokenMovementsForMiningRewardDashboard(records, { generatedAt });
  const directDashboard = classifyDirectTransfersForDashboard(records, { generatedAt });

  const miningRows = miningDashboard.sections
    .filter((section) => section.id === "nackl-mining-rewards")
    .flatMap((section) => section.rows)
    .map(normalizeMiningRow);

  const miningRewardIds = miningRows.map((row) => row.id);

  const directInRows = directDashboard.sections
    .filter((section) => section.id === "direct-nackl-in" || section.id === "direct-shell-in" || section.id === "direct-usdc-in")
    .flatMap((section) => section.rows)
    .map(normalizeDirectRow);

  const directOutRows = directDashboard.sections
    .filter((section) => section.id === "direct-nackl-out" || section.id === "direct-shell-out" || section.id === "direct-usdc-out")
    .flatMap((section) => section.rows)
    .map(normalizeDirectRow);

  const unresolvedRows = directDashboard.sections
    .filter((section) => section.id === "excluded-unresolved-or-routed")
    .flatMap((section) => section.rows)
    .filter((row) => !miningRewardIds.includes(row.id))
    .map(normalizeDirectRow);

  const sections: readonly TokenMovementOnTheFlyFrontendDashboardSection[] = [
    createDashboardSection(
      "nackl-mining-rewards",
      "NACKL mining rewards",
      "Inbound NACKL rows that look like mining or reward activity. Kept separate from normal inbound transfers.",
      miningRows,
    ),
    createDashboardSection(
      "direct-transfers-in",
      "Direct transfers in",
      "Direct inbound NACKL, SHELL, and USDC rows grouped for frontend display.",
      directInRows,
    ),
    createDashboardSection(
      "direct-transfers-out",
      "Direct transfers out",
      "Direct outbound NACKL, SHELL, and USDC rows grouped for frontend display.",
      directOutRows,
    ),
    createDashboardSection(
      "unresolved-or-routed",
      "Unresolved or contract-routed flows",
      "Accumulator, bridge, PrivateNote, DEX, unknown-token, unknown-direction, decoder-needed, and other unsafe-to-classify rows.",
      unresolvedRows,
    ),
  ];

  return {
    title: options.title ?? "Watchtower token movement dashboard",
    generatedAt,
    watchedAddress: options.watchedAddress ?? "not provided",
    mode: "on-the-fly-no-storage",
    sections,
    summary: {
      totalInputRows: records.length,
      visibleRows: sections.reduce((total, section) => total + section.totalRows, 0),
      nacklMiningRewardRows: miningRows.length,
      directTransferInRows: directInRows.length,
      directTransferOutRows: directOutRows.length,
      unresolvedOrRoutedRows: unresolvedRows.length,
      nacklDirectInRows: countTokenRows(directInRows, "NACKL"),
      shellDirectInRows: countTokenRows(directInRows, "SHELL"),
      usdcDirectInRows: countTokenRows(directInRows, "USDC"),
      nacklDirectOutRows: countTokenRows(directOutRows, "NACKL"),
      shellDirectOutRows: countTokenRows(directOutRows, "SHELL"),
      usdcDirectOutRows: countTokenRows(directOutRows, "USDC"),
    },
    privacyNotes: [
      "Dashboard sections are created from the current in-memory input only.",
      "The dashboard composer must not persist wallet movement history, searched addresses, or exported reports.",
      "Frontend integrations should avoid browser storage and wallet-linked analytics for token movement views.",
    ],
    safetyNotes: [
      "NACKL mining rewards are not displayed as ordinary inbound transfers.",
      "SHELL, USDC, and NACKL direct transfers are split into separate in/out visuals.",
      "Unresolved or contract-routed rows remain separate until stronger evidence exists.",
      "This dashboard is read-only and must not sign, broadcast, trade, custody, or operate PrivateNote flows.",
    ],
  };
}

export function renderOnTheFlyTokenMovementFrontendDashboardText(
  dashboard: TokenMovementOnTheFlyFrontendDashboard,
): string {
  const lines: string[] = [
    dashboard.title,
    `Mode: ${dashboard.mode}`,
    `Generated: ${dashboard.generatedAt}`,
    `Watched address: ${dashboard.watchedAddress}`,
    `Input rows: ${dashboard.summary.totalInputRows}`,
    `Visible rows: ${dashboard.summary.visibleRows}`,
    `NACKL mining rewards: ${dashboard.summary.nacklMiningRewardRows}`,
    `Transfers in: ${dashboard.summary.directTransferInRows}`,
    `Transfers out: ${dashboard.summary.directTransferOutRows}`,
    `Unresolved/routed: ${dashboard.summary.unresolvedOrRoutedRows}`,
    "",
    "Direct transfer split:",
    `- NACKL in/out: ${dashboard.summary.nacklDirectInRows}/${dashboard.summary.nacklDirectOutRows}`,
    `- SHELL in/out: ${dashboard.summary.shellDirectInRows}/${dashboard.summary.shellDirectOutRows}`,
    `- USDC in/out: ${dashboard.summary.usdcDirectInRows}/${dashboard.summary.usdcDirectOutRows}`,
    "",
  ];

  for (const section of dashboard.sections) {
    lines.push(`${section.title} (${section.totalRows})`);
    lines.push(section.description);

    if (section.rows.length === 0) {
      lines.push("- No rows in this section.");
    } else {
      for (const row of section.rows) {
        lines.push(`- ${row.token} ${row.amount} · ${row.direction} · ${row.confidence} · ${row.reason}`);
      }
    }

    lines.push("");
  }

  lines.push("Privacy notes:");
  for (const note of dashboard.privacyNotes) lines.push(`- ${note}`);
  lines.push("", "Safety notes:");
  for (const note of dashboard.safetyNotes) lines.push(`- ${note}`);

  return lines.join("\n");
}

function normalizeMiningRow(row: ClassifiedTokenMovementRow): TokenMovementOnTheFlyFrontendDashboardRow {
  return {
    id: row.id,
    token: normalizeToken(row.token),
    amount: row.amount,
    direction: row.direction,
    from: row.from,
    to: row.to,
    observedAt: row.observedAt,
    confidence: row.confidence,
    reason: row.reason,
    warnings: row.warnings,
  };
}

function normalizeDirectRow(row: ClassifiedDirectTransferRow): TokenMovementOnTheFlyFrontendDashboardRow {
  return {
    id: row.id,
    token: normalizeToken(row.asset),
    amount: row.amount,
    direction: row.direction,
    from: row.from,
    to: row.to,
    observedAt: row.observedAt,
    confidence: row.confidence,
    reason: row.reason,
    warnings: row.warnings,
  };
}

function createDashboardSection(
  id: TokenMovementOnTheFlyFrontendDashboardSectionId,
  title: string,
  description: string,
  rows: readonly TokenMovementOnTheFlyFrontendDashboardRow[],
): TokenMovementOnTheFlyFrontendDashboardSection {
  return {
    id,
    title,
    description,
    rows,
    totalRows: rows.length,
    unresolvedRows: rows.filter((row) => row.confidence === "unresolved").length,
    tokenBreakdown: {
      nackl: countTokenRows(rows, "NACKL"),
      shell: countTokenRows(rows, "SHELL"),
      usdc: countTokenRows(rows, "USDC"),
      other: rows.filter((row) => row.token !== "NACKL" && row.token !== "SHELL" && row.token !== "USDC").length,
    },
  };
}

function countTokenRows(
  rows: readonly TokenMovementOnTheFlyFrontendDashboardRow[],
  token: TokenMovementOnTheFlyFrontendDashboardToken,
): number {
  return rows.filter((row) => row.token === token).length;
}

function normalizeToken(value: string): TokenMovementOnTheFlyFrontendDashboardToken {
  if (value === "NACKL") return "NACKL";
  if (value === "SHELL") return "SHELL";
  if (value === "USDC") return "USDC";
  if (value === "TIP3") return "TIP3";
  if (value === "UNKNOWN") return "UNKNOWN";
  return "OTHER";
}
