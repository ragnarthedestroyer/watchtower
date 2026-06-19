/**
 * Watchtower Batch 75 — Token movement dashboard demo preview foundation
 *
 * Provides deterministic, synthetic preview data so the Web and Telegram
 * frontends can become visible and testable before live chain history and
 * token decoding are connected.
 *
 * This file does not fetch chain data, persist wallet history, use browser
 * storage, use analytics, sign transactions, custody assets, operate
 * PrivateNote, trade, or decode token transfers.
 */

import {
  createOnTheFlyTokenMovementFrontendDashboard,
  type TokenMovementOnTheFlyFrontendDashboard,
} from "./token-movement-on-the-fly-frontend-dashboard";
import {
  createTokenMovementDashboardVisualCards,
  type TokenMovementDashboardVisualCards,
} from "./token-movement-dashboard-visual-cards";
import {
  createTokenMovementDashboardTimeline,
  type TokenMovementDashboardTimeline,
} from "./token-movement-dashboard-timeline";

export type TokenMovementDashboardDemoPreviewMode = "synthetic-preview-no-storage";

export interface TokenMovementDashboardDemoPreviewOptions {
  readonly title?: string;
  readonly generatedAt?: string;
  readonly watchedAddress?: string;
}

export interface TokenMovementDashboardDemoPreviewRecord {
  readonly id: string;
  readonly token: "NACKL" | "SHELL" | "USDC" | "UNKNOWN";
  readonly direction: "in" | "out" | "unknown";
  readonly amount: string;
  readonly from: string;
  readonly to: string;
  readonly observedAt: string;
  readonly confidence: "confirmed" | "probable" | "possible" | "unresolved";
  readonly label: string;
  readonly labels: readonly string[];
  readonly likelyAction: string;
  readonly explanation: string;
  readonly warnings: readonly string[];
  readonly contractLabel?: string;
  readonly decoderStatus?: string;
}

export interface TokenMovementDashboardDemoPreview {
  readonly title: string;
  readonly generatedAt: string;
  readonly watchedAddress: string;
  readonly mode: TokenMovementDashboardDemoPreviewMode;
  readonly records: readonly TokenMovementDashboardDemoPreviewRecord[];
  readonly dashboard: TokenMovementOnTheFlyFrontendDashboard;
  readonly visualCards: TokenMovementDashboardVisualCards;
  readonly timeline: TokenMovementDashboardTimeline;
  readonly checklist: readonly TokenMovementDashboardDemoPreviewChecklistItem[];
  readonly privacyNotes: readonly string[];
  readonly safetyNotes: readonly string[];
}

export interface TokenMovementDashboardDemoPreviewChecklistItem {
  readonly id: string;
  readonly label: string;
  readonly status: "ready" | "protected" | "not-connected";
  readonly note: string;
}

export function createTokenMovementDashboardDemoPreview(
  options: TokenMovementDashboardDemoPreviewOptions = {},
): TokenMovementDashboardDemoPreview {
  const title = options.title ?? "Watchtower token movement dashboard demo preview";
  const generatedAt = options.generatedAt ?? new Date(0).toISOString();
  const watchedAddress = options.watchedAddress ?? "demo-wallet-address";
  const records = createTokenMovementDashboardDemoPreviewRecords(watchedAddress);
  const dashboard = createOnTheFlyTokenMovementFrontendDashboard(records, {
    title: "Watchtower token movement dashboard",
    generatedAt,
    watchedAddress,
  });
  const visualCards = createTokenMovementDashboardVisualCards(dashboard);
  const timeline = createTokenMovementDashboardTimeline(dashboard, {
    title: "Watchtower token movement dashboard — demo timeline",
    generatedAt,
  });

  return {
    title,
    generatedAt,
    watchedAddress,
    mode: "synthetic-preview-no-storage",
    records,
    dashboard,
    visualCards,
    timeline,
    checklist: createDemoPreviewChecklist(),
    privacyNotes: [
      "Demo rows are synthetic and deterministic; they are not stored user wallet history.",
      "The preview exists only to make layout, labels, spacing, filters, cards, and timeline behavior testable.",
      "Live integrations should keep the same on-the-fly/no-storage boundary before replacing demo rows with request-scoped records.",
    ],
    safetyNotes: [
      "Synthetic preview rows must never be presented as real wallet data.",
      "NACKL mining rewards remain visually separated from ordinary inbound transfers.",
      "Accumulator, bridge, PrivateNote, DEX, unknown-token, unknown-direction, and decoder-needed examples remain in review/unresolved visuals.",
    ],
  };
}

export function createTokenMovementDashboardDemoPreviewRecords(
  watchedAddress: string = "demo-wallet-address",
): readonly TokenMovementDashboardDemoPreviewRecord[] {
  return [
    {
      id: "demo-mining-nackl-001",
      token: "NACKL",
      direction: "in",
      amount: "4,200 NACKL",
      from: "mining-reward-source",
      to: watchedAddress,
      observedAt: "2026-06-19T08:00:00.000Z",
      confidence: "probable",
      label: "Probable NACKL mining reward",
      labels: ["mining", "reward", "nackl"],
      likelyAction: "Mining reward credited",
      explanation: "Synthetic row for testing the mining reward visual section.",
      warnings: ["Synthetic preview row — not real wallet evidence."],
    },
    {
      id: "demo-transfer-nackl-in-001",
      token: "NACKL",
      direction: "in",
      amount: "125 NACKL",
      from: "external-wallet-a",
      to: watchedAddress,
      observedAt: "2026-06-19T07:45:00.000Z",
      confidence: "probable",
      label: "Direct NACKL transfer in",
      labels: ["direct", "transfer", "nackl"],
      likelyAction: "Inbound direct transfer",
      explanation: "Synthetic row for testing direct NACKL transfer-in visuals.",
      warnings: ["Synthetic preview row — not real wallet evidence."],
    },
    {
      id: "demo-transfer-shell-in-001",
      token: "SHELL",
      direction: "in",
      amount: "250 SHELL",
      from: "external-wallet-b",
      to: watchedAddress,
      observedAt: "2026-06-19T07:30:00.000Z",
      confidence: "probable",
      label: "Direct SHELL transfer in",
      labels: ["direct", "transfer", "shell"],
      likelyAction: "Inbound direct transfer",
      explanation: "Synthetic row for testing direct SHELL transfer-in visuals.",
      warnings: ["Synthetic preview row — not real wallet evidence."],
    },
    {
      id: "demo-transfer-usdc-in-001",
      token: "USDC",
      direction: "in",
      amount: "18.50 USDC",
      from: "token-wallet-usdc-a",
      to: watchedAddress,
      observedAt: "2026-06-18T19:20:00.000Z",
      confidence: "possible",
      label: "Possible direct USDC transfer in",
      labels: ["direct", "transfer", "usdc", "tip3"],
      likelyAction: "Inbound token transfer candidate",
      explanation: "Synthetic row for testing USDC inbound visuals before a real decoder is connected.",
      warnings: ["Synthetic preview row — not real wallet evidence.", "Decoder confirmation still required in real data."],
      decoderStatus: "decoder-needed",
    },
    {
      id: "demo-transfer-nackl-out-001",
      token: "NACKL",
      direction: "out",
      amount: "75 NACKL",
      from: watchedAddress,
      to: "external-wallet-c",
      observedAt: "2026-06-18T17:00:00.000Z",
      confidence: "probable",
      label: "Direct NACKL transfer out",
      labels: ["direct", "transfer", "nackl"],
      likelyAction: "Outbound direct transfer",
      explanation: "Synthetic row for testing direct NACKL transfer-out visuals.",
      warnings: ["Synthetic preview row — not real wallet evidence."],
    },
    {
      id: "demo-transfer-shell-out-001",
      token: "SHELL",
      direction: "out",
      amount: "300 SHELL",
      from: watchedAddress,
      to: "external-wallet-d",
      observedAt: "2026-06-18T16:15:00.000Z",
      confidence: "probable",
      label: "Direct SHELL transfer out",
      labels: ["direct", "transfer", "shell"],
      likelyAction: "Outbound direct transfer",
      explanation: "Synthetic row for testing direct SHELL transfer-out visuals.",
      warnings: ["Synthetic preview row — not real wallet evidence."],
    },
    {
      id: "demo-transfer-usdc-out-001",
      token: "USDC",
      direction: "out",
      amount: "9.25 USDC",
      from: watchedAddress,
      to: "token-wallet-usdc-b",
      observedAt: "2026-06-18T15:10:00.000Z",
      confidence: "possible",
      label: "Possible direct USDC transfer out",
      labels: ["direct", "transfer", "usdc", "tip3"],
      likelyAction: "Outbound token transfer candidate",
      explanation: "Synthetic row for testing USDC outbound visuals before a real decoder is connected.",
      warnings: ["Synthetic preview row — not real wallet evidence.", "Decoder confirmation still required in real data."],
      decoderStatus: "decoder-needed",
    },
    {
      id: "demo-unresolved-accumulator-shell-001",
      token: "SHELL",
      direction: "out",
      amount: "almost 30,000 SHELL",
      from: watchedAddress,
      to: "suspected-accumulator-contract",
      observedAt: "2026-06-17T12:00:00.000Z",
      confidence: "unresolved",
      label: "Unresolved accumulator / recovery-route candidate",
      labels: ["accumulator", "bridge", "usdc", "recovery", "contract-routed", "review"],
      likelyAction: "Possible SHELL sent toward accumulator or recovery route",
      explanation: "Synthetic row for testing the unresolved/contract-routed visual section.",
      warnings: [
        "Synthetic preview row — not real wallet evidence.",
        "Do not classify as a simple direct transfer.",
        "Do not claim USDC was recovered or lost without stronger evidence.",
      ],
      contractLabel: "suspected accumulator / bridge-related contract",
      decoderStatus: "review-needed",
    },
  ];
}

export function renderTokenMovementDashboardDemoPreviewText(
  preview: TokenMovementDashboardDemoPreview,
): string {
  const lines: string[] = [
    preview.title,
    `Mode: ${preview.mode}`,
    `Generated: ${preview.generatedAt}`,
    `Watched address: ${preview.watchedAddress}`,
    `Synthetic rows: ${preview.records.length}`,
    `Visible dashboard rows: ${preview.dashboard.summary.visibleRows}`,
    `Cards: ${preview.visualCards.summary.cardCount}`,
    `Timeline groups: ${preview.timeline.summary.groupCount}`,
    "",
    "Dashboard sections:",
  ];

  for (const section of preview.dashboard.sections) {
    lines.push(`- ${section.title}: ${section.totalRows} rows, ${section.unresolvedRows} unresolved`);
  }

  lines.push("", "Checklist:");
  for (const item of preview.checklist) {
    lines.push(`- ${item.label}: ${item.status} — ${item.note}`);
  }

  lines.push("", "Privacy notes:");
  for (const note of preview.privacyNotes) lines.push(`- ${note}`);

  lines.push("", "Safety notes:");
  for (const note of preview.safetyNotes) lines.push(`- ${note}`);

  return lines.join("\n");
}

function createDemoPreviewChecklist(): readonly TokenMovementDashboardDemoPreviewChecklistItem[] {
  return [
    {
      id: "synthetic-data-only",
      label: "Synthetic preview data only",
      status: "protected",
      note: "Rows are deterministic demo records and must not be confused with live wallet history.",
    },
    {
      id: "frontend-visible",
      label: "Frontend visibility support",
      status: "ready",
      note: "Cards, section counts, and timeline behavior can be reviewed before live API wiring.",
    },
    {
      id: "live-fetch",
      label: "Live transaction fetch",
      status: "not-connected",
      note: "Real account history and message body decoding are intentionally outside this preview batch.",
    },
    {
      id: "no-storage-boundary",
      label: "No-storage boundary",
      status: "protected",
      note: "The preview must not add browser storage, wallet-linked analytics, or persisted searched addresses.",
    },
  ];
}
