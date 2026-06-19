export type TokenMovementDashboardUxReviewCategory =
  | "visual-design"
  | "layout"
  | "copy"
  | "navigation"
  | "information-density"
  | "accessibility"
  | "mobile"
  | "privacy-boundary"
  | "safety-labeling"
  | "empty-state"
  | "timeline"
  | "drilldown"
  | "quick-filter";

export type TokenMovementDashboardUxReviewScope =
  | "dashboard-global"
  | "nackl-mining-rewards"
  | "direct-transfers-in"
  | "direct-transfers-out"
  | "unresolved-or-contract-routed"
  | "visual-card"
  | "quick-filter"
  | "drilldown"
  | "timeline"
  | "session-state";

export type TokenMovementDashboardUxReviewPriority = "low" | "medium" | "high" | "blocker";
export type TokenMovementDashboardUxReviewStatus = "open" | "accepted" | "deferred" | "resolved";

export interface TokenMovementDashboardUxReviewInput {
  readonly id?: string;
  readonly title: string;
  readonly description?: string;
  readonly category?: TokenMovementDashboardUxReviewCategory;
  readonly scope?: TokenMovementDashboardUxReviewScope;
  readonly priority?: TokenMovementDashboardUxReviewPriority;
  readonly status?: TokenMovementDashboardUxReviewStatus;
  readonly expectedChange?: string;
  readonly proposedBy?: string;
  readonly createdAt?: string;
  readonly screenshotReference?: string;
  readonly canBeCosmetic?: boolean;
  readonly touchesPrivacyBoundary?: boolean;
  readonly touchesClassificationLogic?: boolean;
  readonly notes?: readonly string[];
}

export interface TokenMovementDashboardUxReviewOptions {
  readonly title?: string;
  readonly releaseStage?: "foundation" | "visible-prototype" | "testable-frontend" | "public-preview";
  readonly allowCosmeticIteration?: boolean;
}

export interface TokenMovementDashboardUxReviewItem {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly category: TokenMovementDashboardUxReviewCategory;
  readonly scope: TokenMovementDashboardUxReviewScope;
  readonly priority: TokenMovementDashboardUxReviewPriority;
  readonly status: TokenMovementDashboardUxReviewStatus;
  readonly expectedChange: string;
  readonly proposedBy: string;
  readonly createdAt: string;
  readonly screenshotReference: string;
  readonly canBeCosmetic: boolean;
  readonly touchesPrivacyBoundary: boolean;
  readonly touchesClassificationLogic: boolean;
  readonly requiresSafetyReview: boolean;
  readonly reviewLane: TokenMovementDashboardUxReviewLane;
  readonly notes: readonly string[];
}

export type TokenMovementDashboardUxReviewLane =
  | "cosmetic-ui"
  | "ux-behavior"
  | "privacy-or-safety-review"
  | "classification-review";

export interface TokenMovementDashboardUxReviewSummary {
  readonly total: number;
  readonly open: number;
  readonly accepted: number;
  readonly deferred: number;
  readonly resolved: number;
  readonly cosmeticUi: number;
  readonly uxBehavior: number;
  readonly privacyOrSafetyReview: number;
  readonly classificationReview: number;
  readonly blockers: number;
  readonly highPriority: number;
}

export interface TokenMovementDashboardUxReviewTracker {
  readonly title: string;
  readonly releaseStage: "foundation" | "visible-prototype" | "testable-frontend" | "public-preview";
  readonly allowCosmeticIteration: boolean;
  readonly summary: TokenMovementDashboardUxReviewSummary;
  readonly items: readonly TokenMovementDashboardUxReviewItem[];
  readonly recommendedProcess: readonly string[];
  readonly protectedBoundaries: readonly string[];
}

export function createTokenMovementDashboardUxReviewTracker(
  inputs: readonly TokenMovementDashboardUxReviewInput[],
  options: TokenMovementDashboardUxReviewOptions = {},
): TokenMovementDashboardUxReviewTracker {
  const items = inputs.map((input, index) => normalizeReviewItem(input, index));

  return {
    title: options.title ?? "Token movement dashboard UI/UX review tracker",
    releaseStage: options.releaseStage ?? "foundation",
    allowCosmeticIteration: options.allowCosmeticIteration ?? true,
    summary: summarizeReviewItems(items),
    items,
    recommendedProcess: createRecommendedProcess(),
    protectedBoundaries: createProtectedBoundaries(),
  };
}

export function renderTokenMovementDashboardUxReviewText(
  tracker: TokenMovementDashboardUxReviewTracker,
): string {
  const rows = tracker.items.length === 0
    ? ["No UI/UX review items yet. Add comments once the frontend is visible and testable."]
    : tracker.items.map((item) => [
        `${item.id} — ${item.title}`,
        `Scope: ${item.scope}`,
        `Category: ${item.category}`,
        `Priority: ${item.priority}`,
        `Status: ${item.status}`,
        `Lane: ${item.reviewLane}`,
        `Expected change: ${item.expectedChange}`,
      ].join("\n"));

  return [
    tracker.title,
    `Stage: ${tracker.releaseStage}`,
    `Cosmetic iteration allowed: ${tracker.allowCosmeticIteration ? "yes" : "no"}`,
    `Total: ${tracker.summary.total}`,
    `Open: ${tracker.summary.open}`,
    `Cosmetic UI: ${tracker.summary.cosmeticUi}`,
    `Privacy/safety review: ${tracker.summary.privacyOrSafetyReview}`,
    `Classification review: ${tracker.summary.classificationReview}`,
    "",
    rows.join("\n\n"),
    "",
    "Protected boundaries:",
    ...tracker.protectedBoundaries.map((boundary) => `- ${boundary}`),
  ].join("\n");
}

export function createExampleTokenMovementDashboardUxReviewItems(): readonly TokenMovementDashboardUxReviewInput[] {
  return [
    {
      id: "UX-001",
      title: "Adjust card spacing after first visible frontend review",
      description: "Cosmetic feedback should be captured without changing token classification behavior.",
      category: "layout",
      scope: "visual-card",
      priority: "medium",
      expectedChange: "Tune spacing, grouping, and visual density once the dashboard can be tested.",
      canBeCosmetic: true,
    },
    {
      id: "UX-002",
      title: "Check whether unresolved flows are visually clear enough",
      description: "Users must not mistake accumulator, bridge, PrivateNote, DEX, unknown, or decoder-needed rows for simple transfers.",
      category: "safety-labeling",
      scope: "unresolved-or-contract-routed",
      priority: "high",
      expectedChange: "Improve labels or warning copy if the unresolved section looks too similar to confirmed/direct sections.",
      canBeCosmetic: false,
      touchesClassificationLogic: false,
      touchesPrivacyBoundary: false,
    },
    {
      id: "UX-003",
      title: "Review no-storage notice placement",
      description: "The privacy message should be visible but not so loud that it blocks normal wallet review.",
      category: "privacy-boundary",
      scope: "session-state",
      priority: "medium",
      expectedChange: "Tune placement and wording while keeping the no-storage boundary explicit.",
      canBeCosmetic: false,
      touchesPrivacyBoundary: true,
    },
  ];
}

function normalizeReviewItem(
  input: TokenMovementDashboardUxReviewInput,
  index: number,
): TokenMovementDashboardUxReviewItem {
  const canBeCosmetic = input.canBeCosmetic ?? isCosmeticCategory(input.category);
  const touchesPrivacyBoundary = input.touchesPrivacyBoundary ?? input.category === "privacy-boundary";
  const touchesClassificationLogic = input.touchesClassificationLogic ?? false;
  const requiresSafetyReview = touchesPrivacyBoundary || touchesClassificationLogic || input.category === "safety-labeling";

  return {
    id: normalizeText(input.id, `UX-${String(index + 1).padStart(3, "0")}`),
    title: normalizeText(input.title, "Untitled UI/UX review item"),
    description: normalizeText(input.description, "No description provided."),
    category: input.category ?? "visual-design",
    scope: input.scope ?? "dashboard-global",
    priority: input.priority ?? "medium",
    status: input.status ?? "open",
    expectedChange: normalizeText(input.expectedChange, "Review once the frontend is visible and testable."),
    proposedBy: normalizeText(input.proposedBy, "project reviewer"),
    createdAt: normalizeText(input.createdAt, "not recorded"),
    screenshotReference: normalizeText(input.screenshotReference, "not attached"),
    canBeCosmetic,
    touchesPrivacyBoundary,
    touchesClassificationLogic,
    requiresSafetyReview,
    reviewLane: chooseReviewLane(canBeCosmetic, touchesPrivacyBoundary, touchesClassificationLogic, input.category),
    notes: [...(input.notes ?? [])],
  };
}

function summarizeReviewItems(
  items: readonly TokenMovementDashboardUxReviewItem[],
): TokenMovementDashboardUxReviewSummary {
  let open = 0;
  let accepted = 0;
  let deferred = 0;
  let resolved = 0;
  let cosmeticUi = 0;
  let uxBehavior = 0;
  let privacyOrSafetyReview = 0;
  let classificationReview = 0;
  let blockers = 0;
  let highPriority = 0;

  for (const item of items) {
    if (item.status === "open") open += 1;
    if (item.status === "accepted") accepted += 1;
    if (item.status === "deferred") deferred += 1;
    if (item.status === "resolved") resolved += 1;
    if (item.reviewLane === "cosmetic-ui") cosmeticUi += 1;
    if (item.reviewLane === "ux-behavior") uxBehavior += 1;
    if (item.reviewLane === "privacy-or-safety-review") privacyOrSafetyReview += 1;
    if (item.reviewLane === "classification-review") classificationReview += 1;
    if (item.priority === "blocker") blockers += 1;
    if (item.priority === "high") highPriority += 1;
  }

  return {
    total: items.length,
    open,
    accepted,
    deferred,
    resolved,
    cosmeticUi,
    uxBehavior,
    privacyOrSafetyReview,
    classificationReview,
    blockers,
    highPriority,
  };
}

function chooseReviewLane(
  canBeCosmetic: boolean,
  touchesPrivacyBoundary: boolean,
  touchesClassificationLogic: boolean,
  category: TokenMovementDashboardUxReviewCategory | undefined,
): TokenMovementDashboardUxReviewLane {
  if (touchesClassificationLogic) return "classification-review";
  if (touchesPrivacyBoundary || category === "safety-labeling") return "privacy-or-safety-review";
  if (canBeCosmetic) return "cosmetic-ui";
  return "ux-behavior";
}

function isCosmeticCategory(category: TokenMovementDashboardUxReviewCategory | undefined): boolean {
  return category === "visual-design" || category === "layout" || category === "information-density";
}

function createRecommendedProcess(): readonly string[] {
  return [
    "First make the frontend visible and testable with safe mock or live-read-only data.",
    "Collect UI comments as review items instead of mixing them into decoder or API work.",
    "Apply cosmetic changes freely when they do not touch classification, privacy, or safety labels.",
    "Route privacy-boundary, safety-labeling, and classification changes through explicit review.",
    "Keep no-storage behavior unchanged unless a future privacy decision explicitly changes the product boundary.",
  ];
}

function createProtectedBoundaries(): readonly string[] {
  return [
    "Do not mix NACKL mining rewards with direct inbound transfers.",
    "Do not display accumulator, bridge, PrivateNote, DEX, unknown, or decoder-needed rows as simple direct transfers.",
    "Do not persist wallet history, searched addresses, movement rows, or wallet-linked analytics.",
    "Do not make the UI look like a wallet, exchange, betting client, signer, or custody interface.",
    "Do not label unresolved rows as confirmed unless decoder and evidence layers support that conclusion.",
  ];
}

function normalizeText(value: string | undefined, fallback: string): string {
  if (value === undefined) return fallback;
  const trimmed = value.trim();
  return trimmed.length === 0 ? fallback : trimmed;
}
