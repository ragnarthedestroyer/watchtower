/**
 * Watchtower Batch 65 — On-the-fly privacy guard foundation
 *
 * Defines the no-storage privacy boundary for token movement dashboards.
 * This file does not fetch live data, persist user data, use browser storage,
 * use analytics, sign transactions, custody assets, or decode token transfers.
 */

export type TokenMovementNoStorageMode = "on-the-fly-no-storage";

export type TokenMovementNoStorageSurface =
  | "web"
  | "telegram"
  | "server"
  | "api"
  | "export"
  | "unknown";

export type TokenMovementNoStorageRisk = "none" | "low" | "medium" | "high";

export interface TokenMovementNoStorageHeader {
  readonly name: string;
  readonly value: string;
}

export interface TokenMovementNoStoragePolicy {
  readonly mode: TokenMovementNoStorageMode;
  readonly purpose: string;
  readonly allowedProcessing: readonly string[];
  readonly forbiddenStorage: readonly string[];
  readonly allowedOutputs: readonly string[];
  readonly defaultHttpHeaders: readonly TokenMovementNoStorageHeader[];
  readonly requiredFrontendRules: readonly string[];
  readonly requiredServerRules: readonly string[];
  readonly gdprPositioning: string;
}

export interface TokenMovementNoStorageContext {
  readonly surface: TokenMovementNoStorageSurface;
  readonly featureName?: string;
  readonly usesBrowserStorage?: boolean;
  readonly usesServerPersistence?: boolean;
  readonly usesAnalytics?: boolean;
  readonly storesWalletAddress?: boolean;
  readonly storesMovementHistory?: boolean;
  readonly allowsUserDownload?: boolean;
  readonly notes?: readonly string[];
}

export interface TokenMovementNoStorageAssessment {
  readonly ok: boolean;
  readonly risk: TokenMovementNoStorageRisk;
  readonly surface: TokenMovementNoStorageSurface;
  readonly featureName: string;
  readonly blockers: readonly string[];
  readonly warnings: readonly string[];
  readonly recommendedHeaders: readonly TokenMovementNoStorageHeader[];
  readonly summary: string;
  readonly policyNotes: readonly string[];
}

export const TOKEN_MOVEMENT_NO_STORE_HEADERS: readonly TokenMovementNoStorageHeader[] = [
  { name: "Cache-Control", value: "no-store, private, max-age=0" },
  { name: "Pragma", value: "no-cache" },
  { name: "Expires", value: "0" },
];

export const TOKEN_MOVEMENT_ON_THE_FLY_NO_STORAGE_POLICY: TokenMovementNoStoragePolicy = {
  mode: "on-the-fly-no-storage",
  purpose:
    "Render token movement, mining reward, transfer-in, transfer-out, and unresolved-flow views from in-memory data only.",
  allowedProcessing: [
    "Fetch or receive live/read-only observations for the current request or render cycle.",
    "Normalize observations into temporary movement candidates in memory.",
    "Render dashboard sections, evidence bundles, summaries, and export previews on demand.",
    "Let the user explicitly download an export file without Watchtower retaining a server copy.",
  ],
  forbiddenStorage: [
    "Do not persist searched wallet addresses.",
    "Do not persist token movement history.",
    "Do not persist mining reward history.",
    "Do not persist rendered dashboard rows.",
    "Do not store movement views in localStorage, sessionStorage, IndexedDB, cookies, or server-side repositories.",
    "Do not attach analytics events to wallet addresses, transaction identifiers, or movement rows.",
  ],
  allowedOutputs: [
    "Read-only on-screen visual sections.",
    "Read-only Telegram text summaries.",
    "User-triggered JSON, CSV, or Markdown export generated on the fly.",
    "Non-identifying aggregate UI counts for the current in-memory render only.",
  ],
  defaultHttpHeaders: TOKEN_MOVEMENT_NO_STORE_HEADERS,
  requiredFrontendRules: [
    "Keep wallet address and movement rows in component memory only.",
    "Do not write token movement input or output to browser storage.",
    "Do not send wallet-specific analytics or tracking events.",
    "Clear in-memory movement rows when the user changes subject address or leaves the view.",
  ],
  requiredServerRules: [
    "Treat token movement endpoints as read-only request/response operations.",
    "Use no-store response headers for wallet-specific movement responses.",
    "Do not write wallet movement responses into the snapshot repository or in-memory research store.",
    "Do not log full wallet addresses, transaction bodies, message bodies, or generated reports unless an explicit debug mode is added later.",
  ],
  gdprPositioning:
    "No-storage design reduces retention and data-minimisation risk, but it must not be presented as a blanket GDPR exemption because blockchain addresses can still be personal data when linkable to a person.",
};

export function assessTokenMovementNoStorageContext(
  context: TokenMovementNoStorageContext,
): TokenMovementNoStorageAssessment {
  const blockers: string[] = [];
  const warnings: string[] = [];
  const featureName = context.featureName ?? "Token movement view";

  if (context.usesBrowserStorage === true) {
    blockers.push("Browser storage is enabled for wallet-specific token movement data.");
  }

  if (context.usesServerPersistence === true) {
    blockers.push("Server persistence is enabled for wallet-specific token movement data.");
  }

  if (context.storesWalletAddress === true) {
    blockers.push("Wallet addresses are being stored beyond the current render/request cycle.");
  }

  if (context.storesMovementHistory === true) {
    blockers.push("Token movement history is being stored beyond the current render/request cycle.");
  }

  if (context.usesAnalytics === true) {
    blockers.push("Analytics is enabled for wallet-specific token movement views.");
  }

  if (context.allowsUserDownload === true) {
    warnings.push("User-triggered downloads are allowed; Watchtower must not retain a server-side copy of the export.");
  }

  if (context.surface === "unknown") {
    warnings.push("Surface is unknown, so the no-storage boundary should be reviewed before release.");
  }

  for (const note of context.notes ?? []) {
    if (note.trim()) warnings.push(note);
  }

  const risk = riskFor(blockers.length, warnings.length);

  return {
    ok: blockers.length === 0,
    risk,
    surface: context.surface,
    featureName,
    blockers,
    warnings,
    recommendedHeaders: TOKEN_MOVEMENT_NO_STORE_HEADERS,
    summary: createNoStorageSummary(featureName, blockers.length, warnings.length, risk),
    policyNotes: [
      TOKEN_MOVEMENT_ON_THE_FLY_NO_STORAGE_POLICY.gdprPositioning,
      "Read-only does not automatically mean non-personal-data; avoid collecting or retaining wallet-linked records.",
      "Future live-reader batches should preserve this boundary unless the user explicitly changes the product scope.",
    ],
  };
}

export function createDefaultTokenMovementNoStorageContext(
  surface: TokenMovementNoStorageSurface,
  featureName = "Token movement dashboard",
): TokenMovementNoStorageContext {
  return {
    surface,
    featureName,
    usesBrowserStorage: false,
    usesServerPersistence: false,
    usesAnalytics: false,
    storesWalletAddress: false,
    storesMovementHistory: false,
    allowsUserDownload: false,
  };
}

export function tokenMovementNoStorageAssessmentToLines(
  assessment: TokenMovementNoStorageAssessment,
): string[] {
  const lines = [
    `${assessment.featureName}: ${assessment.ok ? "no-storage boundary OK" : "no-storage boundary blocked"}`,
    `Surface: ${assessment.surface}`,
    `Risk: ${assessment.risk}`,
    assessment.summary,
  ];

  if (assessment.blockers.length > 0) {
    lines.push("Blockers:");
    for (const blocker of assessment.blockers) lines.push(`- ${blocker}`);
  }

  if (assessment.warnings.length > 0) {
    lines.push("Warnings:");
    for (const warning of assessment.warnings) lines.push(`- ${warning}`);
  }

  lines.push("Required boundary:");
  lines.push("- Render from live/in-memory data only.");
  lines.push("- Do not persist wallet addresses or movement history.");
  lines.push("- Do not write wallet views to browser storage or analytics.");

  return lines;
}

export function getTokenMovementNoStoreHeaderRecord(): Readonly<Record<string, string>> {
  return TOKEN_MOVEMENT_NO_STORE_HEADERS.reduce<Record<string, string>>((headers, header) => {
    headers[header.name] = header.value;
    return headers;
  }, {});
}

function riskFor(blockerCount: number, warningCount: number): TokenMovementNoStorageRisk {
  if (blockerCount >= 2) return "high";
  if (blockerCount === 1) return "medium";
  if (warningCount > 0) return "low";
  return "none";
}

function createNoStorageSummary(
  featureName: string,
  blockerCount: number,
  warningCount: number,
  risk: TokenMovementNoStorageRisk,
): string {
  if (blockerCount > 0) {
    return `${featureName} does not satisfy the on-the-fly no-storage boundary yet. Risk: ${risk}.`;
  }

  if (warningCount > 0) {
    return `${featureName} satisfies the hard no-storage checks, with review warnings. Risk: ${risk}.`;
  }

  return `${featureName} satisfies the on-the-fly no-storage boundary for this foundation layer.`;
}
