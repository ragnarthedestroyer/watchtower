export type TokenMovementDashboardSessionStatus =
  | "idle"
  | "loading"
  | "ready"
  | "empty"
  | "partial"
  | "error"
  | "rate-limited";

export type TokenMovementDashboardSessionStorageMode =
  | "memory-only"
  | "not-applicable"
  | "unsafe-persistent-storage-detected";

export interface TokenMovementDashboardSessionInput {
  readonly status: TokenMovementDashboardSessionStatus;
  readonly watchedAddress?: string;
  readonly startedAt?: string;
  readonly completedAt?: string;
  readonly sourceDescription?: string;
  readonly rowsSeen?: number;
  readonly unresolvedRows?: number;
  readonly warnings?: readonly string[];
  readonly errors?: readonly string[];
  readonly storageMode?: TokenMovementDashboardSessionStorageMode;
  readonly usedBrowserStorage?: boolean;
  readonly usedServerPersistence?: boolean;
  readonly usedWalletLinkedAnalytics?: boolean;
}

export interface TokenMovementDashboardSessionState {
  readonly status: TokenMovementDashboardSessionStatus;
  readonly title: string;
  readonly message: string;
  readonly watchedAddressPreview: string;
  readonly sourceDescription: string;
  readonly rowsSeen: number;
  readonly unresolvedRows: number;
  readonly storageMode: TokenMovementDashboardSessionStorageMode;
  readonly privacySafe: boolean;
  readonly noStorageChecklist: readonly TokenMovementDashboardNoStorageCheck[];
  readonly warnings: readonly string[];
  readonly errors: readonly string[];
  readonly recommendedResponseHeaders: readonly TokenMovementDashboardResponseHeader[];
}

export interface TokenMovementDashboardNoStorageCheck {
  readonly key: TokenMovementDashboardNoStorageCheckKey;
  readonly label: string;
  readonly passed: boolean;
  readonly severity: "ok" | "warning" | "blocker";
}

export type TokenMovementDashboardNoStorageCheckKey =
  | "memory-only-rendering"
  | "no-browser-storage"
  | "no-server-persistence"
  | "no-wallet-linked-analytics";

export interface TokenMovementDashboardResponseHeader {
  readonly name: string;
  readonly value: string;
  readonly reason: string;
}

export function createTokenMovementDashboardSessionState(
  input: TokenMovementDashboardSessionInput,
): TokenMovementDashboardSessionState {
  const storageMode = input.storageMode ?? "memory-only";
  const rowsSeen = normalizeCount(input.rowsSeen);
  const unresolvedRows = normalizeCount(input.unresolvedRows);
  const warnings = [...(input.warnings ?? [])];
  const errors = [...(input.errors ?? [])];

  if (storageMode === "unsafe-persistent-storage-detected") {
    warnings.push("Persistent storage was detected. Token movement views should remain memory-only.");
  }

  const noStorageChecklist = createNoStorageChecklist(input, storageMode);
  const privacySafe = noStorageChecklist.every((check) => check.passed);

  return {
    status: input.status,
    title: createSessionTitle(input.status),
    message: createSessionMessage(input.status, rowsSeen, unresolvedRows),
    watchedAddressPreview: shortenAddress(input.watchedAddress),
    sourceDescription: input.sourceDescription ?? "on-the-fly token movement request",
    rowsSeen,
    unresolvedRows,
    storageMode,
    privacySafe,
    noStorageChecklist,
    warnings,
    errors,
    recommendedResponseHeaders: createRecommendedNoStoreHeaders(),
  };
}

export function createRecommendedNoStoreHeaders(): readonly TokenMovementDashboardResponseHeader[] {
  return [
    {
      name: "Cache-Control",
      value: "no-store, max-age=0",
      reason: "Avoid retaining wallet-linked token movement responses in intermediary or browser caches.",
    },
    {
      name: "Pragma",
      value: "no-cache",
      reason: "Compatibility fallback for clients and proxies that still inspect Pragma.",
    },
    {
      name: "X-Watchtower-Storage-Mode",
      value: "memory-only",
      reason: "Makes the intended no-persistence behavior explicit for future route wiring.",
    },
  ];
}

export function renderTokenMovementDashboardSessionStateText(
  state: TokenMovementDashboardSessionState,
): string {
  const checklist = state.noStorageChecklist
    .map((check) => `${check.passed ? "OK" : "REVIEW"}: ${check.label}`)
    .join("\n");

  const warnings = state.warnings.length === 0
    ? "Warnings: none"
    : `Warnings:\n${state.warnings.map((warning) => `- ${warning}`).join("\n")}`;

  const errors = state.errors.length === 0
    ? "Errors: none"
    : `Errors:\n${state.errors.map((error) => `- ${error}`).join("\n")}`;

  return [
    state.title,
    state.message,
    `Address: ${state.watchedAddressPreview}`,
    `Source: ${state.sourceDescription}`,
    `Rows: ${state.rowsSeen}`,
    `Unresolved: ${state.unresolvedRows}`,
    `Storage: ${state.storageMode}`,
    `Privacy guard: ${state.privacySafe ? "passed" : "needs review"}`,
    "",
    checklist,
    "",
    warnings,
    errors,
  ].join("\n");
}

function createNoStorageChecklist(
  input: TokenMovementDashboardSessionInput,
  storageMode: TokenMovementDashboardSessionStorageMode,
): readonly TokenMovementDashboardNoStorageCheck[] {
  const memoryOnly = storageMode !== "unsafe-persistent-storage-detected";
  const noBrowserStorage = input.usedBrowserStorage !== true;
  const noServerPersistence = input.usedServerPersistence !== true;
  const noWalletLinkedAnalytics = input.usedWalletLinkedAnalytics !== true;

  return [
    {
      key: "memory-only-rendering",
      label: "Render token movement data on the fly without saving wallet history.",
      passed: memoryOnly,
      severity: memoryOnly ? "ok" : "blocker",
    },
    {
      key: "no-browser-storage",
      label: "Do not write searched wallet addresses or movement rows to localStorage/sessionStorage/IndexedDB.",
      passed: noBrowserStorage,
      severity: noBrowserStorage ? "ok" : "blocker",
    },
    {
      key: "no-server-persistence",
      label: "Do not persist searched addresses, rows, reports, or wallet history on the server.",
      passed: noServerPersistence,
      severity: noServerPersistence ? "ok" : "blocker",
    },
    {
      key: "no-wallet-linked-analytics",
      label: "Do not attach analytics events to wallet addresses or movement rows.",
      passed: noWalletLinkedAnalytics,
      severity: noWalletLinkedAnalytics ? "ok" : "warning",
    },
  ];
}

function createSessionTitle(status: TokenMovementDashboardSessionStatus): string {
  switch (status) {
    case "idle":
      return "Token movement dashboard ready";
    case "loading":
      return "Loading token movement data";
    case "ready":
      return "Token movement dashboard loaded";
    case "empty":
      return "No token movement found";
    case "partial":
      return "Partial token movement data loaded";
    case "error":
      return "Token movement request failed";
    case "rate-limited":
      return "Token movement request rate-limited";
  }
}

function createSessionMessage(
  status: TokenMovementDashboardSessionStatus,
  rowsSeen: number,
  unresolvedRows: number,
): string {
  switch (status) {
    case "idle":
      return "Enter or select a wallet address to render a memory-only dashboard.";
    case "loading":
      return "Fetching current data for this session only. No wallet history should be stored.";
    case "ready":
      return `Loaded ${rowsSeen} movement row(s), including ${unresolvedRows} unresolved row(s).`;
    case "empty":
      return "No rows were found for the current on-the-fly request.";
    case "partial":
      return `Loaded partial evidence for ${rowsSeen} row(s). Treat unresolved rows as needing review.`;
    case "error":
      return "The dashboard could not load token movement rows. Do not create fallback stored history.";
    case "rate-limited":
      return "The upstream API limited the request. Retry later without persisting the wallet query.";
  }
}

function normalizeCount(value: number | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return 0;
  return Math.floor(value);
}

function shortenAddress(value: string | undefined): string {
  if (value === undefined || value.trim().length === 0) return "not provided";
  const trimmed = value.trim();
  if (trimmed.length <= 18) return trimmed;
  return `${trimmed.slice(0, 10)}...${trimmed.slice(-8)}`;
}
