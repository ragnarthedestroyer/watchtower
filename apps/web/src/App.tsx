import { useEffect, useMemo, useState } from "react";
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

type AppData = {
  health: HealthResponse;
  watchlists: WatchlistsResponse["watchlists"];
  latestSnapshot: SnapshotResponse["snapshot"];
  configStatus: ConfigStatusResponse | null;
  routes: RouteCatalogResponse | null;
  liveSnapshotResult: LiveSnapshotResponse | null;
  notices: string[];
};

type Tone = "success" | "warning" | "danger" | "neutral";

function StatusBadge(props: { label: string; tone: Tone }) {
  return <span className={`badge badge-${props.tone}`}>{props.label}</span>;
}

function toneForBoolean(value: boolean): Tone {
  return value ? "success" : "warning";
}

function LoadingPanel() {
  return (
    <main className="page-shell">
      <section className="hero">
        <p className="eyebrow">Acki Watchtower</p>
        <h1>Loading Watchtower status…</h1>
        <p className="hero-text">Reading through the configured Watchtower API client.</p>
      </section>
    </main>
  );
}

function ErrorPanel(props: { message: string }) {
  return (
    <main className="page-shell">
      <section className="hero">
        <p className="eyebrow">Acki Watchtower</p>
        <h1>Unable to load Watchtower status.</h1>
        <p className="hero-text">{props.message}</p>
      </section>
    </main>
  );
}

function EmptyValue() {
  return <span className="muted">Not available</span>;
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
      notices: ["Server-only status panels are hidden because the web app is using local demo transport."]
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
        `Live snapshot is not available yet: ${caughtError instanceof Error ? caughtError.message : "unknown error"}. Falling back to the latest demo snapshot.`
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

  const routeGroups = useMemo(() => {
    if (!data?.routes) return [];

    return [
      {
        title: "Server/status",
        routes: data.routes.routes.filter((route) => route.mode === "server")
      },
      {
        title: "Live read",
        routes: data.routes.routes.filter((route) => route.mode === "live-read")
      },
      {
        title: "Demo/read only",
        routes: data.routes.routes.filter((route) => route.mode === "demo")
      }
    ].filter((group) => group.routes.length > 0);
  }, [data?.routes]);

  if (error) return <ErrorPanel message={error} />;
  if (!data) return <LoadingPanel />;

  const { health, watchlists, latestSnapshot, configStatus, liveSnapshotResult, notices } = data;
  const snapshotDecision = latestSnapshot.policyDecision ?? health.snapshotPolicy;
  const configHasErrors = Boolean(configStatus && configStatus.errors.length > 0);
  const serverConnected = apiClientMode === "server";

  return (
    <main className="page-shell">
      <section className="hero">
        <p className="eyebrow">Acki Watchtower</p>
        <h1>Operational status panel.</h1>
        <p className="hero-text">
          A browser view for server connection, runtime configuration, route discovery,
          live snapshot readiness, and blocked-snapshot reasons.
        </p>
      </section>

      {notices.length > 0 ? (
        <section className="notice-panel">
          <h2>Notices</h2>
          <ul>
            {notices.map((notice) => (
              <li key={notice}>{notice}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="grid grid-four">
        <article className="card">
          <span className="card-label">Client Mode</span>
          <StatusBadge label={humanStatusLabel(apiClientMode)} tone={serverConnected ? "success" : "warning"} />
          <p>{serverConnected ? "Connected to a configured backend URL." : "Using local demo transport."}</p>
        </article>

        <article className="card">
          <span className="card-label">Server Config</span>
          <StatusBadge
            label={configStatus ? (configHasErrors ? "Config Errors" : humanStatusLabel(configStatus.mode)) : "Demo Only"}
            tone={configStatus ? (configHasErrors ? "danger" : "success") : "warning"}
          />
          <p>{configStatus ? "Sanitized server configuration loaded." : "No server configuration response loaded."}</p>
        </article>

        <article className="card">
          <span className="card-label">API Trust</span>
          <StatusBadge label={humanStatusLabel(health.apiTrust.status)} tone={apiTrustTone(health.apiTrust.status)} />
          <p>{health.apiTrust.reasons[0] ?? "No API trust warning returned."}</p>
        </article>

        <article className="card">
          <span className="card-label">Snapshot Mode</span>
          <StatusBadge
            label={snapshotDecision ? humanStatusLabel(snapshotDecision.mode) : "Unknown"}
            tone={snapshotDecision ? snapshotDecisionTone(snapshotDecision.mode) : "warning"}
          />
          <p>Snapshot saving remains policy-gated.</p>
        </article>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <span className="card-label">Connection</span>
            <h2>Server connection status</h2>
          </div>
          <StatusBadge label={serverConnected ? "Server URL configured" : "Local demo"} tone={serverConnected ? "success" : "warning"} />
        </div>
        <div className="definition-grid">
          <div>
            <span>API base URL</span>
            <code>{apiClientBaseUrl}</code>
          </div>
          <div>
            <span>Address mode</span>
            <strong>{humanStatusLabel(DEFAULT_WATCHTOWER_CONFIG.api.addressMode)}</strong>
          </div>
          <div>
            <span>Live snapshot source</span>
            <strong>{liveSnapshotResult ? "Server /snapshots/live" : "Fallback /snapshots/latest"}</strong>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <span className="card-label">Configuration</span>
            <h2>Sanitized server config</h2>
          </div>
          <StatusBadge label={configStatus ? "Loaded" : "Unavailable"} tone={configStatus ? "success" : "warning"} />
        </div>

        {configStatus ? (
          <>
            <div className="config-grid">
              <article>
                <span>Runtime</span>
                <strong>{humanStatusLabel(configStatus.mode)}</strong>
              </article>
              <article>
                <span>GraphQL endpoint</span>
                <StatusBadge label={configStatus.graphqlEndpointConfigured ? "Configured" : "Missing"} tone={toneForBoolean(configStatus.graphqlEndpointConfigured)} />
              </article>
              <article>
                <span>REST endpoint</span>
                <StatusBadge label={configStatus.restEndpointConfigured ? "Configured" : "Missing"} tone={toneForBoolean(configStatus.restEndpointConfigured)} />
              </article>
              <article>
                <span>DApp ID</span>
                <StatusBadge label={configStatus.dappIdConfigured ? "Configured" : "Missing"} tone={toneForBoolean(configStatus.dappIdConfigured)} />
              </article>
              <article>
                <span>API key</span>
                <StatusBadge label={configStatus.apiKeyPresent ? "Present" : "Missing"} tone={configStatus.apiKeyPresent ? "success" : "neutral"} />
              </article>
              <article>
                <span>Block Manager endpoint</span>
                <StatusBadge label={configStatus.blockManagerEndpointConfigured ? "Configured" : "Missing"} tone={toneForBoolean(configStatus.blockManagerEndpointConfigured)} />
              </article>
            </div>

            {configStatus.warnings.length > 0 || configStatus.errors.length > 0 ? (
              <div className="split-list">
                <div>
                  <h3>Warnings</h3>
                  {configStatus.warnings.length > 0 ? (
                    <ul>{configStatus.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>
                  ) : <p className="muted">No config warnings.</p>}
                </div>
                <div>
                  <h3>Errors</h3>
                  {configStatus.errors.length > 0 ? (
                    <ul>{configStatus.errors.map((configError) => <li key={configError}>{configError}</li>)}</ul>
                  ) : <p className="muted">No config errors.</p>}
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <p className="muted">Config status is only available when the web app is connected to the Watchtower server.</p>
        )}
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <span className="card-label">Routes</span>
            <h2>Available server routes</h2>
          </div>
          <StatusBadge label={data.routes ? `${data.routes.routes.length} routes` : "Unavailable"} tone={data.routes ? "success" : "warning"} />
        </div>

        {routeGroups.length > 0 ? (
          <div className="route-groups">
            {routeGroups.map((group) => (
              <article key={group.title} className="route-group">
                <h3>{group.title}</h3>
                <div className="route-list">
                  {group.routes.map((route) => (
                    <div key={route.path} className="route-row">
                      <code>{route.method} {route.path}</code>
                      <p>{route.description}</p>
                      <small>{route.safetyNotes[0]}</small>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="muted">Route catalog is only available from the server route <code>/routes</code>.</p>
        )}
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <span className="card-label">Snapshot</span>
            <h2>Latest snapshot status</h2>
          </div>
          <StatusBadge
            label={snapshotDecision ? humanStatusLabel(snapshotDecision.mode) : "Unknown"}
            tone={snapshotDecision ? snapshotDecisionTone(snapshotDecision.mode) : "warning"}
          />
        </div>

        <div className="snapshot-grid">
          <article>
            <span className="card-label">Snapshot ID</span>
            <code>{latestSnapshot.snapshotId}</code>
          </article>
          <article>
            <span className="card-label">Wallets</span>
            <strong>{latestSnapshot.totals.walletCount}</strong>
            <p>
              {latestSnapshot.totals.successfulWallets} ok · {latestSnapshot.totals.partialWallets} partial · {latestSnapshot.totals.failedWallets} failed · {latestSnapshot.totals.skippedWallets} skipped
            </p>
          </article>
          <article>
            <span className="card-label">Confirmed NACKL</span>
            <strong>{latestSnapshot.totals.confirmedNacklFormatted ?? "Not confirmed"}</strong>
            <p>No balance is trusted until decoder confidence is confirmed.</p>
          </article>
        </div>

        {liveSnapshotResult ? (
          <div className="split-list">
            <div>
              <h3>Live snapshot warnings</h3>
              {liveSnapshotResult.warnings.length > 0 ? (
                <ul>{liveSnapshotResult.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>
              ) : <p className="muted">No live snapshot warnings.</p>}
            </div>
            <div>
              <h3>Live snapshot errors</h3>
              {liveSnapshotResult.errors.length > 0 ? (
                <ul>{liveSnapshotResult.errors.map((snapshotError) => <li key={snapshotError}>{snapshotError}</li>)}</ul>
              ) : <p className="muted">No live snapshot errors.</p>}
            </div>
          </div>
        ) : null}
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <span className="card-label">Wallets</span>
            <h2>Watchlist wallet state</h2>
          </div>
          <StatusBadge label={`${watchlists.length} watchlist${watchlists.length === 1 ? "" : "s"}`} tone="neutral" />
        </div>

        <div className="wallet-table">
          {watchlists.flatMap((watchlist) =>
            watchlist.wallets.map((wallet) => {
              const walletSnapshot = latestSnapshot.wallets.find((item) => item.walletId === wallet.id);

              return (
                <article key={`${watchlist.id}-${wallet.id}`} className="wallet-row">
                  <div>
                    <strong>{wallet.label}</strong>
                    <small>{watchlist.name}</small>
                  </div>
                  <div>
                    <span>{humanStatusLabel(wallet.identity.scheme)}</span>
                    <code>{formatAccountIdentity(wallet.identity)}</code>
                  </div>
                  <div>
                    <StatusBadge
                      label={walletSnapshot ? humanStatusLabel(walletSnapshot.status) : "No snapshot"}
                      tone={walletSnapshot?.status === "ERROR" ? "danger" : walletSnapshot?.status === "PARTIAL" ? "warning" : "neutral"}
                    />
                    <p>{walletSnapshot?.warnings[0] ?? "No wallet snapshot warning."}</p>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <span className="card-label">Safety</span>
            <h2>Why snapshots are blocked</h2>
          </div>
          <StatusBadge
            label={snapshotDecision ? `${snapshotDecision.reasons.length} reason${snapshotDecision.reasons.length === 1 ? "" : "s"}` : "Unknown"}
            tone={snapshotDecision && snapshotDecision.reasons.length === 0 ? "success" : "warning"}
          />
        </div>

        {snapshotDecision && snapshotDecision.reasons.length > 0 ? (
          <ul>
            {snapshotDecision.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        ) : snapshotDecision ? (
          <p>No blocking reasons in the current snapshot policy decision.</p>
        ) : (
          <EmptyValue />
        )}
      </section>
    </main>
  );
}
