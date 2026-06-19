import {
  buildLiveHealthResponse,
  buildWatchtowerRouteCatalog,
  buildWatchtowerMvpReadiness,
  buildLiveSnapshot,
  buildDecoderResearchReport,
  buildDemoWatchlists,
  handleWatchtowerRequest,
  inspectRawAccountReadResult,
  readLiveMobileVerifierRoot,
  readLiveRawAccount,
  readLiveTokenMovementRawHistory,
  type RawAccountReadRequest,
  type TokenMovementLiveRawHistoryRequest
} from "@watchtower/api";
import { endpointConfigIsUsableForLiveReads } from "@watchtower/core";
import {
  getSnapshotHistoryDetail,
  listSnapshotHistory,
  persistSnapshot
} from "@watchtower/db";
import type { ServerEnv } from "./env";
import { getServerSchemaStore } from "./server-store";

export function buildCorsHeaders(env: ServerEnv): HeadersInit {
  return {
    "access-control-allow-origin": env.allowedOrigin,
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": "content-type, authorization",
    "access-control-max-age": "86400"
  };
}

function jsonResponse(payload: unknown, env: ServerEnv, status = 200): Response {
  return new Response(JSON.stringify(payload, null, 2), {
    status,
    headers: {
      ...buildCorsHeaders(env),
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

function routeCatalogResponse(env: ServerEnv): Response {
  return jsonResponse(
    {
      ok: true,
      data: buildWatchtowerRouteCatalog(),
      errors: []
    },
    env
  );
}

function mvpReadinessResponse(env: ServerEnv): Response {
  return jsonResponse(
    {
      ok: true,
      data: buildWatchtowerMvpReadiness(),
      errors: []
    },
    env
  );
}

function configStatusResponse(env: ServerEnv): Response {
  const config = env.endpointConfig;

  return jsonResponse(
    {
      ok: config.errors.length === 0,
      data: {
        mode: config.mode,
        graphqlEndpointConfigured: config.graphqlEndpointConfigured,
        restEndpointConfigured: config.restEndpointConfigured,
        dappIdConfigured: config.dappIdConfigured,
        apiKeyPresent: config.apiKeyPresent,
        blockManagerEndpointConfigured: config.blockManagerEndpointConfigured,
        warnings: config.warnings,
        errors: config.errors
      },
      errors: config.errors
    },
    env,
    config.errors.length === 0 ? 200 : 500
  );
}

async function healthResponse(env: ServerEnv): Promise<Response> {
  if (endpointConfigIsUsableForLiveReads(env.endpointConfig)) {
    const liveHealth = await buildLiveHealthResponse({
      endpointConfig: env.endpointConfig
    });

    return jsonResponse(
      {
        ok: liveHealth.apiTrust.status === "OK",
        data: liveHealth,
        errors: liveHealth.apiTrust.status === "OK" ? [] : liveHealth.apiTrust.reasons
      },
      env,
      liveHealth.apiTrust.status === "OK" ? 200 : 503
    );
  }

  const response = await handleWatchtowerRequest(
    new Request("http://watchtower.local/health"),
    {
      runtime: env.runtime
    }
  );

  const body = await response.json();
  return jsonResponse(body, env, response.status);
}

function rawAccountRequestFromUrl(url: URL, env: ServerEnv): RawAccountReadRequest {
  const legacyAddress = url.searchParams.get("address")?.trim();
  const accountId = url.searchParams.get("account_id")?.trim();
  const requestedDappId = url.searchParams.get("dapp_id")?.trim();
  const dappId = requestedDappId || env.endpointConfig.dappId || undefined;

  if (legacyAddress) {
    return {
      mode: "legacy",
      legacyAddress
    };
  }

  const request: RawAccountReadRequest = {
    mode: "state_v2"
  };

  if (accountId) {
    request.accountId = accountId;
  }

  if (dappId) {
    request.dappId = dappId;
  }

  return request;
}

async function rawAccountResponse(url: URL, env: ServerEnv): Promise<Response> {
  if (!endpointConfigIsUsableForLiveReads(env.endpointConfig)) {
    return jsonResponse(
      {
        ok: false,
        errors: [
          "Raw account reads require live-read mode and a valid endpoint configuration.",
          ...env.endpointConfig.errors
        ]
      },
      env,
      503
    );
  }

  const result = await readLiveRawAccount({
    endpointConfig: env.endpointConfig,
    request: rawAccountRequestFromUrl(url, env)
  });

  return jsonResponse(
    {
      ok: result.ok,
      data: result.ok ? result : undefined,
      errors: result.errors
    },
    env,
    result.ok ? 200 : 400
  );
}

async function rawAccountInspectionResponse(
  url: URL,
  env: ServerEnv
): Promise<Response> {
  if (!endpointConfigIsUsableForLiveReads(env.endpointConfig)) {
    return jsonResponse(
      {
        ok: false,
        errors: [
          "Raw account inspection requires live-read mode and a valid endpoint configuration.",
          ...env.endpointConfig.errors
        ]
      },
      env,
      503
    );
  }

  const result = await readLiveRawAccount({
    endpointConfig: env.endpointConfig,
    request: rawAccountRequestFromUrl(url, env)
  });

  const inspection = inspectRawAccountReadResult(result);

  return jsonResponse(
    {
      ok: inspection.ok,
      data: inspection,
      errors: inspection.errors
    },
    env,
    inspection.ok ? 200 : 400
  );
}


async function decoderResearchReportResponse(
  url: URL,
  env: ServerEnv
): Promise<Response> {
  if (!endpointConfigIsUsableForLiveReads(env.endpointConfig)) {
    return jsonResponse(
      {
        ok: false,
        errors: [
          "Decoder research reports require live-read mode and a valid endpoint configuration.",
          ...env.endpointConfig.errors
        ]
      },
      env,
      503
    );
  }

  const result = await readLiveRawAccount({
    endpointConfig: env.endpointConfig,
    request: rawAccountRequestFromUrl(url, env)
  });

  const inspection = inspectRawAccountReadResult(result);
  const report = buildDecoderResearchReport(inspection);

  return jsonResponse(
    {
      ok: inspection.ok,
      data: report,
      errors: inspection.errors
    },
    env,
    inspection.ok ? 200 : 400
  );
}

async function mobileVerifierEpochResponse(
  url: URL,
  env: ServerEnv
): Promise<Response> {
  if (!endpointConfigIsUsableForLiveReads(env.endpointConfig)) {
    return jsonResponse(
      {
        ok: false,
        errors: [
          "Mobile Verifier epoch reads require live-read mode and a valid endpoint configuration.",
          ...env.endpointConfig.errors
        ]
      },
      env,
      503
    );
  }

  const rootAddress = url.searchParams.get("address")?.trim();
  const request = rootAddress ? { rootAddress } : {};

  const result = await readLiveMobileVerifierRoot({
    endpointConfig: env.endpointConfig,
    request
  });

  return jsonResponse(
    {
      ok: result.ok,
      data: result,
      errors: result.errors
    },
    env,
    result.ok ? 200 : 400
  );
}

function liveSnapshotInputFromUrl(
  url: URL,
  env: ServerEnv
): Parameters<typeof buildLiveSnapshot>[0] | { error: string } {
  const rootAddress = url.searchParams.get("mv_root_address")?.trim();
  const watchlist = buildDemoWatchlists()[0];

  if (!watchlist) {
    return {
      error: "No watchlist is available for live snapshot building."
    };
  }

  const input: Parameters<typeof buildLiveSnapshot>[0] = {
    endpointConfig: env.endpointConfig,
    watchlist,
    runtime: env.runtime
  };

  if (rootAddress) {
    input.mobileVerifierRootAddress = rootAddress;
  }

  return input;
}

async function liveSnapshotResponse(url: URL, env: ServerEnv): Promise<Response> {
  if (!endpointConfigIsUsableForLiveReads(env.endpointConfig)) {
    return jsonResponse(
      {
        ok: false,
        errors: [
          "Live snapshot reads require live-read mode and a valid endpoint configuration.",
          ...env.endpointConfig.errors
        ]
      },
      env,
      503
    );
  }

  const input = liveSnapshotInputFromUrl(url, env);

  if ("error" in input) {
    return jsonResponse(
      {
        ok: false,
        errors: [input.error]
      },
      env,
      500
    );
  }

  const result = await buildLiveSnapshot(input);

  return jsonResponse(
    {
      ok: result.ok,
      data: result,
      errors: result.errors
    },
    env,
    result.errors.length === 0 ? 200 : 400
  );
}

async function liveSnapshotResearchSaveResponse(
  url: URL,
  env: ServerEnv
): Promise<Response> {
  if (!endpointConfigIsUsableForLiveReads(env.endpointConfig)) {
    return jsonResponse(
      {
        ok: false,
        errors: [
          "Research snapshot persistence requires live-read mode and a valid endpoint configuration.",
          ...env.endpointConfig.errors
        ]
      },
      env,
      503
    );
  }

  const input = liveSnapshotInputFromUrl(url, env);

  if ("error" in input) {
    return jsonResponse(
      {
        ok: false,
        errors: [input.error]
      },
      env,
      500
    );
  }

  const result = await buildLiveSnapshot(input);
  const store = getServerSchemaStore();
  const persistence = persistSnapshot({
    store,
    watchlistId: input.watchlist.id,
    snapshot: result.snapshot,
    mode: "save-research-even-if-blocked"
  });

  return jsonResponse(
    {
      ok: result.errors.length === 0 && persistence.ok,
      data: {
        snapshot: result.snapshot,
        mobileVerifier: result.mobileVerifier,
        persistence,
        warnings: [
          ...result.warnings,
          "This endpoint stores research/history evidence in server memory only. It is not confirmed portfolio data and will reset when the server restarts."
        ]
      },
      errors: [...result.errors, ...persistence.errors]
    },
    env,
    result.errors.length === 0 && persistence.ok ? 200 : 400
  );
}

function snapshotHistoryLimitFromUrl(url: URL): number {
  const rawLimit = url.searchParams.get("limit")?.trim();

  if (!rawLimit) {
    return 20;
  }

  const parsed = Number.parseInt(rawLimit, 10);

  if (Number.isNaN(parsed) || parsed < 1) {
    return 20;
  }

  return Math.min(parsed, 100);
}

function snapshotHistoryResponse(url: URL, env: ServerEnv): Response {
  const store = getServerSchemaStore();
  const watchlistId = url.searchParams.get("watchlist_id")?.trim();
  const limit = snapshotHistoryLimitFromUrl(url);

  const result = listSnapshotHistory({
    store,
    limit,
    ...(watchlistId ? { watchlistId } : {})
  });

  return jsonResponse(
    {
      ok: result.ok,
      data: {
        snapshots: result.data ?? [],
        storage: {
          kind: "in-memory",
          warning: "Snapshot history is temporary and resets when the server restarts."
        }
      },
      errors: result.errors
    },
    env,
    result.ok ? 200 : 400
  );
}

function snapshotHistoryDetailResponse(url: URL, env: ServerEnv): Response {
  const snapshotId = url.searchParams.get("snapshot_id")?.trim();

  if (!snapshotId) {
    return jsonResponse(
      {
        ok: false,
        errors: ["snapshot_id query parameter is required."]
      },
      env,
      400
    );
  }

  const store = getServerSchemaStore();
  const result = getSnapshotHistoryDetail({
    store,
    snapshotId
  });

  return jsonResponse(
    {
      ok: result.ok,
      data: result.data,
      errors: result.errors
    },
    env,
    result.ok ? 200 : 400
  );
}

function tokenMovementLiveRawHistoryRequestFromUrl(
  url: URL,
  env: ServerEnv
): TokenMovementLiveRawHistoryRequest | { readonly error: string } {
  const legacyAddress = url.searchParams.get("address")?.trim();
  const accountId = url.searchParams.get("account_id")?.trim();
  const requestedDappId = url.searchParams.get("dapp_id")?.trim();
  const dappId = requestedDappId || env.endpointConfig.dappId || undefined;
  const rawLimit = url.searchParams.get("limit")?.trim();
  const parsedLimit = rawLimit ? Number.parseInt(rawLimit, 10) : undefined;
  const includeRawPayloads = url.searchParams.get("include_raw_payloads") === "true";

  if (legacyAddress) {
    return {
      mode: "legacy",
      legacyAddress,
      network: "mainnet",
      includeRawPayloads,
      ...(parsedLimit !== undefined && !Number.isNaN(parsedLimit) ? { limit: parsedLimit } : {})
    };
  }

  if (!accountId || !dappId) {
    return {
      error: "Token movement live raw history requires either address=0:<64hex> or account_id + dapp_id."
    };
  }

  return {
    mode: "state_v2",
    accountId,
    dappId,
    network: "mainnet",
    includeRawPayloads,
    ...(parsedLimit !== undefined && !Number.isNaN(parsedLimit) ? { limit: parsedLimit } : {})
  };
}

async function tokenMovementLiveRawHistoryResponse(
  url: URL,
  env: ServerEnv
): Promise<Response> {
  if (!endpointConfigIsUsableForLiveReads(env.endpointConfig)) {
    return jsonResponse(
      {
        ok: false,
        errors: [
          "Token movement live raw history requires live-read mode and a valid endpoint configuration.",
          ...env.endpointConfig.errors
        ]
      },
      env,
      503
    );
  }

  const request = tokenMovementLiveRawHistoryRequestFromUrl(url, env);

  if ("error" in request) {
    return jsonResponse(
      {
        ok: false,
        errors: [request.error]
      },
      env,
      400
    );
  }

  const result = await readLiveTokenMovementRawHistory({
    endpointConfig: env.endpointConfig,
    request,
  });

  return jsonResponse(
    {
      ok: true,
      data: result,
      errors: []
    },
    env,
    200
  );
}

export async function handleServerRequest(
  request: Request,
  env: ServerEnv
): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: buildCorsHeaders(env)
    });
  }

  const url = new URL(request.url);
  const path = url.pathname.replace(/\/$/, "") || "/";

  if (request.method === "GET" && path === "/routes") {
    return routeCatalogResponse(env);
  }

  if (request.method === "GET" && path === "/config/status") {
    return configStatusResponse(env);
  }

  if (request.method === "GET" && path === "/mvp/readiness") {
    return mvpReadinessResponse(env);
  }

  if (request.method === "GET" && path === "/health") {
    return healthResponse(env);
  }

  if (request.method === "GET" && path === "/accounts/raw") {
    return rawAccountResponse(url, env);
  }

  if (request.method === "GET" && path === "/accounts/inspect") {
    return rawAccountInspectionResponse(url, env);
  }

  if (request.method === "GET" && path === "/api/token-movements/live-raw-history") {
    return tokenMovementLiveRawHistoryResponse(url, env);
  }

  if (request.method === "GET" && path === "/decoder/research-report") {
    return decoderResearchReportResponse(url, env);
  }

  if (request.method === "GET" && path === "/epoch/mobile-verifier") {
    return mobileVerifierEpochResponse(url, env);
  }

  if (request.method === "GET" && path === "/snapshots/live") {
    return liveSnapshotResponse(url, env);
  }

  if (request.method === "POST" && path === "/snapshots/live/research-save") {
    return liveSnapshotResearchSaveResponse(url, env);
  }

  if (request.method === "GET" && path === "/snapshots/history") {
    return snapshotHistoryResponse(url, env);
  }

  if (request.method === "GET" && path === "/snapshots/history/detail") {
    return snapshotHistoryDetailResponse(url, env);
  }

  const response = await handleWatchtowerRequest(request, {
    runtime: env.runtime,
    endpointConfig: env.endpointConfig
  });

  const headers = new Headers(response.headers);

  for (const [key, value] of Object.entries(buildCorsHeaders(env))) {
    headers.set(key, value);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
