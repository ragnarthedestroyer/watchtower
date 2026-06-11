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
