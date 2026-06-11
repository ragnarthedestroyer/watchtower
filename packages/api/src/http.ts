import { buildDemoHealthResponse, type DemoRuntime } from "./demo";
import { buildDemoSnapshot } from "./demo-snapshots";
import { buildDemoWatchlists } from "./demo-watchlists";
import type { ApiResponse, HealthResponse, SnapshotResponse, WatchlistsResponse } from "./types";

export type WatchtowerHttpRouteOptions = {
  runtime?: DemoRuntime;
};

function jsonResponse<T>(payload: T, status = 200): Response {
  return new Response(JSON.stringify(payload, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

function okResponse<T>(data: T): ApiResponse<T> {
  return {
    ok: true,
    data,
    errors: []
  };
}

function errorResponse(errors: string[]): ApiResponse<never> {
  return {
    ok: false,
    errors
  };
}

export async function handleWatchtowerRequest(
  request: Request,
  options: WatchtowerHttpRouteOptions = {}
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
      watchlists: buildDemoWatchlists()
    };

    return jsonResponse(okResponse(watchlists));
  }

  if (path === "/snapshots/latest") {
    const snapshot: SnapshotResponse = {
      snapshot: buildDemoSnapshot(runtime)
    };

    return jsonResponse(okResponse(snapshot));
  }

  return jsonResponse(
    errorResponse([
      `Route not found: ${path}`,
      "Available demo routes: /health, /watchlists, /snapshots/latest."
    ]),
    404
  );
}
