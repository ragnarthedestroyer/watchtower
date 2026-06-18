import type { TokenMovement, TokenMovementHistory } from "./token-movement";
import type { TokenMovementHistoryViewModel } from "./token-movement-history-view";

export type TelegramMovementSeverity = "info" | "warning" | "danger";

export interface TelegramTokenMovementLine {
  id: string;
  title: string;
  subtitle: string;
  detail: string;
  severity: TelegramMovementSeverity;
}

export interface TelegramTokenMovementSummary {
  title: string;
  subtitle: string;
  lines: TelegramTokenMovementLine[];
  warnings: string[];
  footer: string;
}

export interface TelegramTokenMovementViewOptions {
  maxLines?: number;
  includeFooter?: boolean;
}

const DEFAULT_MAX_LINES = 8;

type TelegramCompatibleMovementView = TokenMovementHistory | TokenMovementHistoryViewModel;

function shortAddress(value: string | null | undefined): string {
  if (!value) return "unknown";
  if (value.length <= 18) return value;
  return `${value.slice(0, 8)}…${value.slice(-6)}`;
}

function formatAmount(movement: TokenMovement): string {
  const value = movement.amount.display ?? movement.amount.raw ?? "unknown amount";
  const token = movement.token.symbol || movement.token.family || movement.amount.unit;
  return `${value} ${token}`.trim();
}

function movementSeverity(movement: TokenMovement): TelegramMovementSeverity {
  if (movement.proofStatus === "unknown") return "danger";
  if (movement.proofStatus === "possible" || movement.proofStatus === "probable") return "warning";
  return "info";
}

function directionIcon(direction: TokenMovement["direction"]): string {
  switch (direction) {
    case "incoming":
      return "⬇️";
    case "outgoing":
      return "⬆️";
    case "internal":
      return "🔁";
    default:
      return "❓";
  }
}

function severityPrefix(severity: TelegramMovementSeverity): string {
  switch (severity) {
    case "danger":
      return "⚠️";
    case "warning":
      return "🟡";
    default:
      return "•";
  }
}

function viewMovements(view: TelegramCompatibleMovementView): TokenMovement[] {
  if ("movements" in view) return [...view.movements];
  return view.rows.map((row) => ({
    id: row.id,
    observedAt: row.observedAt,
    direction: row.direction,
    token: { family: row.tokenFamily as TokenMovement["token"]["family"], symbol: row.tokenSymbol, isKnown: row.tokenFamily !== "UNKNOWN" },
    amount: { raw: null, display: row.amountLabel, decimals: null, unit: row.tokenSymbol, confirmed: row.proofStatus === "confirmed" },
    from: { address: row.fromAddress, label: row.fromLabel, role: "unknown" },
    to: { address: row.toAddress, label: row.toLabel, role: "unknown" },
    via: null,
    likelyAction: row.likelyAction,
    summary: row.summary,
    proofStatus: row.proofStatus,
    evidence: [],
    uncertainty: [],
    warnings: [],
    tags: row.tags,
  }));
}

function viewWarnings(view: TelegramCompatibleMovementView): string[] {
  if ("movements" in view) return view.warnings;
  return view.warnings;
}

export function buildTelegramTokenMovementLine(movement: TokenMovement): TelegramTokenMovementLine {
  const severity = movementSeverity(movement);
  const title = `${directionIcon(movement.direction)} ${formatAmount(movement)}`;
  const subtitle = `${movement.direction.toUpperCase()} · ${movement.proofStatus.toUpperCase()}`;
  const detail = `From ${shortAddress(movement.from.address)} to ${shortAddress(movement.to.address)} · ${movement.likelyAction || movement.summary}`;

  return {
    id: movement.id,
    title,
    subtitle,
    detail,
    severity,
  };
}

export function buildTelegramTokenMovementSummary(
  view: TelegramCompatibleMovementView,
  options: TelegramTokenMovementViewOptions = {},
): TelegramTokenMovementSummary {
  const maxLines = options.maxLines ?? DEFAULT_MAX_LINES;
  const movements = viewMovements(view);
  const lines = movements.slice(0, maxLines).map(buildTelegramTokenMovementLine);
  const hiddenCount = Math.max(0, movements.length - lines.length);
  const confirmedCount = movements.filter((movement) => movement.proofStatus === "confirmed").length;
  const candidateCount = movements.length - confirmedCount;
  const unresolvedCount = movements.filter((movement) => movement.proofStatus === "unknown").length;

  const warnings = [...viewWarnings(view)];
  if (unresolvedCount > 0) warnings.push(`${unresolvedCount} unresolved movement(s) need review.`);
  if (candidateCount > 0) warnings.push(`${candidateCount} movement candidate(s) are not confirmed.`);
  if (hiddenCount > 0) warnings.push(`${hiddenCount} additional movement(s) hidden by Telegram compact view.`);

  return {
    title: "Token Movement History",
    subtitle: `${movements.length} movement(s) · ${confirmedCount} confirmed · ${candidateCount} candidate(s)`,
    lines,
    warnings: warnings.filter((item, index, all) => all.indexOf(item) === index),
    footer: options.includeFooter === false
      ? ""
      : "Watchtower is read-only. Unresolved movements are evidence, not proof.",
  };
}

export function renderTelegramTokenMovementSummary(summary: TelegramTokenMovementSummary): string {
  const body = summary.lines.length === 0
    ? "No movement candidates available yet."
    : summary.lines
        .map((line) => `${severityPrefix(line.severity)} ${line.title}\n${line.subtitle}\n${line.detail}`)
        .join("\n\n");

  const warnings = summary.warnings.length > 0
    ? `\n\nReview notes:\n${summary.warnings.map((warning) => `- ${warning}`).join("\n")}`
    : "";

  const footer = summary.footer ? `\n\n${summary.footer}` : "";
  return `${summary.title}\n${summary.subtitle}\n\n${body}${warnings}${footer}`;
}
