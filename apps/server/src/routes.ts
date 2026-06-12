import {
  buildLiveHealthResponse,
  buildWatchtowerRouteCatalog,
  buildLiveSnapshot,
  buildDemoWatchlists,
  handleWatchtowerRequest,
  inspectRawAccountReadResult,
  readLiveMobileVerifierRoot,
  readLiveRawAccount,
  type RawAccountReadRequest
} from "@watchtower/api";
import { endpointConfigIsUsableForLiveReads } from "@watchtower/core";
import type { ServerEnv } from "./env";

export function buildCorsHeaders(env: ServerEnv): HeadersInit {
  return {
    "access-control-allow-origin": env.allowedOrigin,
    "access-control-allow-methods": "GET, OPTIONS",
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

  const rootAddress = url.searchParams.get("mv_root_address")?.trim();
  const watchlist = buildDemoWatchlists()[0];

  if (!watchlist) {
    return jsonResponse(
      {
        ok: false,
        errors: ["No watchlist is available for live snapshot building."]
      },
      env,
      500
    );
  }

  const input: Parameters<typeof buildLiveSnapshot>[0] = {
    endpointConfig: env.endpointConfig,
    watchlist,
    runtime: env.runtime
  };

  if (rootAddress) {
    input.mobileVerifierRootAddress = rootAddress;
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

  if (request.method === "GET" && path === "/health") {
    return healthResponse(env);
  }

  if (request.method === "GET" && path === "/accounts/raw") {
    return rawAccountResponse(url, env);
  }

  if (request.method === "GET" && path === "/accounts/inspect") {
    return rawAccountInspectionResponse(url, env);
  }

  if (request.method === "GET" && path === "/epoch/mobile-verifier") {
    return mobileVerifierEpochResponse(url, env);
  }

  if (request.method === "GET" && path === "/snapshots/live") {
    return liveSnapshotResponse(url, env);
  }

  const response = await handleWatchtowerRequest(request, {
    runtime: env.runtime
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
