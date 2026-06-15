#!/usr/bin/env node

const baseUrl = process.env.WATCHTOWER_API_BASE_URL || "http://localhost:8787";
const legacyAddress = process.env.WATCHTOWER_TEST_ADDRESS || "";
const mvRootAddress = process.env.WATCHTOWER_TEST_MV_ROOT_ADDRESS || "";

const requiredRoutes = [
  { label: "Health", path: "/health" },
  { label: "Config status", path: "/config/status" },
  { label: "Route catalog", path: "/routes" },
  { label: "Watchlists", path: "/watchlists" },
  { label: "Latest demo snapshot", path: "/snapshots/latest" },
  {
    label: "Mobile Verifier epoch",
    path: mvRootAddress
      ? `/epoch/mobile-verifier?address=${encodeURIComponent(mvRootAddress)}`
      : "/epoch/mobile-verifier"
  },
  {
    label: "Live snapshot",
    path: mvRootAddress
      ? `/snapshots/live?mv_root_address=${encodeURIComponent(mvRootAddress)}`
      : "/snapshots/live"
  }
];

const optionalRoutes = legacyAddress
  ? [
      {
        label: "Raw account",
        path: `/accounts/raw?address=${encodeURIComponent(legacyAddress)}`
      },
      {
        label: "Account inspection",
        path: `/accounts/inspect?address=${encodeURIComponent(legacyAddress)}`
      }
    ]
  : [];

async function requestJson(route) {
  const url = new URL(route.path, baseUrl);
  const startedAt = Date.now();

  try {
    const response = await fetch(url);
    const responseMs = Date.now() - startedAt;
    const text = await response.text();

    let body = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = { rawText: text };
    }

    return {
      label: route.label,
      url: String(url),
      ok: response.ok,
      status: response.status,
      responseMs,
      body
    };
  } catch (error) {
    return {
      label: route.label,
      url: String(url),
      ok: false,
      status: 0,
      responseMs: Date.now() - startedAt,
      body: {
        errors: [error instanceof Error ? error.message : String(error)]
      }
    };
  }
}

function summarizeBody(body) {
  if (!body || typeof body !== "object") return "no body";

  if ("ok" in body) {
    const errors = Array.isArray(body.errors) ? body.errors.length : 0;
    return `ok=${String(body.ok)} errors=${errors}`;
  }

  return Object.keys(body).slice(0, 6).join(", ") || "object";
}

const routes = [...requiredRoutes, ...optionalRoutes];

console.log(`Acki Watchtower live-read smoke test`);
console.log(`Base URL: ${baseUrl}`);

if (!legacyAddress) {
  console.log("WATCHTOWER_TEST_ADDRESS is not set; skipping account-specific routes.");
}

if (!mvRootAddress) {
  console.log("WATCHTOWER_TEST_MV_ROOT_ADDRESS is not set; using default MV root route.");
}

console.log("");

let failed = 0;

for (const route of routes) {
  const result = await requestJson(route);
  const marker = result.ok ? "✅" : "❌";
  console.log(
    `${marker} ${result.label} ${result.status} ${result.responseMs}ms — ${summarizeBody(result.body)}`
  );

  if (!result.ok) {
    failed += 1;
  }
}

console.log("");

if (failed > 0) {
  console.error(`${failed} route(s) failed.`);
  process.exitCode = 1;
} else {
  console.log("All tested routes responded successfully.");
}
