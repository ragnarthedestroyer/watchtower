import { handleWatchtowerRequest, type WatchtowerHttpRouteOptions } from "./http";
import type {
  AccountInspectionResponse,
  ApiResponse,
  ConfigStatusResponse,
  DecoderResearchReportResponse,
  HealthResponse,
  LiveSnapshotResponse,
  MobileVerifierEpochResponse,
  MvpReadinessResponse,
  RawAccountResponse,
  RouteCatalogResponse,
  ResearchSaveLiveSnapshotResponse,
  SnapshotHistoryDetailResponse,
  SnapshotHistoryResponse,
  SnapshotResponse,
  TokenMovementLiveRawHistoryResponse,
  WatchlistsResponse
} from "./types";

export type WatchtowerApiTransport =
  | "demo"
  | "fetch"
  | ((request: Request) => Promise<Response>);

export type WatchtowerApiClientOptions = WatchtowerHttpRouteOptions & {
  baseUrl?: string;
  transport?: WatchtowerApiTransport;
};

export type RawAccountClientParams = {
  address?: string;
  accountId?: string;
  dappId?: string;
};

export type MobileVerifierClientParams = {
  address?: string;
};

export type LiveSnapshotClientParams = {
  mobileVerifierRootAddress?: string;
};

export type TokenMovementLiveRawHistoryClientParams = {
  address?: string;
  accountId?: string;
  dappId?: string;
  limit?: number;
  includeRawPayloads?: boolean;
};

export type SnapshotHistoryClientParams = {
  watchlistId?: string;
  limit?: number;
};

export type SnapshotHistoryDetailClientParams = {
  snapshotId: string;
};

export type WatchtowerApiClient = {
  getRoutes(): Promise<RouteCatalogResponse>;
  getMvpReadiness(): Promise<MvpReadinessResponse>;
  getHealth(): Promise<HealthResponse>;
  getWatchlists(): Promise<WatchlistsResponse>;
  getLatestSnapshot(): Promise<SnapshotResponse>;
  getConfigStatus(): Promise<ConfigStatusResponse>;
  getRawAccount(params: RawAccountClientParams): Promise<RawAccountResponse>;
  inspectAccount(params: RawAccountClientParams): Promise<AccountInspectionResponse>;
  getDecoderResearchReport(params: RawAccountClientParams): Promise<DecoderResearchReportResponse>;
  getMobileVerifierEpoch(params?: MobileVerifierClientParams): Promise<MobileVerifierEpochResponse>;
  getLiveSnapshot(params?: LiveSnapshotClientParams): Promise<LiveSnapshotResponse>;
  researchSaveLiveSnapshot(params?: LiveSnapshotClientParams): Promise<ResearchSaveLiveSnapshotResponse>;
  getTokenMovementLiveRawHistory(params: TokenMovementLiveRawHistoryClientParams): Promise<TokenMovementLiveRawHistoryResponse>;
  getSnapshotHistory(params?: SnapshotHistoryClientParams): Promise<SnapshotHistoryResponse>;
  getSnapshotHistoryDetail(params: SnapshotHistoryDetailClientParams): Promise<SnapshotHistoryDetailResponse>;
};

function buildRequest(
  path: string,
  baseUrl: string,
  params?: URLSearchParams,
  method: "GET" | "POST" = "GET"
): Request {
  const url = new URL(path, baseUrl);

  if (params) {
    for (const [key, value] of params.entries()) {
      if (value.trim()) {
        url.searchParams.set(key, value.trim());
      }
    }
  }

  return new Request(url, {
    method,
    headers: {
      accept: "application/json"
    }
  });
}

function accountSearchParams(params: RawAccountClientParams): URLSearchParams {
  const searchParams = new URLSearchParams();

  if (params.address) {
    searchParams.set("address", params.address);
  }

  if (params.accountId) {
    searchParams.set("account_id", params.accountId);
  }

  if (params.dappId) {
    searchParams.set("dapp_id", params.dappId);
  }

  return searchParams;
}


function liveSnapshotSearchParams(params: LiveSnapshotClientParams): URLSearchParams {
  const searchParams = new URLSearchParams();

  if (params.mobileVerifierRootAddress) {
    searchParams.set("mv_root_address", params.mobileVerifierRootAddress);
  }

  return searchParams;
}

function tokenMovementLiveRawHistorySearchParams(
  params: TokenMovementLiveRawHistoryClientParams
): URLSearchParams {
  const searchParams = accountSearchParams(params);

  if (params.limit !== undefined) {
    searchParams.set("limit", String(params.limit));
  }

  if (params.includeRawPayloads !== undefined) {
    searchParams.set("include_raw_payloads", params.includeRawPayloads ? "true" : "false");
  }

  return searchParams;
}

function snapshotHistorySearchParams(params: SnapshotHistoryClientParams): URLSearchParams {
  const searchParams = new URLSearchParams();

  if (params.watchlistId) {
    searchParams.set("watchlist_id", params.watchlistId);
  }

  if (params.limit !== undefined) {
    searchParams.set("limit", String(params.limit));
  }

  return searchParams;
}

function resolveTransport(
  options: WatchtowerApiClientOptions
): (request: Request) => Promise<Response> {
  if (typeof options.transport === "function") {
    return options.transport;
  }

  if (options.transport === "fetch") {
    return (request: Request) => fetch(request);
  }

  return (request: Request) => handleWatchtowerRequest(request, options);
}

async function readApiJson<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !payload.ok || payload.data === undefined) {
    const errors = payload.errors.length > 0 ? payload.errors : [`Request failed with HTTP ${response.status}.`];
    throw new Error(errors.join(" "));
  }

  return payload.data;
}

export function createWatchtowerApiClient(
  options: WatchtowerApiClientOptions = {}
): WatchtowerApiClient {
  const baseUrl = options.baseUrl ?? "https://watchtower.local";
  const transport = resolveTransport(options);

  return {
    async getRoutes(): Promise<RouteCatalogResponse> {
      const response = await transport(buildRequest("/routes", baseUrl));
      return readApiJson<RouteCatalogResponse>(response);
    },

    async getMvpReadiness(): Promise<MvpReadinessResponse> {
      const response = await transport(buildRequest("/mvp/readiness", baseUrl));
      return readApiJson<MvpReadinessResponse>(response);
    },

    async getHealth(): Promise<HealthResponse> {
      const response = await transport(buildRequest("/health", baseUrl));
      return readApiJson<HealthResponse>(response);
    },

    async getWatchlists(): Promise<WatchlistsResponse> {
      const response = await transport(buildRequest("/watchlists", baseUrl));
      return readApiJson<WatchlistsResponse>(response);
    },

    async getLatestSnapshot(): Promise<SnapshotResponse> {
      const response = await transport(buildRequest("/snapshots/latest", baseUrl));
      return readApiJson<SnapshotResponse>(response);
    },

    async getConfigStatus(): Promise<ConfigStatusResponse> {
      const response = await transport(buildRequest("/config/status", baseUrl));
      return readApiJson<ConfigStatusResponse>(response);
    },

    async getRawAccount(params: RawAccountClientParams): Promise<RawAccountResponse> {
      const response = await transport(buildRequest("/accounts/raw", baseUrl, accountSearchParams(params)));
      return readApiJson<RawAccountResponse>(response);
    },

    async inspectAccount(params: RawAccountClientParams): Promise<AccountInspectionResponse> {
      const response = await transport(buildRequest("/accounts/inspect", baseUrl, accountSearchParams(params)));
      return readApiJson<AccountInspectionResponse>(response);
    },

    async getDecoderResearchReport(
      params: RawAccountClientParams
    ): Promise<DecoderResearchReportResponse> {
      const response = await transport(
        buildRequest("/decoder/research-report", baseUrl, accountSearchParams(params))
      );
      return readApiJson<DecoderResearchReportResponse>(response);
    },

    async getMobileVerifierEpoch(
      params: MobileVerifierClientParams = {}
    ): Promise<MobileVerifierEpochResponse> {
      const searchParams = new URLSearchParams();

      if (params.address) {
        searchParams.set("address", params.address);
      }

      const response = await transport(buildRequest("/epoch/mobile-verifier", baseUrl, searchParams));
      return readApiJson<MobileVerifierEpochResponse>(response);
    },

    async getLiveSnapshot(
      params: LiveSnapshotClientParams = {}
    ): Promise<LiveSnapshotResponse> {
      const response = await transport(
        buildRequest("/snapshots/live", baseUrl, liveSnapshotSearchParams(params))
      );
      return readApiJson<LiveSnapshotResponse>(response);
    },

    async researchSaveLiveSnapshot(
      params: LiveSnapshotClientParams = {}
    ): Promise<ResearchSaveLiveSnapshotResponse> {
      const response = await transport(
        buildRequest(
          "/snapshots/live/research-save",
          baseUrl,
          liveSnapshotSearchParams(params),
          "POST"
        )
      );
      return readApiJson<ResearchSaveLiveSnapshotResponse>(response);
    },

    async getTokenMovementLiveRawHistory(
      params: TokenMovementLiveRawHistoryClientParams
    ): Promise<TokenMovementLiveRawHistoryResponse> {
      const response = await transport(
        buildRequest(
          "/api/token-movements/live-raw-history",
          baseUrl,
          tokenMovementLiveRawHistorySearchParams(params)
        )
      );
      return readApiJson<TokenMovementLiveRawHistoryResponse>(response);
    },

    async getSnapshotHistory(
      params: SnapshotHistoryClientParams = {}
    ): Promise<SnapshotHistoryResponse> {
      const response = await transport(
        buildRequest("/snapshots/history", baseUrl, snapshotHistorySearchParams(params))
      );
      return readApiJson<SnapshotHistoryResponse>(response);
    },

    async getSnapshotHistoryDetail(
      params: SnapshotHistoryDetailClientParams
    ): Promise<SnapshotHistoryDetailResponse> {
      const searchParams = new URLSearchParams();
      searchParams.set("snapshot_id", params.snapshotId);

      const response = await transport(
        buildRequest("/snapshots/history/detail", baseUrl, searchParams)
      );
      return readApiJson<SnapshotHistoryDetailResponse>(response);
    }
  };
}
