import type { TokenMovement } from "./token-movement";
import type { TokenMovementHistoryView, TokenMovementHistoryViewModel } from "./token-movement-history-view";

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

function shortAddress(value: string | undefined): string {
  if (!value) return "unknown";
  if (value.length <= 18) return value;
  return `${value.slice(0, 8)}…${value.slice(-6)}`;
}

function formatAmount(movement: TokenMovement): string {
  const token = movement.token.symbol ?? movement.token.kind;
  if (movement.amount.displayAmount) return `${movement.amount.displayAmount} ${token}`;
  if (movement.amount.rawAmount) return `${movement.amount.rawAmount} raw ${token}`;
  return `unknown amount ${token}`;
}

function movementSeverity(movement: TokenMovement): TelegramMovementSeverity {
  if (movement.proof.status === "unproven" || movement.confidence === "low") return "danger";
  if (movement.proof.status === "partial" || movement.confidence === "medium") return "warning";
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

export function buildTelegramTokenMovementLine(movement: TokenMovement): TelegramTokenMovementLine {
  const severity = movementSeverity(movement);
  const title = `${directionIcon(movement.direction)} ${formatAmount(movement)}`;
  const subtitle = `${movement.direction.toUpperCase()} · ${movement.proof.status.toUpperCase()} · ${movement.confidence.toUpperCase()}`;
  const detail = `From ${shortAddress(movement.from?.address)} to ${shortAddress(movement.to?.address)} · ${movement.explanation.summary}`;

  return {
    id: movement.id,
    title,
    subtitle,
    detail,
    severity,
  };
}

export function buildTelegramTokenMovementSummary(
  view: TokenMovementHistoryView | TokenMovementHistoryViewModel,
  options: TelegramTokenMovementViewOptions = {},
): TelegramTokenMovementSummary {
  const maxLines = options.maxLines ?? DEFAULT_MAX_LINES;
  const movements = "movements" in view ? view.movements : view.visibleMovements;
  const summary = view.summary;
  const lines = movements.slice(0, maxLines).map(buildTelegramTokenMovementLine);
  const hiddenCount = Math.max(0, movements.length - lines.length);

  const warnings: string[] = [];
  if (summary.unresolvedCount > 0) warnings.push(`${summary.unresolvedCount} unresolved movement(s) need review.`);
  if (summary.unconfirmedCount > 0) warnings.push(`${summary.unconfirmedCount} movement candidate(s) are not confirmed.`);
  if (hiddenCount > 0) warnings.push(`${hiddenCount} additional movement(s) hidden by Telegram compact view.`);

  return {
    title: "Token Movement History",
    subtitle: `${summary.totalCount} movement(s) · ${summary.confirmedCount} confirmed · ${summary.candidateCount} candidate(s)`,
    lines,
    warnings,
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
