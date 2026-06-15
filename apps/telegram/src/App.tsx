import { useEffect, useState } from "react";
import {
  type ConfigStatusResponse,
  type HealthResponse,
  type LiveSnapshotResponse,
  type RouteCatalogResponse,
  type SnapshotResponse,
  type WatchlistsResponse
} from "@watchtower/api";
import { DEFAULT_WATCHTOWER_CONFIG, formatAccountIdentity } from "@watchtower/core";
import { apiTrustTone, snapshotDecisionTone, humanStatusLabel } from "@watchtower/ui";
import { apiClient, apiClientBaseUrl, apiClientMode } from "./api-client";
import { initializeTelegramApp } from "./telegram";

type Tone = "success" | "warning" | "danger" | "neutral";

type AppData = {
  health: HealthResponse;
  watchlists: WatchlistsResponse["watchlists"];
  latestSnapshot: SnapshotResponse["snapshot"];
  configStatus: ConfigStatusResponse | null;
  routes: RouteCatalogResponse | null;
  liveSnapshotResult: LiveSnapshotResponse | null;
  notices: string[];
};

const telegram = initializeTelegramApp();

function StatusBadge(props: { label: string; tone: Tone }) {
  return <span className={`badge badge-${props.tone}`}>{props.label}</span>;
}

function toneForBoolean(value: boolean): Tone {
  return value ? "success" : "warning";
}

function LoadingCard() {
  return (
    <main className="telegram-shell">
      <section className="hero-card">
        <p className="eyebrow">Telegram Mini App</p>
        <h1>Acki Watchtower</h1>
        <p>Loading Watchtower status…</p>
      </section>
    </main>
  );
}

function ErrorCard(props: { message: string }) {
  return (
    <main className="telegram-shell">
      <section className="hero-card">
        <p className="eyebrow">Telegram Mini App</p>
        <h1>Unable to load Watchtower.</h1>
        <p>{props.message}</p>
      </section>
    </main>
  );
}

async function loadOptionalServerData(): Promise<{
  configStatus: ConfigStatusResponse | null;
  routes: RouteCatalogResponse | null;
  notices: string[];
}> {
  const notices: string[] = [];

  if (apiClientMode !== "server") {
    return {
      configStatus: null,
      routes: null,
      notices: ["Server-only panels are hidden because the Telegram app is using local demo transport."]
    };
  }

  const [configResult, routeResult] = await Promise.allSettled([
    apiClient.getConfigStatus(),
    apiClient.getRoutes()
  ]);

  const configStatus = configResult.status === "fulfilled" ? configResult.value : null;
  const routes = routeResult.status === "fulfilled" ? routeResult.value : null;

  if (configResult.status === "rejected") {
    notices.push(`Config status could not be loaded: ${configResult.reason instanceof Error ? configResult.reason.message : "unknown error"}.`);
  }

  if (routeResult.status === "rejected") {
    notices.push(`Route catalog could not be loaded: ${routeResult.reason instanceof Error ? routeResult.reason.message : "unknown error"}.`);
  }

  return {
    configStatus,
    routes,
    notices
  };
}

async function loadSnapshotWithFallback(): Promise<{
  snapshot: SnapshotResponse["snapshot"];
  liveSnapshotResult: LiveSnapshotResponse | null;
  notices: string[];
}> {
  const notices: string[] = [];

  if (apiClientMode === "server") {
    try {
      const liveSnapshotResult = await apiClient.getLiveSnapshot();

      return {
        snapshot: liveSnapshotResult.snapshot,
        liveSnapshotResult,
        notices
      };
    } catch (caughtError) {
      notices.push(
        `Live snapshot is not available yet: ${caughtError instanceof Error ? caughtError.message : "unknown error"}. Falling back to latest snapshot.`
      );
    }
  }

  const latestSnapshot = await apiClient.getLatestSnapshot();

  return {
    snapshot: latestSnapshot.snapshot,
    liveSnapshotResult: null,
    notices
  };
}

export function App() {
  const [data, setData] = useState<AppData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const [health, watchlistsResponse, snapshotResult, optionalServerData] = await Promise.all([
          apiClient.getHealth(),
          apiClient.getWatchlists(),
          loadSnapshotWithFallback(),
          loadOptionalServerData()
        ]);

        if (!active) return;

        setData({
          health,
          watchlists: watchlistsResponse.watchlists,
          latestSnapshot: snapshotResult.snapshot,
          configStatus: optionalServerData.configStatus,
          routes: optionalServerData.routes,
          liveSnapshotResult: snapshotResult.liveSnapshotResult,
          notices: [...snapshotResult.notices, ...optionalServerData.notices]
        });
      } catch (caughtError) {
        if (!active) return;

        setError(caughtError instanceof Error ? caughtError.message : "Unknown API client error.");
      }
    }

    void loadData();

    return () => {
      active = false;
    };
  }, []);

  if (error) return <ErrorCard message={error} />;
  if (!data) return <LoadingCard />;

  const { health, watchlists, latestSnapshot, configStatus, routes, liveSnapshotResult, notices } = data;
  const snapshotDecision = latestSnapshot.policyDecision ?? health.snapshotPolicy;
  const serverConnected = apiClientMode === "server";
  const configHasErrors = Boolean(configStatus && configStatus.errors.length > 0);
  const demoWatchlist = watchlists[0];

  return (
    <main className="telegram-shell">
      <section className="hero-card">
        <p className="eyebrow">Telegram Mini App</p>
        <h1>Acki Watchtower</h1>
        <p>
          Compact monitoring for server status, runtime configuration, live snapshot readiness,
          and wallet/account safety.
        </p>
      </section>

      {notices.length > 0 ? (
        <section className="notice-card">
          <span className="card-label">Notices</span>
          <ul>
            {notices.map((notice) => (
              <li key={notice}>{notice}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="runtime-card">
        <span className="card-label">API Client</span>
        <StatusBadge label={humanStatusLabel(apiClientMode)} tone={serverConnected ? "success" : "warning"} />
        <p>{apiClientBaseUrl}</p>
      </section>

      <section className="runtime-card">
        <span className="card-label">Telegram Runtime</span>
        <StatusBadge
          label={telegram.isTelegram ? "Telegram" : "Browser Preview"}
          tone={telegram.isTelegram ? "success" : "warning"}
        />
        <p>User: {telegram.userLabel}</p>
        <p>Theme: {humanStatusLabel(telegram.colorScheme)}</p>
        <p>Init data: {telegram.initDataAvailable ? "Available" : "Not available"}</p>
      </section>

      <section className="status-list">
        <article className="status-row">
          <div>
            <span className="card-label">Server Config</span>
            <strong>{configStatus ? humanStatusLabel(configStatus.mode) : "Demo Only"}</strong>
          </div>
          <StatusBadge
            label={configStatus ? (configHasErrors ? "Errors" : "Loaded") : "Unavailable"}
            tone={configStatus ? (configHasErrors ? "danger" : "success") : "warning"}
          />
        </article>

        <article className="status-row">
          <div>
            <span className="card-label">API Trust</span>
            <strong>{humanStatusLabel(health.apiTrust.status)}</strong>
          </div>
          <StatusBadge label={humanStatusLabel(health.apiTrust.status)} tone={apiTrustTone(health.apiTrust.status)} />
        </article>

        <article className="status-row">
          <div>
            <span className="card-label">Snapshot Mode</span>
            <strong>{snapshotDecision ? humanStatusLabel(snapshotDecision.mode) : "Unknown"}</strong>
          </div>
          <StatusBadge
            label={snapshotDecision ? humanStatusLabel(snapshotDecision.mode) : "Unknown"}
            tone={snapshotDecision ? snapshotDecisionTone(snapshotDecision.mode) : "warning"}
          />
        </article>

        <article className="status-row">
          <div>
            <span className="card-label">Address Mode</span>
            <strong>{humanStatusLabel(DEFAULT_WATCHTOWER_CONFIG.api.addressMode)}</strong>
          </div>
          <StatusBadge label="Hybrid" tone="warning" />
        </article>
      </section>

      {configStatus ? (
        <section className="warning-card">
          <span className="card-label">Config Status</span>
          <h2>Sanitized server config</h2>
          <div className="mini-grid">
            <div>
              <span>GraphQL</span>
              <StatusBadge label={configStatus.graphqlEndpointConfigured ? "Configured" : "Missing"} tone={toneForBoolean(configStatus.graphqlEndpointConfigured)} />
            </div>
            <div>
              <span>REST</span>
              <StatusBadge label={configStatus.restEndpointConfigured ? "Configured" : "Missing"} tone={toneForBoolean(configStatus.restEndpointConfigured)} />
            </div>
            <div>
              <span>DApp ID</span>
              <StatusBadge label={configStatus.dappIdConfigured ? "Configured" : "Missing"} tone={toneForBoolean(configStatus.dappIdConfigured)} />
            </div>
            <div>
              <span>API key</span>
              <StatusBadge label={configStatus.apiKeyPresent ? "Present" : "Missing"} tone={configStatus.apiKeyPresent ? "success" : "neutral"} />
            </div>
          </div>

          {configStatus.warnings.length > 0 || configStatus.errors.length > 0 ? (
            <ul>
              {[...configStatus.errors, ...configStatus.warnings].map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <p>No config warnings or errors returned.</p>
          )}
        </section>
      ) : null}

      <section className="warning-card">
        <span className="card-label">Latest Snapshot</span>
        <h2>{humanStatusLabel(latestSnapshot.policyDecision.mode)}</h2>
        <p>
          Source: {liveSnapshotResult ? "server /snapshots/live" : "fallback /snapshots/latest"}
        </p>
        <p>
          {latestSnapshot.totals.walletCount} wallets · {latestSnapshot.totals.successfulWallets} ok · {latestSnapshot.totals.partialWallets} partial · {latestSnapshot.totals.skippedWallets} skipped
        </p>
        <p>Confirmed NACKL: {latestSnapshot.totals.confirmedNacklFormatted ?? "Not confirmed"}</p>

        {liveSnapshotResult ? (
          <div className="compact-list">
            <strong>Live warnings/errors</strong>
            {[...liveSnapshotResult.errors, ...liveSnapshotResult.warnings].length > 0 ? (
              <ul>
                {[...liveSnapshotResult.errors, ...liveSnapshotResult.warnings].map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : (
              <p>No live snapshot warnings returned.</p>
            )}
          </div>
        ) : null}
      </section>

      <section className="warning-card">
        <span className="card-label">Wallet Snapshot State</span>
        <ul>
          {latestSnapshot.wallets.map((wallet) => (
            <li key={wallet.walletId}>
              <strong>{wallet.label}</strong>
              <br />
              {humanStatusLabel(wallet.status)}
              {wallet.warnings.length > 0 ? ` · ${wallet.warnings[0]}` : ""}
            </li>
          ))}
        </ul>
      </section>

      {demoWatchlist ? (
        <section className="warning-card">
          <span className="card-label">Watchlist</span>
          <h2>{demoWatchlist.name}</h2>
          <p>{demoWatchlist.wallets.length} wallets configured.</p>
          <ul>
            {demoWatchlist.wallets.map((wallet) => (
              <li key={wallet.id}>
                <strong>{wallet.label}</strong>
                <br />
                {humanStatusLabel(wallet.identity.scheme)} · {wallet.enabled ? "enabled" : "disabled"}
                <br />
                <code>{formatAccountIdentity(wallet.identity)}</code>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {routes ? (
        <section className="warning-card">
          <span className="card-label">Routes</span>
          <h2>{routes.routes.length} safe routes</h2>
          <ul>
            {routes.routes.slice(0, 6).map((route) => (
              <li key={route.path}>
                <code>{route.method} {route.path}</code>
                <br />
                {route.description}
              </li>
            ))}
          </ul>
          {routes.routes.length > 6 ? <p>{routes.routes.length - 6} more routes available in the web status panel.</p> : null}
        </section>
      ) : null}

      <section className="warning-card">
        <span className="card-label">Safety</span>
        <h2>Snapshot safety first</h2>
        {snapshotDecision && snapshotDecision.reasons.length > 0 ? (
          <ul>
            {snapshotDecision.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        ) : (
          <p>No blocking reasons in the current snapshot policy decision.</p>
        )}
      </section>
    </main>
  );
}
