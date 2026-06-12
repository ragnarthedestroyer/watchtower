import { handleWatchtowerRequest } from "@watchtower/api";
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

  if (request.method === "GET" && path === "/config/status") {
    return configStatusResponse(env);
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
