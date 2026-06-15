import { useEffect, useState } from "react";
import {
  type ConfigStatusResponse,
  type HealthResponse,
  type LiveSnapshotResponse,
  type RouteCatalogResponse,
  type SnapshotHistoryDetailResponse,
  type SnapshotHistoryResponse,
  type SnapshotResponse,
  type WatchlistsResponse
} from "@watchtower/api";
import { DEFAULT_WATCHTOWER_CONFIG, formatAccountIdentity } from "@watchtower/core";
import { apiTrustTone, snapshotDecisionTone, humanStatusLabel } from "@watchtower/ui";
import { apiClient, apiClientBaseUrl, apiClientMode } from "./api-client";
import { initializeTelegramApp } from "./telegram";

type AppData = {
  health: HealthResponse;
  watchlists: WatchlistsResponse["watchlists"];
  latestSnapshot: SnapshotResponse["snapshot"];
  configStatus: ConfigStatusResponse | null;
  routes: RouteCatalogResponse | null;
  snapshotHistory: SnapshotHistoryResponse | null;
  liveSnapshotResult: LiveSnapshotResponse | null;
  notices: string[];
};

type Tone = "success" | "warning" | "danger" | "neutral";

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
        <p>Loading Watchtower API client data…</p>
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
  snapshotHistory: SnapshotHistoryResponse | null;
  notices: string[];
}> {
  const notices: string[] = [];

  if (apiClientMode !== "server") {
    return {
      configStatus: null,
      routes: null,
      snapshotHistory: null,
      notices: ["Server panels are hidden because the Telegram app is using local demo transport."]
    };
  }

  const [configResult, routeResult, historyResult] = await Promise.allSettled([
    apiClient.getConfigStatus(),
    apiClient.getRoutes(),
    apiClient.getSnapshotHistory({ limit: 5 })
  ]);

  const configStatus = configResult.status === "fulfilled" ? configResult.value : null;
  const routes = routeResult.status === "fulfilled" ? routeResult.value : null;
  const snapshotHistory = historyResult.status === "fulfilled" ? historyResult.value : null;

  if (configResult.status === "rejected") {
    notices.push(`Config status could not be loaded: ${configResult.reason instanceof Error ? configResult.reason.message : "unknown error"}.`);
  }

  if (routeResult.status === "rejected") {
    notices.push(`Route catalog could not be loaded: ${routeResult.reason instanceof Error ? routeResult.reason.message : "unknown error"}.`);
  }

  if (historyResult.status === "rejected") {
    notices.push(`Snapshot history could not be loaded: ${historyResult.reason instanceof Error ? historyResult.reason.message : "unknown error"}.`);
  }

  return {
    configStatus,
    routes,
    snapshotHistory,
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
        `Live snapshot is not available yet: ${caughtError instanceof Error ? caughtError.message : "unknown error"}. Falling back to latest demo snapshot.`
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
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(null);
  const [selectedSnapshotDetail, setSelectedSnapshotDetail] = useState<SnapshotHistoryDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

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
          snapshotHistory: optionalServerData.snapshotHistory,
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

  async function loadSnapshotDetail(snapshotId: string) {
    setSelectedSnapshotId(snapshotId);
    setSelectedSnapshotDetail(null);
    setDetailError(null);

    if (apiClientMode !== "server") {
      setDetailError("Snapshot detail is only available when connected to the Watchtower server.");
      return;
    }

    setDetailLoading(true);

    try {
      const detail = await apiClient.getSnapshotHistoryDetail({ snapshotId });
      setSelectedSnapshotDetail(detail);

      if (!detail) {
        setDetailError("The selected snapshot was not found in the in-memory store.");
      }
    } catch (caughtError) {
      setDetailError(caughtError instanceof Error ? caughtError.message : "Unknown snapshot-detail error.");
    } finally {
      setDetailLoading(false);
    }
  }

  if (error) return <ErrorCard message={error} />;
  if (!data) return <LoadingCard />;

  const { health, watchlists, latestSnapshot, configStatus, routes, snapshotHistory, liveSnapshotResult, notices } = data;
  const snapshotDecision = latestSnapshot.policyDecision ?? health.snapshotPolicy;
  const demoWatchlist = watchlists[0];
  const configHasErrors = Boolean(configStatus && configStatus.errors.length > 0);
  const serverConnected = apiClientMode === "server";

  return (
    <main className="telegram-shell">
      <section className="hero-card">
        <p className="eyebrow">Telegram Mini App</p>
        <h1>Acki Watchtower</h1>
        <p>
          Compact monitoring for wallet/account states, Mobile Verifier epoch health,
          API trust, route status, and research snapshot history.
        </p>
      </section>

      {notices.length > 0 ? (
        <section className="warning-card">
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
        <p>{serverConnected ? "Server-backed mode is configured." : "Local demo mode is active."}</p>
      </section>

      <section className="runtime-card">
        <span className="card-label">Runtime</span>
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

      <section className="warning-card">
        <span className="card-label">Server Config</span>
        <h2>{configStatus ? (configHasErrors ? "Config needs attention" : humanStatusLabel(configStatus.mode)) : "Not connected"}</h2>
        {configStatus ? (
          <div className="compact-grid">
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
          </div>
        ) : (
          <p>Server configuration is available only when Telegram is connected to the Watchtower backend.</p>
        )}
      </section>

      <section className="warning-card">
        <span className="card-label">Latest snapshot</span>
        <h2>{humanStatusLabel(latestSnapshot.policyDecision.mode)}</h2>
        <p>
          Source: {liveSnapshotResult ? "Server /snapshots/live" : "Fallback /snapshots/latest"}
        </p>
        <p>
          {latestSnapshot.totals.walletCount} wallets · {latestSnapshot.totals.partialWallets} partial · {latestSnapshot.totals.skippedWallets} skipped
        </p>
        <p>Confirmed NACKL: {latestSnapshot.totals.confirmedNacklFormatted ?? "Not confirmed"}</p>
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

      <section className="warning-card">
        <span className="card-label">Research history</span>
        <h2>{snapshotHistory ? `${snapshotHistory.snapshots.length} saved snapshots` : "Unavailable"}</h2>
        {snapshotHistory ? (
          <>
            <p>{snapshotHistory.storage.warning}</p>
            {snapshotHistory.snapshots.length > 0 ? (
              <div className="history-list">
                {snapshotHistory.snapshots.map((snapshot) => (
                  <article key={snapshot.snapshotId} className="history-item">
                    <strong>{snapshot.snapshotId}</strong>
                    <small>{new Date(snapshot.createdAt).toLocaleString()}</small>
                    <span>{humanStatusLabel(snapshot.policyMode)} · {snapshot.walletCount} wallets · {snapshot.policyReasonCount} reasons</span>
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={() => void loadSnapshotDetail(snapshot.snapshotId)}
                    >
                      View detail
                    </button>
                  </article>
                ))}
              </div>
            ) : (
              <p>No research snapshots are stored yet.</p>
            )}
          </>
        ) : (
          <p>History is available only when connected to the Watchtower server.</p>
        )}
      </section>

      <section className="warning-card">
        <span className="card-label">History detail</span>
        <h2>{selectedSnapshotId ? "Selected snapshot" : "No selection"}</h2>

        {!selectedSnapshotId ? (
          <p>Select a saved research snapshot to inspect stored evidence, wallet records, and balance candidates.</p>
        ) : detailLoading ? (
          <p>Loading snapshot detail…</p>
        ) : detailError ? (
          <p className="error-text">{detailError}</p>
        ) : selectedSnapshotDetail ? (
          <div className="detail-stack">
            <div className="detail-box">
              <strong>{selectedSnapshotDetail.snapshot.id}</strong>
              <p>{new Date(selectedSnapshotDetail.snapshot.createdAt).toLocaleString()}</p>
              <p>Policy: {humanStatusLabel(selectedSnapshotDetail.snapshot.policyMode)}</p>
              <p>Safe to save: {selectedSnapshotDetail.snapshot.safeToSave ? "yes" : "no"}</p>
            </div>

            {selectedSnapshotDetail.snapshot.policyReasons.length > 0 ? (
              <div className="detail-box">
                <h3>Policy reasons</h3>
                <ul>
                  {selectedSnapshotDetail.snapshot.policyReasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="detail-box">
              <h3>API health</h3>
              {selectedSnapshotDetail.apiHealth ? (
                <ul>
                  <li>Status: {humanStatusLabel(selectedSnapshotDetail.apiHealth.status)}</li>
                  <li>Reachable: {selectedSnapshotDetail.apiHealth.reachable ? "yes" : "no"}</li>
                  <li>Endpoint: {selectedSnapshotDetail.apiHealth.endpointKind}</li>
                </ul>
              ) : (
                <p>No API health record stored for this snapshot.</p>
              )}
            </div>

            <div className="detail-box">
              <h3>Epoch evidence</h3>
              {selectedSnapshotDetail.epoch ? (
                <ul>
                  <li>Status: {humanStatusLabel(selectedSnapshotDetail.epoch.status)}</li>
                  <li>Decoder: {humanStatusLabel(selectedSnapshotDetail.epoch.decoderStatus)}</li>
                  <li>Matched paths: {selectedSnapshotDetail.epoch.matchedFieldPaths.length}</li>
                </ul>
              ) : (
                <p>No epoch record stored for this snapshot.</p>
              )}
            </div>

            <div className="detail-box">
              <h3>Wallet records</h3>
              {selectedSnapshotDetail.walletSnapshots.length > 0 ? (
                <div className="detail-table">
                  {selectedSnapshotDetail.walletSnapshots.map((walletSnapshot) => (
                    <article key={walletSnapshot.id} className="detail-row">
                      <strong>{walletSnapshot.walletId}</strong>
                      <span>{humanStatusLabel(walletSnapshot.status)} · {humanStatusLabel(walletSnapshot.decoderConfidence)}</span>
                      <small>{walletSnapshot.accountClassification ?? "Not classified"}</small>
                    </article>
                  ))}
                </div>
              ) : (
                <p>No wallet snapshot records stored.</p>
              )}
            </div>

            <div className="detail-box">
              <h3>Balance candidates</h3>
              {selectedSnapshotDetail.balanceCandidates.length > 0 ? (
                <div className="detail-table">
                  {selectedSnapshotDetail.balanceCandidates.map((candidate) => (
                    <article key={candidate.id} className="detail-row">
                      <strong>{candidate.token}</strong>
                      <code>{candidate.amountRaw}</code>
                      <span>{humanStatusLabel(candidate.confidence)}</span>
                      <small>{candidate.evidencePath ?? candidate.source}</small>
                    </article>
                  ))}
                </div>
              ) : (
                <p>No balance candidates stored.</p>
              )}
            </div>
          </div>
        ) : (
          <p>No detail loaded.</p>
        )}
      </section>

      <section className="warning-card">
        <span className="card-label">Routes</span>
        <h2>{routes ? `${routes.routes.length} available routes` : "Unavailable"}</h2>
        {routes ? (
          <ul>
            {routes.routes.slice(0, 6).map((route) => (
              <li key={`${route.method}-${route.path}`}>
                <code>{route.method} {route.path}</code>
              </li>
            ))}
          </ul>
        ) : (
          <p>Route catalog is available only from the server.</p>
        )}
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

      <section className="warning-card">
        <h2>Snapshot safety first</h2>
        {snapshotDecision && snapshotDecision.reasons.length > 0 ? (
          <ul>
            {snapshotDecision.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        ) : (
          <p>No blocking reasons in the current health response.</p>
        )}
      </section>
    </main>
  );
}
