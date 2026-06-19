/**
 * Watchtower Batch 72 — Token movement dashboard timeline foundation
 *
 * Builds timeline-ready, on-the-fly rows from the Batch 68 frontend dashboard.
 * The goal is to make the frontend able to show what moved, from where, to
 * where, when, and how much — without storing wallet history or searched
 * addresses.
 *
 * This file does not fetch chain data, persist wallet history, use browser
 * storage, use analytics, sign transactions, custody assets, operate
 * PrivateNote, trade, or decode token transfers.
 */

import type {
  TokenMovementOnTheFlyFrontendDashboard,
  TokenMovementOnTheFlyFrontendDashboardRow,
  TokenMovementOnTheFlyFrontendDashboardSection,
  TokenMovementOnTheFlyFrontendDashboardSectionId,
} from "./token-movement-on-the-fly-frontend-dashboard";

export type TokenMovementDashboardTimelineMode = "on-the-fly-no-storage";
export type TokenMovementDashboardTimelineReviewStatus = "ok" | "review" | "warning";

export interface TokenMovementDashboardTimelineOptions {
  readonly title?: string;
  readonly generatedAt?: string;
  readonly maxRowsPerGroup?: number;
}

export interface TokenMovementDashboardTimelineRow {
  readonly id: string;
  readonly sectionId: TokenMovementOnTheFlyFrontendDashboardSectionId;
  readonly sectionTitle: string;
  readonly token: string;
  readonly amount: string;
  readonly direction: string;
  readonly from: string;
  readonly to: string;
  readonly observedAt: string;
  readonly dateLabel: string;
  readonly timeLabel: string;
  readonly confidence: string;
  readonly routeLabel: string;
  readonly warnings: readonly string[];
  readonly reviewStatus: TokenMovementDashboardTimelineReviewStatus;
  readonly privacyNote: string;
  readonly safetyNote: string;
}

export interface TokenMovementDashboardTimelineGroup {
  readonly id: string;
  readonly dateLabel: string;
  readonly title: string;
  readonly rows: readonly TokenMovementDashboardTimelineRow[];
  readonly totalRows: number;
  readonly reviewRows: number;
  readonly warningRows: number;
  readonly truncated: boolean;
}

export interface TokenMovementDashboardTimeline {
  readonly title: string;
  readonly generatedAt: string;
  readonly watchedAddress: string;
  readonly mode: TokenMovementDashboardTimelineMode;
  readonly groups: readonly TokenMovementDashboardTimelineGroup[];
  readonly summary: {
    readonly totalRows: number;
    readonly visibleRows: number;
    readonly groupCount: number;
    readonly nacklMiningRewardRows: number;
    readonly directTransferInRows: number;
    readonly directTransferOutRows: number;
    readonly unresolvedOrRoutedRows: number;
    readonly unknownTimeRows: number;
    readonly truncatedGroups: number;
  };
  readonly columns: readonly string[];
  readonly privacyNotes: readonly string[];
  readonly safetyNotes: readonly string[];
}

export function createTokenMovementDashboardTimeline(
  dashboard: TokenMovementOnTheFlyFrontendDashboard,
  options: TokenMovementDashboardTimelineOptions = {},
): TokenMovementDashboardTimeline {
  const maxRowsPerGroup = normalizeMaxRowsPerGroup(options.maxRowsPerGroup);
  const allRows = dashboard.sections.flatMap((section) => section.rows.map((row) => createTimelineRow(section, row)));
  const sortedRows = [...allRows].sort(compareTimelineRows);
  const groupedRows = groupRowsByDate(sortedRows);
  const groups = groupedRows.map((group) => createTimelineGroup(group.dateLabel, group.rows, maxRowsPerGroup));

  return {
    title: options.title ?? `${dashboard.title} — timeline`,
    generatedAt: options.generatedAt ?? dashboard.generatedAt,
    watchedAddress: dashboard.watchedAddress,
    mode: "on-the-fly-no-storage",
    groups,
    summary: {
      totalRows: allRows.length,
      visibleRows: groups.reduce((total, group) => total + group.rows.length, 0),
      groupCount: groups.length,
      nacklMiningRewardRows: countRowsBySection(allRows, "nackl-mining-rewards"),
      directTransferInRows: countRowsBySection(allRows, "direct-transfers-in"),
      directTransferOutRows: countRowsBySection(allRows, "direct-transfers-out"),
      unresolvedOrRoutedRows: countRowsBySection(allRows, "unresolved-or-routed"),
      unknownTimeRows: allRows.filter((row) => row.dateLabel === "unknown time").length,
      truncatedGroups: groups.filter((group) => group.truncated).length,
    },
    columns: ["When", "Token", "Amount", "Direction", "From", "To", "Status"],
    privacyNotes: [
      "Timeline rows are derived from the current in-memory dashboard only.",
      "The timeline must not persist wallet movement history, searched addresses, selected rows, filters, exports, or analytics.",
      "Any export or copy action should be an explicit user action outside the default no-storage view.",
    ],
    safetyNotes: [
      "The timeline is a visual organization aid, not proof of final token ownership or recovery.",
      "NACKL mining rewards remain separated from ordinary inbound transfers.",
      "Accumulator, bridge, PrivateNote, DEX, unknown-token, unknown-direction, and decoder-needed rows remain review items unless stronger evidence exists.",
    ],
  };
}

export function renderTokenMovementDashboardTimelineText(
  timeline: TokenMovementDashboardTimeline,
): string {
  const lines: string[] = [
    timeline.title,
    `Mode: ${timeline.mode}`,
    `Watched address: ${timeline.watchedAddress}`,
    `Rows: ${timeline.summary.visibleRows}/${timeline.summary.totalRows}`,
    `Groups: ${timeline.summary.groupCount}`,
    `Unknown time rows: ${timeline.summary.unknownTimeRows}`,
    "",
  ];

  for (const group of timeline.groups) {
    lines.push(group.title);

    if (group.rows.length === 0) {
      lines.push("- No rows in this time group.");
    } else {
      for (const row of group.rows) {
        lines.push(
          `- ${row.timeLabel} · ${row.token} ${row.amount} · ${row.direction} · ${row.from} → ${row.to} · ${row.reviewStatus}`,
        );
      }
    }

    if (group.truncated) lines.push("- Group preview is truncated.");
    lines.push("");
  }

  lines.push("Privacy notes:");
  for (const note of timeline.privacyNotes) lines.push(`- ${note}`);
  lines.push("", "Safety notes:");
  for (const note of timeline.safetyNotes) lines.push(`- ${note}`);

  return lines.join("\n");
}

function createTimelineRow(
  section: TokenMovementOnTheFlyFrontendDashboardSection,
  row: TokenMovementOnTheFlyFrontendDashboardRow,
): TokenMovementDashboardTimelineRow {
  const parsedDate = parseObservedAt(row.observedAt);

  return {
    id: row.id,
    sectionId: section.id,
    sectionTitle: section.title,
    token: row.token,
    amount: row.amount,
    direction: row.direction,
    from: shortenAddressLike(row.from),
    to: shortenAddressLike(row.to),
    observedAt: row.observedAt,
    dateLabel: parsedDate.dateLabel,
    timeLabel: parsedDate.timeLabel,
    confidence: row.confidence,
    routeLabel: routeLabelForSection(section.id),
    warnings: row.warnings,
    reviewStatus: reviewStatusForRow(section.id, row),
    privacyNote: "Timeline row is on-the-fly display data only; do not store it with wallet history.",
    safetyNote: safetyNoteForSection(section.id),
  };
}

function createTimelineGroup(
  dateLabel: string,
  rows: readonly TokenMovementDashboardTimelineRow[],
  maxRowsPerGroup: number,
): TokenMovementDashboardTimelineGroup {
  const visibleRows = rows.slice(0, maxRowsPerGroup);

  return {
    id: slugify(dateLabel),
    dateLabel,
    title: dateLabel === "unknown time" ? "Unknown time" : `Movements on ${dateLabel}`,
    rows: visibleRows,
    totalRows: rows.length,
    reviewRows: visibleRows.filter((row) => row.reviewStatus === "review").length,
    warningRows: visibleRows.filter((row) => row.reviewStatus === "warning").length,
    truncated: rows.length > visibleRows.length,
  };
}

function groupRowsByDate(
  rows: readonly TokenMovementDashboardTimelineRow[],
): readonly { readonly dateLabel: string; readonly rows: readonly TokenMovementDashboardTimelineRow[] }[] {
  const groups: { dateLabel: string; rows: TokenMovementDashboardTimelineRow[] }[] = [];

  for (const row of rows) {
    const existing = groups.find((group) => group.dateLabel === row.dateLabel);
    if (existing === undefined) {
      groups.push({ dateLabel: row.dateLabel, rows: [row] });
    } else {
      existing.rows.push(row);
    }
  }

  return groups;
}

function compareTimelineRows(
  left: TokenMovementDashboardTimelineRow,
  right: TokenMovementDashboardTimelineRow,
): number {
  const leftTime = parseSortTime(left.observedAt);
  const rightTime = parseSortTime(right.observedAt);
  if (leftTime === rightTime) return left.id.localeCompare(right.id);
  return rightTime - leftTime;
}

function parseObservedAt(value: string): { readonly dateLabel: string; readonly timeLabel: string } {
  const time = parseSortTime(value);
  if (time === Number.NEGATIVE_INFINITY) return { dateLabel: "unknown time", timeLabel: "unknown" };
  const iso = new Date(time).toISOString();
  return { dateLabel: iso.slice(0, 10), timeLabel: iso.slice(11, 19) };
}

function parseSortTime(value: string): number {
  if (value.trim().length === 0 || value === "unknown") return Number.NEGATIVE_INFINITY;
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return Number.NEGATIVE_INFINITY;
  return parsed;
}

function routeLabelForSection(sectionId: TokenMovementOnTheFlyFrontendDashboardSectionId): string {
  switch (sectionId) {
    case "nackl-mining-rewards":
      return "mining reward";
    case "direct-transfers-in":
      return "direct inbound transfer";
    case "direct-transfers-out":
      return "direct outbound transfer";
    case "unresolved-or-routed":
      return "unresolved or contract-routed";
  }
}

function safetyNoteForSection(sectionId: TokenMovementOnTheFlyFrontendDashboardSectionId): string {
  switch (sectionId) {
    case "nackl-mining-rewards":
      return "Mining reward rows are separate from normal inbound transfers.";
    case "direct-transfers-in":
      return "Inbound rows here should be simple direct transfer candidates only.";
    case "direct-transfers-out":
      return "Outbound rows here should be simple direct transfer candidates only.";
    case "unresolved-or-routed":
      return "Rows here need review before they can be called direct transfers or resolved movements.";
  }
}

function reviewStatusForRow(
  sectionId: TokenMovementOnTheFlyFrontendDashboardSectionId,
  row: TokenMovementOnTheFlyFrontendDashboardRow,
): TokenMovementDashboardTimelineReviewStatus {
  if (sectionId === "unresolved-or-routed") return "warning";
  if (row.confidence === "unresolved" || row.confidence === "possible") return "review";
  if (row.warnings.length > 0) return "review";
  return "ok";
}

function countRowsBySection(
  rows: readonly TokenMovementDashboardTimelineRow[],
  sectionId: TokenMovementOnTheFlyFrontendDashboardSectionId,
): number {
  return rows.filter((row) => row.sectionId === sectionId).length;
}

function shortenAddressLike(value: string): string {
  const clean = value.trim();
  if (clean.length <= 22) return clean.length === 0 ? "unknown" : clean;
  if (clean.startsWith("0:") && clean.length > 18) return `${clean.slice(0, 8)}…${clean.slice(-8)}`;
  if (clean.length > 42) return `${clean.slice(0, 12)}…${clean.slice(-10)}`;
  return clean;
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "unknown-time";
}

function normalizeMaxRowsPerGroup(value: number | undefined): number {
  if (value === undefined) return 20;
  if (!Number.isFinite(value)) return 20;
  const rounded = Math.floor(value);
  if (rounded < 1) return 1;
  if (rounded > 100) return 100;
  return rounded;
}
