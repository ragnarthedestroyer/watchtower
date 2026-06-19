import { buildDemoHealthResponse, type DemoRuntime } from "./demo";
import { buildDemoSnapshot } from "./demo-snapshots";
import { buildDemoWatchlists } from "./demo-watchlists";
import {
  endpointConfigIsUsableForLiveReads,
  type WatchtowerEndpointConfig,
} from "@watchtower/core";
import {
  readLiveTokenMovementRawHistory,
  type TokenMovementLiveRawHistoryRequest,
} from "./live-token-movement-history";
import type {
  ApiResponse,
  HealthResponse,
  SnapshotResponse,
  TokenMovementLiveRawHistoryResponse,
  WatchlistsResponse,
} from "./types";

export type WatchtowerHttpRouteOptions = {
  runtime?: DemoRuntime;
  endpointConfig?: WatchtowerEndpointConfig;
};

function jsonResponse<T>(payload: T, status = 200): Response {
  return new Response(JSON.stringify(payload, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function okResponse<T>(data: T): ApiResponse<T> {
  return {
    ok: true,
    data,
    errors: [],
  };
}

function errorResponse(errors: string[]): ApiResponse<never> {
  return {
    ok: false,
    errors,
  };
}

function tokenMovementLiveRawHistoryRequestFromUrl(
  url: URL,
  endpointConfig: WatchtowerEndpointConfig,
): TokenMovementLiveRawHistoryRequest | { readonly error: string } {
  const legacyAddress = url.searchParams.get("address")?.trim();
  const accountId = url.searchParams.get("account_id")?.trim();
  const requestedDappId = url.searchParams.get("dapp_id")?.trim();
  const dappId = requestedDappId || endpointConfig.dappId || undefined;
  const rawLimit = url.searchParams.get("limit")?.trim();
  const parsedLimit = rawLimit ? Number.parseInt(rawLimit, 10) : undefined;
  const includeRawPayloads = url.searchParams.get("include_raw_payloads") === "true";

  if (legacyAddress) {
    return {
      mode: "legacy",
      legacyAddress,
      network: "mainnet",
      includeRawPayloads,
      ...(parsedLimit !== undefined && !Number.isNaN(parsedLimit) ? { limit: parsedLimit } : {}),
    };
  }

  if (!accountId || !dappId) {
    return {
      error: "Token movement live raw history requires either address=0:<64hex> or account_id + dapp_id.",
    };
  }

  return {
    mode: "state_v2",
    accountId,
    dappId,
    network: "mainnet",
    includeRawPayloads,
    ...(parsedLimit !== undefined && !Number.isNaN(parsedLimit) ? { limit: parsedLimit } : {}),
  };
}

async function tokenMovementLiveRawHistoryResponse(
  url: URL,
  options: WatchtowerHttpRouteOptions,
): Promise<Response> {
  const endpointConfig = options.endpointConfig;

  if (!endpointConfig || !endpointConfigIsUsableForLiveReads(endpointConfig)) {
    return jsonResponse(
      errorResponse([
        "Token movement live raw history requires live-read mode and WATCHTOWER_GRAPHQL_ENDPOINT.",
        ...(endpointConfig?.errors ?? []),
      ]),
      503,
    );
  }

  const request = tokenMovementLiveRawHistoryRequestFromUrl(url, endpointConfig);

  if ("error" in request) {
    return jsonResponse(errorResponse([request.error]), 400);
  }

  const data: TokenMovementLiveRawHistoryResponse = await readLiveTokenMovementRawHistory({
    endpointConfig,
    request,
  });

  return jsonResponse(okResponse(data));
}

export async function handleWatchtowerRequest(
  request: Request,
  options: WatchtowerHttpRouteOptions = {},
): Promise<Response> {
  const runtime = options.runtime ?? "web";
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/$/, "") || "/";

  if (request.method !== "GET") {
    return jsonResponse(errorResponse(["Only GET requests are supported by the demo API router."]), 405);
  }

  if (path === "/health") {
    const health: HealthResponse = buildDemoHealthResponse(runtime);
    return jsonResponse(okResponse(health));
  }

  if (path === "/watchlists") {
    const watchlists: WatchlistsResponse = {
      watchlists: buildDemoWatchlists(),
    };

    return jsonResponse(okResponse(watchlists));
  }

  if (path === "/snapshots/latest") {
    const snapshot: SnapshotResponse = {
      snapshot: buildDemoSnapshot(runtime),
    };

    return jsonResponse(okResponse(snapshot));
  }

  if (path === "/api/token-movements/live-raw-history") {
    return tokenMovementLiveRawHistoryResponse(url, options);
  }

  return jsonResponse(
    errorResponse([
      `Route not found: ${path}`,
      "Available routes: /health, /watchlists, /snapshots/latest, /api/token-movements/live-raw-history.",
    ]),
    404,
  );
}
