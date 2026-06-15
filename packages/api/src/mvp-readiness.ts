import {
  WATCHTOWER_MVP_READINESS,
  readinessSummary,
  type WatchtowerReadinessItem
} from "@watchtower/core";

export type WatchtowerMvpReadinessResponse = {
  generatedAt: string;
  items: WatchtowerReadinessItem[];
  summary: ReturnType<typeof readinessSummary>;
  notes: string[];
};

export function buildWatchtowerMvpReadiness(): WatchtowerMvpReadinessResponse {
  return {
    generatedAt: new Date().toISOString(),
    items: WATCHTOWER_MVP_READINESS,
    summary: readinessSummary(WATCHTOWER_MVP_READINESS),
    notes: [
      "This readiness model tracks technical MVP maturity, not financial or production readiness.",
      "Balance decoding remains blocked until live evidence can confirm exact NACKL balance semantics.",
      "Research snapshot history is temporary until a real database provider is selected."
    ]
  };
}
