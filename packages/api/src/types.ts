import type {
  ApiTrustDecision,
  MobileVerifierEpoch,
  SnapshotPolicyDecision,
  Watchlist,
  WatchtowerSnapshot
} from "../../core/src";

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

export type CreateWatchlistRequest = {
  name: string;
  description?: string;
};

export type DeleteWatchlistRequest = {
  watchlistId: string;
};
