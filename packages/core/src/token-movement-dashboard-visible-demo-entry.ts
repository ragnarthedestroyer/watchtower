/**
 * Watchtower Batch 77 — Token movement dashboard visible demo entry
 *
 * Composes the synthetic token movement dashboard preview, preview QA, and
 * no-storage session state into one entry model that can be mounted in the Web
 * frontend while live chain history and decoder logic are still not connected.
 *
 * This file does not fetch chain data, persist wallet history, use browser
 * storage, use analytics, sign transactions, custody assets, operate
 * PrivateNote, trade, or decode token transfers.
 */

import {
  createTokenMovementDashboardDemoPreview,
  type TokenMovementDashboardDemoPreview,
} from "./token-movement-dashboard-demo-preview";
import {
  createTokenMovementDashboardPreviewQaReport,
  type TokenMovementDashboardPreviewQaReport,
} from "./token-movement-dashboard-preview-qa";
import {
  createTokenMovementDashboardSessionState,
  type TokenMovementDashboardSessionState,
} from "./token-movement-dashboard-session-state";

export type TokenMovementDashboardVisibleDemoEntryMode = "visible-synthetic-preview-no-storage";

export interface TokenMovementDashboardVisibleDemoEntryOptions {
  readonly title?: string;
  readonly generatedAt?: string;
  readonly watchedAddress?: string;
}

export interface TokenMovementDashboardVisibleDemoEntry {
  readonly title: string;
  readonly generatedAt: string;
  readonly watchedAddress: string;
  readonly mode: TokenMovementDashboardVisibleDemoEntryMode;
  readonly preview: TokenMovementDashboardDemoPreview;
  readonly qaReport: TokenMovementDashboardPreviewQaReport;
  readonly sessionState: TokenMovementDashboardSessionState;
  readonly summary: {
    readonly totalSyntheticRecords: number;
    readonly visibleRows: number;
    readonly visualCards: number;
    readonly timelineGroups: number;
    readonly qaPassed: number;
    readonly qaWarnings: number;
    readonly qaFailed: number;
    readonly readyForVisualReview: boolean;
    readonly privacySafe: boolean;
  };
  readonly reviewFocus: readonly string[];
  readonly protectedRules: readonly string[];
  readonly nextIntegrationNotes: readonly string[];
}

export function createTokenMovementDashboardVisibleDemoEntry(
  options: TokenMovementDashboardVisibleDemoEntryOptions = {},
): TokenMovementDashboardVisibleDemoEntry {
  const generatedAt = options.generatedAt ?? new Date(0).toISOString();
  const watchedAddress = options.watchedAddress ?? "demo-wallet-address";
  const preview = createTokenMovementDashboardDemoPreview({
    title: "Watchtower token movement dashboard demo preview",
    generatedAt,
    watchedAddress,
  });
  const qaReport = createTokenMovementDashboardPreviewQaReport({
    title: "Watchtower token movement dashboard preview QA",
    generatedAt,
    watchedAddress,
  });
  const sessionState = createTokenMovementDashboardSessionState({
    status: qaReport.summary.readyForVisualReview ? "ready" : "partial",
    watchedAddress,
    sourceDescription: "deterministic synthetic token movement preview rows",
    rowsSeen: preview.dashboard.summary.visibleRows,
    unresolvedRows: preview.dashboard.summary.unresolvedOrRoutedRows,
    storageMode: "memory-only",
    usedBrowserStorage: false,
    usedServerPersistence: false,
    usedWalletLinkedAnalytics: false,
  });
  const readyForVisualReview = qaReport.summary.readyForVisualReview && sessionState.privacySafe;

  return {
    title: options.title ?? "Token movement dashboard visible preview",
    generatedAt,
    watchedAddress,
    mode: "visible-synthetic-preview-no-storage",
    preview,
    qaReport,
    sessionState,
    summary: {
      totalSyntheticRecords: preview.records.length,
      visibleRows: preview.dashboard.summary.visibleRows,
      visualCards: preview.visualCards.summary.cardCount,
      timelineGroups: preview.timeline.summary.groupCount,
      qaPassed: qaReport.summary.passed,
      qaWarnings: qaReport.summary.warnings,
      qaFailed: qaReport.summary.failed,
      readyForVisualReview,
      privacySafe: sessionState.privacySafe,
    },
    reviewFocus: [
      "Check card titles, order, spacing, and information density.",
      "Check whether NACKL mining rewards are visually separate from direct inbound transfers.",
      "Check whether SHELL, USDC, and NACKL direct transfers in/out are easy to compare.",
      "Check whether unresolved accumulator/bridge/recovery rows look like review items, not confirmed transfers.",
      "Check whether the no-storage privacy notice is visible but not too noisy.",
    ],
    protectedRules: [
      "Do not mix NACKL mining rewards with ordinary inbound transfers.",
      "Do not show accumulator, bridge, PrivateNote, DEX, unknown-token, or decoder-needed rows as simple direct transfers.",
      "Do not persist searched wallet addresses, token movement rows, filters, exports, or wallet-linked analytics.",
      "Do not claim synthetic preview rows are real wallet history or proof of asset recovery.",
    ],
    nextIntegrationNotes: [
      "This entry is safe for visual review because it uses deterministic synthetic rows only.",
      "Live token movement reads can later replace the synthetic rows without changing the dashboard section contract.",
      "Cosmetic UI/UX changes should be made around this model without weakening classification or privacy rules.",
    ],
  };
}

export function renderTokenMovementDashboardVisibleDemoEntryText(
  entry: TokenMovementDashboardVisibleDemoEntry,
): string {
  const lines: string[] = [
    entry.title,
    `Mode: ${entry.mode}`,
    `Generated: ${entry.generatedAt}`,
    `Watched address: ${entry.watchedAddress}`,
    `Synthetic records: ${entry.summary.totalSyntheticRecords}`,
    `Visible rows: ${entry.summary.visibleRows}`,
    `Cards: ${entry.summary.visualCards}`,
    `Timeline groups: ${entry.summary.timelineGroups}`,
    `QA: ${entry.summary.qaPassed} passed · ${entry.summary.qaWarnings} warnings · ${entry.summary.qaFailed} failed`,
    `Ready for visual review: ${entry.summary.readyForVisualReview ? "yes" : "no"}`,
    `Privacy guard: ${entry.summary.privacySafe ? "passed" : "needs review"}`,
    "",
    "Visual sections:",
  ];

  for (const section of entry.preview.dashboard.sections) {
    lines.push(`- ${section.title}: ${section.totalRows} row(s), ${section.unresolvedRows} unresolved`);
  }

  lines.push("", "Review focus:");
  for (const focus of entry.reviewFocus) lines.push(`- ${focus}`);

  lines.push("", "Protected rules:");
  for (const rule of entry.protectedRules) lines.push(`- ${rule}`);

  lines.push("", "Next integration notes:");
  for (const note of entry.nextIntegrationNotes) lines.push(`- ${note}`);

  return lines.join("\n");
}
