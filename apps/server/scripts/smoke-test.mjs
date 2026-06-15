#!/usr/bin/env node

const baseUrl = (process.env.WATCHTOWER_API_BASE_URL || "http://localhost:8787").replace(/\/$/, "");

const routes = [
  {
    method: "GET",
    path: "/health",
    purpose: "Health check and API trust status"
  },
  {
    method: "GET",
    path: "/config/status",
    purpose: "Runtime/config validation status"
  },
  {
    method: "GET",
    path: "/routes",
    purpose: "Route catalog"
  },
  {
    method: "GET",
    path: "/watchlists",
    purpose: "Current watchlists"
  },
  {
    method: "GET",
    path: "/snapshots/latest",
    purpose: "Latest demo snapshot"
  },
  {
    method: "GET",
    path: "/epoch/mobile-verifier",
    purpose: "Mobile Verifier root read foundation"
  },
  {
    method: "GET",
    path: "/snapshots/live",
    purpose: "Live snapshot builder foundation"
  }
];

function formatDuration(ms) {
  return `${ms}ms`;
}

function summarizePayload(payload) {
  if (!payload || typeof payload !== "object") {
    return "non-object response";
  }

  const parts = [];

  if ("ok" in payload) {
    parts.push(`ok=${String(payload.ok)}`);
  }

  if (Array.isArray(payload.errors) && payload.errors.length > 0) {
    parts.push(`errors=${payload.errors.length}`);
  }

  if (payload.data && typeof payload.data === "object") {
    if ("apiTrust" in payload.data) {
      parts.push(`apiTrust=${payload.data.apiTrust?.status ?? "unknown"}`);
    }

    if ("runtimeMode" in payload.data) {
      parts.push(`runtimeMode=${payload.data.runtimeMode}`);
    }

    if ("routes" in payload.data && Array.isArray(payload.data.routes)) {
      parts.push(`routes=${payload.data.routes.length}`);
    }

    if ("watchlists" in payload.data && Array.isArray(payload.data.watchlists)) {
      parts.push(`watchlists=${payload.data.watchlists.length}`);
    }

    if ("snapshot" in payload.data) {
      parts.push(`snapshot=${payload.data.snapshot?.policyDecision?.mode ?? "unknown"}`);
    }

    if ("epoch" in payload.data) {
      parts.push(`epoch=${payload.data.epoch?.status ?? "unknown"}`);
    }
  }

  return parts.length > 0 ? parts.join(", ") : "response parsed";
}

async function checkRoute(route) {
  const url = `${baseUrl}${route.path}`;
  const startedAt = Date.now();

  try {
    const response = await fetch(url, {
      method: route.method,
      headers: {
        accept: "application/json"
      }
    });

    const elapsedMs = Date.now() - startedAt;
    const text = await response.text();

    let payload = null;
    try {
      payload = text ? JSON.parse(text) : null;
    } catch {
      // Keep payload as null. The summary will say non-object response.
    }

    return {
      route,
      ok: response.ok,
      httpStatus: response.status,
      elapsedMs,
      summary: summarizePayload(payload),
      payload
    };
  } catch (error) {
    const elapsedMs = Date.now() - startedAt;

    return {
      route,
      ok: false,
      httpStatus: null,
      elapsedMs,
      summary: error instanceof Error ? error.message : String(error),
      payload: null
    };
  }
}

console.log(`Acki Watchtower server smoke test`);
console.log(`Base URL: ${baseUrl}`);
console.log("");

const results = [];

for (const route of routes) {
  const result = await checkRoute(route);
  results.push(result);

  const statusIcon = result.ok ? "✅" : "❌";
  const httpStatus = result.httpStatus === null ? "network-error" : result.httpStatus;

  console.log(
    `${statusIcon} ${route.method} ${route.path} — ${httpStatus} — ${formatDuration(result.elapsedMs)} — ${result.summary}`
  );
}

console.log("");

const failed = results.filter((result) => !result.ok);

if (failed.length > 0) {
  console.log(`Smoke test completed with ${failed.length} failing route(s).`);
  console.log("This may be expected for live-only routes when the server is not configured for live-read mode.");
  process.exitCode = 1;
} else {
  console.log("Smoke test completed successfully.");
}
