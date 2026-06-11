import type {
  ApiTrustStatus,
  EpochStatus,
  SnapshotDecisionMode
} from "@watchtower/core";

export type UiStatusTone = "success" | "warning" | "danger" | "neutral";

export function apiTrustTone(status: ApiTrustStatus): UiStatusTone {
  if (status === "OK") return "success";

  if (
    status === "DEGRADED" ||
    status === "STALE" ||
    status === "UNKNOWN"
  ) {
    return "warning";
  }

  return "danger";
}

export function epochTone(status: EpochStatus): UiStatusTone {
  if (status === "ACTIVE") return "success";

  if (
    status === "EXPIRED" ||
    status === "FUTURE" ||
    status === "UNKNOWN"
  ) {
    return "warning";
  }

  return "danger";
}

export function snapshotDecisionTone(mode: SnapshotDecisionMode): UiStatusTone {
  if (mode === "SAFE_TO_SAVE") return "success";
  if (mode === "READ_ONLY") return "warning";
  return "danger";
}

export function humanStatusLabel(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
