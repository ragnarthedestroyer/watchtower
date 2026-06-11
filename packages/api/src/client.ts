import { handleWatchtowerRequest, type WatchtowerHttpRouteOptions } from "./http";
import type { ApiResponse, HealthResponse, SnapshotResponse, WatchlistsResponse } from "./types";

export type WatchtowerApiClientOptions = WatchtowerHttpRouteOptions & {
  baseUrl?: string;
  transport?: (request: Request) => Promise<Response>;
};

export type WatchtowerApiClient = {
  getHealth(): Promise<HealthResponse>;
  getWatchlists(): Promise<WatchlistsResponse>;
  getLatestSnapshot(): Promise<SnapshotResponse>;
};

function buildDemoRequest(path: string, baseUrl: string): Request {
  return new Request(new URL(path, baseUrl), {
    method: "GET",
    headers: {
      accept: "application/json"
    }
  });
}

async function readApiJson<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !payload.ok || !payload.data) {
    const errors = payload.errors.length > 0 ? payload.errors : [`Request failed with HTTP ${response.status}.`];
    throw new Error(errors.join(" "));
  }

  return payload.data;
}

export function createWatchtowerApiClient(
  options: WatchtowerApiClientOptions = {}
): WatchtowerApiClient {
  const baseUrl = options.baseUrl ?? "https://watchtower.local";
  const transport = options.transport ?? ((request: Request) => handleWatchtowerRequest(request, options));

  return {
    async getHealth(): Promise<HealthResponse> {
      const response = await transport(buildDemoRequest("/health", baseUrl));
      return readApiJson<HealthResponse>(response);
    },

    async getWatchlists(): Promise<WatchlistsResponse> {
      const response = await transport(buildDemoRequest("/watchlists", baseUrl));
      return readApiJson<WatchlistsResponse>(response);
    },

    async getLatestSnapshot(): Promise<SnapshotResponse> {
      const response = await transport(buildDemoRequest("/snapshots/latest", baseUrl));
      return readApiJson<SnapshotResponse>(response);
    }
  };
}
