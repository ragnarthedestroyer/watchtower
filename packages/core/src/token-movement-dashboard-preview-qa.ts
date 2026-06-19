/**
 * Watchtower Batch 76 — Token movement dashboard preview QA foundation
 *
 * Adds deterministic, read-only QA checks for the synthetic dashboard preview.
 * The goal is to verify that the visible demo dashboard keeps mining rewards,
 * direct transfers, and unresolved/contract-routed flows separated before live
 * reads are connected.
 *
 * This file does not fetch chain data, persist wallet history, use browser
 * storage, use analytics, sign transactions, custody assets, operate
 * PrivateNote, trade, or decode token transfers.
 */

import {
  createTokenMovementDashboardDemoPreview,
  type TokenMovementDashboardDemoPreview,
} from "./token-movement-dashboard-demo-preview";
import type {
  TokenMovementOnTheFlyFrontendDashboardRow,
  TokenMovementOnTheFlyFrontendDashboardSection,
  TokenMovementOnTheFlyFrontendDashboardSectionId,
} from "./token-movement-on-the-fly-frontend-dashboard";

export type TokenMovementDashboardPreviewQaStatus = "pass" | "warn" | "fail";
export type TokenMovementDashboardPreviewQaMode = "synthetic-preview-qa-no-storage";

export interface TokenMovementDashboardPreviewQaOptions {
  readonly title?: string;
  readonly generatedAt?: string;
  readonly watchedAddress?: string;
}

export interface TokenMovementDashboardPreviewQaCheck {
  readonly id: string;
  readonly status: TokenMovementDashboardPreviewQaStatus;
  readonly title: string;
  readonly detail: string;
  readonly lane: "data-shape" | "classification" | "privacy" | "safety" | "visual-readiness";
}

export interface TokenMovementDashboardPreviewQaReport {
  readonly title: string;
  readonly generatedAt: string;
  readonly watchedAddress: string;
  readonly mode: TokenMovementDashboardPreviewQaMode;
  readonly preview: TokenMovementDashboardDemoPreview;
  readonly checks: readonly TokenMovementDashboardPreviewQaCheck[];
  readonly summary: {
    readonly totalChecks: number;
    readonly passed: number;
    readonly warnings: number;
    readonly failed: number;
    readonly readyForVisualReview: boolean;
  };
  readonly nextReviewFocus: readonly string[];
  readonly privacyNotes: readonly string[];
  readonly safetyNotes: readonly string[];
}

export function createTokenMovementDashboardPreviewQaReport(
  options: TokenMovementDashboardPreviewQaOptions = {},
): TokenMovementDashboardPreviewQaReport {
  const preview = createTokenMovementDashboardDemoPreview({
    ...(options.generatedAt === undefined ? {} : { generatedAt: options.generatedAt }),
    ...(options.watchedAddress === undefined ? {} : { watchedAddress: options.watchedAddress }),
  });
  const checks = createQaChecks(preview);
  const failed = checks.filter((check) => check.status === "fail").length;
  const warnings = checks.filter((check) => check.status === "warn").length;
  const passed = checks.filter((check) => check.status === "pass").length;

  return {
    title: options.title ?? "Watchtower token movement dashboard preview QA",
    generatedAt: options.generatedAt ?? preview.generatedAt,
    watchedAddress: preview.watchedAddress,
    mode: "synthetic-preview-qa-no-storage",
    preview,
    checks,
    summary: {
      totalChecks: checks.length,
      passed,
      warnings,
      failed,
      readyForVisualReview: failed === 0,
    },
    nextReviewFocus: [
      "Check whether the four dashboard cards are understandable at a glance.",
      "Check whether NACKL mining rewards are visually distinct from direct inbound transfers.",
      "Check whether SHELL, USDC, and NACKL inbound/outbound movements are easy to compare.",
      "Check whether unresolved accumulator/bridge rows look like review items, not confirmed transfers.",
      "Check whether no-storage and synthetic-preview wording is visible without being too noisy.",
    ],
    privacyNotes: [
      "The QA report is generated from deterministic synthetic demo rows only.",
      "QA checks must not store wallet addresses, searched addresses, selected rows, filters, exports, or user-linked analytics.",
      "Live-data integration should keep this same no-storage QA boundary before replacing demo rows with request-scoped records.",
    ],
    safetyNotes: [
      "Passing QA means the preview classification boundaries are structurally preserved; it does not prove any real token movement.",
      "Unresolved accumulator, bridge, PrivateNote, DEX, unknown-token, and decoder-needed examples must remain separated from direct transfers.",
      "Synthetic rows must never be presented as real wallet evidence.",
    ],
  };
}

export function renderTokenMovementDashboardPreviewQaText(
  report: TokenMovementDashboardPreviewQaReport,
): string {
  const lines: string[] = [
    report.title,
    `Mode: ${report.mode}`,
    `Generated: ${report.generatedAt}`,
    `Watched address: ${report.watchedAddress}`,
    `Checks: ${report.summary.passed} passed · ${report.summary.warnings} warnings · ${report.summary.failed} failed`,
    `Ready for visual review: ${report.summary.readyForVisualReview ? "yes" : "no"}`,
    "",
    "Checks:",
  ];

  for (const check of report.checks) {
    lines.push(`- ${check.status.toUpperCase()} · ${check.title}: ${check.detail}`);
  }

  lines.push("", "Next visual review focus:");
  for (const focus of report.nextReviewFocus) lines.push(`- ${focus}`);

  lines.push("", "Privacy notes:");
  for (const note of report.privacyNotes) lines.push(`- ${note}`);

  lines.push("", "Safety notes:");
  for (const note of report.safetyNotes) lines.push(`- ${note}`);

  return lines.join("\n");
}

function createQaChecks(preview: TokenMovementDashboardDemoPreview): readonly TokenMovementDashboardPreviewQaCheck[] {
  const mining = requireSection(preview, "nackl-mining-rewards");
  const directIn = requireSection(preview, "direct-transfers-in");
  const directOut = requireSection(preview, "direct-transfers-out");
  const unresolved = requireSection(preview, "unresolved-or-routed");
  const directRows = [...directIn.rows, ...directOut.rows];

  return [
    createCheck({
      id: "synthetic-preview-mode",
      lane: "safety",
      passed: preview.mode === "synthetic-preview-no-storage",
      title: "Synthetic preview mode is explicit",
      passDetail: "Preview mode states that records are synthetic and no-storage.",
      failDetail: `Unexpected preview mode: ${preview.mode}.`,
    }),
    createCountCheck({
      id: "demo-records-present",
      lane: "data-shape",
      count: preview.records.length,
      minimum: 8,
      title: "Demo records cover expected visible cases",
      passDetail: `${preview.records.length} synthetic records are available for UI review.`,
      failDetail: "Not enough synthetic rows to review mining, transfers, and unresolved flows.",
    }),
    createCountCheck({
      id: "mining-reward-section-present",
      lane: "classification",
      count: mining.totalRows,
      minimum: 1,
      title: "NACKL mining reward section has preview rows",
      passDetail: `${mining.totalRows} mining reward preview row(s) are separated from direct inbound transfers.`,
      failDetail: "No mining reward preview rows found.",
    }),
    createCountCheck({
      id: "direct-transfer-in-section-present",
      lane: "classification",
      count: directIn.totalRows,
      minimum: 3,
      title: "Direct transfer-in section covers NACKL, SHELL, and USDC",
      passDetail: `${directIn.totalRows} inbound direct-transfer preview row(s) are available.`,
      failDetail: "Inbound direct-transfer preview rows are missing or incomplete.",
    }),
    createCountCheck({
      id: "direct-transfer-out-section-present",
      lane: "classification",
      count: directOut.totalRows,
      minimum: 3,
      title: "Direct transfer-out section covers NACKL, SHELL, and USDC",
      passDetail: `${directOut.totalRows} outbound direct-transfer preview row(s) are available.`,
      failDetail: "Outbound direct-transfer preview rows are missing or incomplete.",
    }),
    createCountCheck({
      id: "unresolved-section-present",
      lane: "classification",
      count: unresolved.totalRows,
      minimum: 1,
      title: "Unresolved/contract-routed section has review rows",
      passDetail: `${unresolved.totalRows} unresolved or routed preview row(s) stay outside simple-transfer visuals.`,
      failDetail: "No unresolved or contract-routed preview rows found.",
    }),
    createCheck({
      id: "mining-not-in-direct-in",
      lane: "classification",
      passed: !directIn.rows.some(isMiningLikeRow),
      title: "Mining rewards are not mixed into direct transfers in",
      passDetail: "Direct inbound rows do not contain mining/reward-looking rows.",
      failDetail: "A mining/reward-looking row appeared in the direct transfer-in section.",
    }),
    createCheck({
      id: "accumulator-not-direct-transfer",
      lane: "safety",
      passed: !directRows.some(isAccumulatorLikeRow),
      title: "Accumulator/recovery examples are not direct transfers",
      passDetail: "Accumulator/recovery-looking rows are excluded from direct transfer cards.",
      failDetail: "An accumulator/recovery-looking row appeared in a direct transfer card.",
    }),
    createCheck({
      id: "accumulator-visible-in-review",
      lane: "safety",
      passed: unresolved.rows.some(isAccumulatorLikeRow),
      title: "Accumulator/recovery example remains visible for review",
      passDetail: "Accumulator/recovery-looking preview row is present in unresolved/contract-routed flows.",
      failDetail: "Accumulator/recovery-looking preview row is missing from unresolved/contract-routed flows.",
    }),
    createCheck({
      id: "visual-card-count",
      lane: "visual-readiness",
      passed: preview.visualCards.cards.length === preview.dashboard.sections.length,
      title: "Visual card count matches dashboard sections",
      passDetail: `${preview.visualCards.cards.length} cards match ${preview.dashboard.sections.length} dashboard sections.`,
      failDetail: "Visual cards and dashboard sections are out of sync.",
    }),
    createCheck({
      id: "timeline-row-count",
      lane: "visual-readiness",
      passed: preview.timeline.summary.totalRows === preview.dashboard.summary.visibleRows,
      title: "Timeline row count matches visible dashboard rows",
      passDetail: `${preview.timeline.summary.totalRows} timeline rows match visible dashboard rows.`,
      failDetail: "Timeline rows and dashboard visible rows are out of sync.",
    }),
    createCheck({
      id: "privacy-notes-present",
      lane: "privacy",
      passed: preview.privacyNotes.some(containsNoStorageOrSynthetic) && preview.dashboard.privacyNotes.some(containsNoStorageOrInMemory),
      title: "No-storage privacy notes are present",
      passDetail: "Preview and dashboard privacy notes mention synthetic/in-memory or no-storage handling.",
      failDetail: "No-storage or synthetic privacy notes are missing from the preview/dashboard output.",
    }),
    createCheck({
      id: "synthetic-warning-present",
      lane: "safety",
      passed: preview.records.every((record) => record.warnings.some((warning) => warning.toLowerCase().includes("synthetic"))),
      title: "Every demo row is marked as synthetic",
      passDetail: "All demo records carry a synthetic-preview warning.",
      failDetail: "One or more demo records are missing a synthetic-preview warning.",
    }),
  ];
}

function requireSection(
  preview: TokenMovementDashboardDemoPreview,
  sectionId: TokenMovementOnTheFlyFrontendDashboardSectionId,
): TokenMovementOnTheFlyFrontendDashboardSection {
  const section = preview.dashboard.sections.find((candidate) => candidate.id === sectionId);
  if (section !== undefined) return section;

  return {
    id: sectionId,
    title: sectionId,
    description: "Missing section generated by QA fallback.",
    rows: [],
    totalRows: 0,
    unresolvedRows: 0,
    tokenBreakdown: {
      nackl: 0,
      shell: 0,
      usdc: 0,
      other: 0,
    },
  };
}

function createCheck(input: {
  readonly id: string;
  readonly lane: TokenMovementDashboardPreviewQaCheck["lane"];
  readonly passed: boolean;
  readonly title: string;
  readonly passDetail: string;
  readonly failDetail: string;
}): TokenMovementDashboardPreviewQaCheck {
  return {
    id: input.id,
    lane: input.lane,
    status: input.passed ? "pass" : "fail",
    title: input.title,
    detail: input.passed ? input.passDetail : input.failDetail,
  };
}

function createCountCheck(input: {
  readonly id: string;
  readonly lane: TokenMovementDashboardPreviewQaCheck["lane"];
  readonly count: number;
  readonly minimum: number;
  readonly title: string;
  readonly passDetail: string;
  readonly failDetail: string;
}): TokenMovementDashboardPreviewQaCheck {
  return {
    id: input.id,
    lane: input.lane,
    status: input.count >= input.minimum ? "pass" : "fail",
    title: input.title,
    detail: input.count >= input.minimum ? input.passDetail : `${input.failDetail} Found: ${input.count}; expected at least ${input.minimum}.`,
  };
}

function isMiningLikeRow(row: TokenMovementOnTheFlyFrontendDashboardRow): boolean {
  const text = `${row.reason} ${row.from} ${row.to}`.toLowerCase();
  return text.includes("mining") || text.includes("reward");
}

function isAccumulatorLikeRow(row: TokenMovementOnTheFlyFrontendDashboardRow): boolean {
  const text = `${row.reason} ${row.from} ${row.to} ${row.warnings.join(" ")}`.toLowerCase();
  return text.includes("accumulator") || text.includes("recovery") || text.includes("bridge");
}

function containsNoStorageOrSynthetic(note: string): boolean {
  const text = note.toLowerCase();
  return text.includes("no-storage") || text.includes("synthetic");
}

function containsNoStorageOrInMemory(note: string): boolean {
  const text = note.toLowerCase();
  return text.includes("no-storage") || text.includes("in-memory") || text.includes("persist");
}
