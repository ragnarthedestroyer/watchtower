import type {
  ApiTrustDecision,
  MobileVerifierEpoch,
  SnapshotPolicyDecision,
  Watchlist,
  WatchtowerSnapshot
} from "@watchtower/core";
import type { AccountInspectionResult } from "./account-inspector";
import type { RawAccountReadResult } from "./account-reader";
import type { LiveSnapshotBuildResult } from "./live-snapshot";
import type { MobileVerifierRootReadResult } from "./mobile-verifier";
import type { WatchtowerRouteCatalog } from "./route-catalog";
import type { WatchtowerMvpReadinessResponse } from "./mvp-readiness";
import type {
  WatchtowerSnapshotHistoryDetail,
  WatchtowerSnapshotHistorySummary
} from "@watchtower/db";

export type ApiResponse<T> = {
  ok: boolean;
  data?: T;
  errors: string[];
};

export type HealthResponse = {
  checkedAt: string;
  apiTrust: ApiTrustDecision;
  epoch: MobileVerifierEpoch | null;
  snapshotPolicy: SnapshotPolicyDecision | null;
};

export type WatchlistsResponse = {
  watchlists: Watchlist[];
};

export type SnapshotResponse = {
  snapshot: WatchtowerSnapshot;
};

export type ConfigStatusResponse = {
  mode: string;
  graphqlEndpointConfigured: boolean;
  restEndpointConfigured: boolean;
  dappIdConfigured: boolean;
  apiKeyPresent: boolean;
  blockManagerEndpointConfigured: boolean;
  warnings: string[];
  errors: string[];
};

export type RawAccountResponse = RawAccountReadResult;

export type AccountInspectionResponse = AccountInspectionResult;

export type MobileVerifierEpochResponse = MobileVerifierRootReadResult;

export type LiveSnapshotResponse = LiveSnapshotBuildResult;

export type RouteCatalogResponse = WatchtowerRouteCatalog;

export type MvpReadinessResponse = WatchtowerMvpReadinessResponse;

export type SnapshotHistoryResponse = {
  snapshots: WatchtowerSnapshotHistorySummary[];
  storage: {
    kind: "in-memory";
    warning: string;
  };
};

export type SnapshotHistoryDetailResponse = WatchtowerSnapshotHistoryDetail | null;

export type ResearchSaveLiveSnapshotResponse = {
  snapshot: WatchtowerSnapshot;
  mobileVerifier: LiveSnapshotBuildResult["mobileVerifier"];
  persistence: unknown;
  warnings: string[];
};

export type CreateWatchlistRequest = {
  name: string;
  description?: string;
};

export type DeleteWatchlistRequest = {
  watchlistId: string;
};
