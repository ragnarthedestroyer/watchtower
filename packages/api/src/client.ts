import { handleWatchtowerRequest, type WatchtowerHttpRouteOptions } from "./http";
import type {
  AccountInspectionResponse,
  ApiResponse,
  ConfigStatusResponse,
  HealthResponse,
  LiveSnapshotResponse,
  MobileVerifierEpochResponse,
  RawAccountResponse,
  SnapshotResponse,
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

export type WatchtowerApiClient = {
  getHealth(): Promise<HealthResponse>;
  getWatchlists(): Promise<WatchlistsResponse>;
  getLatestSnapshot(): Promise<SnapshotResponse>;
  getConfigStatus(): Promise<ConfigStatusResponse>;
  getRawAccount(params: RawAccountClientParams): Promise<RawAccountResponse>;
  inspectAccount(params: RawAccountClientParams): Promise<AccountInspectionResponse>;
  getMobileVerifierEpoch(params?: MobileVerifierClientParams): Promise<MobileVerifierEpochResponse>;
  getLiveSnapshot(params?: LiveSnapshotClientParams): Promise<LiveSnapshotResponse>;
};

function buildRequest(path: string, baseUrl: string, params?: URLSearchParams): Request {
  const url = new URL(path, baseUrl);

  if (params) {
    for (const [key, value] of params.entries()) {
      if (value.trim()) {
        url.searchParams.set(key, value.trim());
      }
    }
  }

  return new Request(url, {
    method: "GET",
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
      const searchParams = new URLSearchParams();

      if (params.mobileVerifierRootAddress) {
        searchParams.set("mv_root_address", params.mobileVerifierRootAddress);
      }

      const response = await transport(buildRequest("/snapshots/live", baseUrl, searchParams));
      return readApiJson<LiveSnapshotResponse>(response);
    }
  };
}
