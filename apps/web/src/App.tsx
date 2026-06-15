import { useEffect, useMemo, useState } from "react";
import {
  type ConfigStatusResponse,
  type HealthResponse,
  type LiveSnapshotResponse,
  type MvpReadinessResponse,
  type RouteCatalogResponse,
  type SnapshotHistoryDetailResponse,
  type SnapshotHistoryResponse,
  type SnapshotResponse,
  type AccountInspectionResponse,
  type DecoderResearchReportResponse,
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
  mvpReadiness: MvpReadinessResponse | null;
  snapshotHistory: SnapshotHistoryResponse | null;
  liveSnapshotResult: LiveSnapshotResponse | null;
  notices: string[];
};

type Tone = "success" | "warning" | "danger" | "neutral";
type AccountInspectionMode = "legacy" | "state_v2";

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
  mvpReadiness: MvpReadinessResponse | null;
  snapshotHistory: SnapshotHistoryResponse | null;
  notices: string[];
}> {
  const notices: string[] = [];

  if (apiClientMode !== "server") {
    return {
      configStatus: null,
      routes: null,
      mvpReadiness: null,
      snapshotHistory: null,
      notices: ["Server-only status panels are hidden because the web app is using local demo transport."]
    };
  }

  const [configResult, routeResult, readinessResult, historyResult] = await Promise.allSettled([
    apiClient.getConfigStatus(),
    apiClient.getRoutes(),
    apiClient.getMvpReadiness(),
    apiClient.getSnapshotHistory({ limit: 10 })
  ]);

  const configStatus = configResult.status === "fulfilled" ? configResult.value : null;
  const routes = routeResult.status === "fulfilled" ? routeResult.value : null;
  const mvpReadiness = readinessResult.status === "fulfilled" ? readinessResult.value : null;
  const snapshotHistory = historyResult.status === "fulfilled" ? historyResult.value : null;

  if (configResult.status === "rejected") {
    notices.push(`Config status could not be loaded: ${configResult.reason instanceof Error ? configResult.reason.message : "unknown error"}.`);
  }

  if (routeResult.status === "rejected") {
    notices.push(`Route catalog could not be loaded: ${routeResult.reason instanceof Error ? routeResult.reason.message : "unknown error"}.`);
  }

  if (readinessResult.status === "rejected") {
    notices.push(`MVP readiness could not be loaded: ${readinessResult.reason instanceof Error ? readinessResult.reason.message : "unknown error"}.`);
  }

  if (historyResult.status === "rejected") {
    notices.push(`Snapshot history could not be loaded: ${historyResult.reason instanceof Error ? historyResult.reason.message : "unknown error"}.`);
  }

  return {
    configStatus,
    routes,
    mvpReadiness,
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
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(null);
  const [selectedSnapshotDetail, setSelectedSnapshotDetail] = useState<SnapshotHistoryDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [accountInspectionMode, setAccountInspectionMode] = useState<AccountInspectionMode>("legacy");
  const [accountAddressInput, setAccountAddressInput] = useState("");
  const [accountIdInput, setAccountIdInput] = useState("");
  const [dappIdInput, setDappIdInput] = useState("");
  const [accountInspection, setAccountInspection] = useState<AccountInspectionResponse | null>(null);
  const [inspectionLoading, setInspectionLoading] = useState(false);
  const [inspectionError, setInspectionError] = useState<string | null>(null);
  const [decoderResearchReport, setDecoderResearchReport] = useState<DecoderResearchReportResponse | null>(null);
  const [decoderResearchLoading, setDecoderResearchLoading] = useState(false);
  const [decoderResearchError, setDecoderResearchError] = useState<string | null>(null);

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
          mvpReadiness: optionalServerData.mvpReadiness,
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

  async function inspectConfiguredAccount() {
    const address = accountAddressInput.trim();
    const accountId = accountIdInput.trim();
    const dappId = dappIdInput.trim();

    setAccountInspection(null);
    setInspectionError(null);

    if (apiClientMode !== "server") {
      setInspectionError("Account inspection is only available when connected to the Watchtower server.");
      return;
    }

    if (accountInspectionMode === "legacy" && !address) {
      setInspectionError("Enter a legacy address such as 0:<64hex> before inspecting.");
      return;
    }

    if (accountInspectionMode === "state_v2" && (!accountId || !dappId)) {
      setInspectionError("Enter both State V2 account_id and dapp_id before inspecting.");
      return;
    }

    setInspectionLoading(true);

    try {
      const inspection = await apiClient.inspectAccount(
        accountInspectionMode === "legacy"
          ? { address }
          : { accountId, dappId }
      );
      setAccountInspection(inspection);
    } catch (caughtError) {
      setInspectionError(caughtError instanceof Error ? caughtError.message : "Unknown account-inspection error.");
    } finally {
      setInspectionLoading(false);
    }
  }


  async function generateDecoderResearchReport() {
    const address = accountAddressInput.trim();
    const accountId = accountIdInput.trim();
    const dappId = dappIdInput.trim();

    setDecoderResearchReport(null);
    setDecoderResearchError(null);

    if (apiClientMode !== "server") {
      setDecoderResearchError("Decoder research reports are only available when connected to the Watchtower server.");
      return;
    }

    if (accountInspectionMode === "legacy" && !address) {
      setDecoderResearchError("Enter a legacy address such as 0:<64hex> before generating a decoder research report.");
      return;
    }

    if (accountInspectionMode === "state_v2" && (!accountId || !dappId)) {
      setDecoderResearchError("Enter both State V2 account_id and dapp_id before generating a decoder research report.");
      return;
    }

    setDecoderResearchLoading(true);

    try {
      const report = await apiClient.getDecoderResearchReport(
        accountInspectionMode === "legacy"
          ? { address }
          : { accountId, dappId }
      );
      setDecoderResearchReport(report);
    } catch (caughtError) {
      setDecoderResearchError(caughtError instanceof Error ? caughtError.message : "Unknown decoder-research error.");
    } finally {
      setDecoderResearchLoading(false);
    }
  }

  if (error) return <ErrorPanel message={error} />;
  if (!data) return <LoadingPanel />;

  const { health, watchlists, latestSnapshot, configStatus, mvpReadiness, snapshotHistory, liveSnapshotResult, notices } = data;
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
            <span className="card-label">Readiness</span>
            <h2>MVP readiness</h2>
          </div>
          <StatusBadge
            label={mvpReadiness ? `${mvpReadiness.summary.done}/${mvpReadiness.summary.total} done` : "Unavailable"}
            tone={mvpReadiness ? "warning" : "neutral"}
          />
        </div>

        {mvpReadiness ? (
          <>
            <div className="readiness-summary">
              <article><span>Done</span><strong>{mvpReadiness.summary.done}</strong></article>
              <article><span>Partial</span><strong>{mvpReadiness.summary.partial}</strong></article>
              <article><span>Blocked</span><strong>{mvpReadiness.summary.blocked}</strong></article>
              <article><span>Not started</span><strong>{mvpReadiness.summary.notStarted}</strong></article>
            </div>
            <div className="readiness-list">
              {mvpReadiness.items.map((item) => (
                <article key={item.area} className="readiness-item">
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.summary}</p>
                    <small>Next: {item.nextStep}</small>
                  </div>
                  <StatusBadge label={humanStatusLabel(item.status)} tone={item.status === "done" ? "success" : item.status === "blocked" ? "danger" : item.status === "partial" ? "warning" : "neutral"} />
                </article>
              ))}
            </div>
          </>
        ) : (
          <p className="muted">MVP readiness is available from the server route <code>/mvp/readiness</code>.</p>
        )}
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
            <span className="card-label">Inspect</span>
            <h2>Account inspection</h2>
          </div>
          <StatusBadge
            label={accountInspection ? (accountInspection.accountPresent ? "Account Found" : "No Account") : "Ready"}
            tone={accountInspection ? (accountInspection.accountPresent ? "success" : "warning") : "neutral"}
          />
        </div>

        <p className="muted">
          Use this panel to inspect either a legacy address or a State V2 account_id + dapp_id through
          <code> /accounts/inspect</code>. This is research evidence only; raw balances are not confirmed wallet NACKL.
        </p>

        <div className="mode-toggle" aria-label="Account inspection mode">
          <button
            className={accountInspectionMode === "legacy" ? "pill-button active" : "pill-button"}
            type="button"
            onClick={() => setAccountInspectionMode("legacy")}
          >
            Legacy address
          </button>
          <button
            className={accountInspectionMode === "state_v2" ? "pill-button active" : "pill-button"}
            type="button"
            onClick={() => setAccountInspectionMode("state_v2")}
          >
            State V2
          </button>
        </div>

        {accountInspectionMode === "legacy" ? (
          <div className="inspect-form">
            <input
              className="text-input"
              type="text"
              value={accountAddressInput}
              onChange={(event) => setAccountAddressInput(event.target.value)}
              placeholder="0:<64hex>"
              aria-label="Legacy account address"
            />
            <button
              className="secondary-button"
              type="button"
              onClick={() => void inspectConfiguredAccount()}
              disabled={inspectionLoading}
            >
              {inspectionLoading ? "Inspecting…" : "Inspect account"}
            </button>
          </div>
        ) : (
          <div className="inspect-form state-v2-form">
            <input
              className="text-input"
              type="text"
              value={accountIdInput}
              onChange={(event) => setAccountIdInput(event.target.value)}
              placeholder="account_id <64hex>"
              aria-label="State V2 account ID"
            />
            <input
              className="text-input"
              type="text"
              value={dappIdInput}
              onChange={(event) => setDappIdInput(event.target.value)}
              placeholder="dapp_id <64hex>"
              aria-label="State V2 DApp ID"
            />
            <button
              className="secondary-button"
              type="button"
              onClick={() => void inspectConfiguredAccount()}
              disabled={inspectionLoading}
            >
              {inspectionLoading ? "Inspecting…" : "Inspect State V2"}
            </button>
          </div>
        )}

        {inspectionError ? <p className="error-text">{inspectionError}</p> : null}

        <div className="research-actions">
          <button
            className="secondary-button"
            type="button"
            onClick={() => void generateDecoderResearchReport()}
            disabled={decoderResearchLoading}
          >
            {decoderResearchLoading ? "Generating report…" : "Generate decoder research report"}
          </button>
          <span className="muted">Uses <code>/decoder/research-report</code> and keeps results as research evidence only.</span>
        </div>

        {decoderResearchError ? <p className="error-text">{decoderResearchError}</p> : null}


        {decoderResearchReport ? (
          <div className="detail-stack research-report-panel">
            <div className="panel-heading compact-heading">
              <div>
                <span className="card-label">Decoder Research</span>
                <h3>Research report</h3>
              </div>
              <StatusBadge
                label={humanStatusLabel(decoderResearchReport.status)}
                tone={decoderResearchReport.status === "blocked" ? "danger" : decoderResearchReport.status === "ready_for_manual_review" ? "success" : "warning"}
              />
            </div>

            <div className="definition-grid">
              <div>
                <span>Report ID</span>
                <code>{decoderResearchReport.reportId}</code>
              </div>
              <div>
                <span>Generated</span>
                <strong>{new Date(decoderResearchReport.generatedAt).toLocaleString()}</strong>
              </div>
              <div>
                <span>Account mode</span>
                <strong>{humanStatusLabel(decoderResearchReport.account.mode)}</strong>
              </div>
              <div>
                <span>BOC present</span>
                <StatusBadge label={decoderResearchReport.account.bocPresent ? "Yes" : "No"} tone={decoderResearchReport.account.bocPresent ? "success" : "warning"} />
              </div>
              <div>
                <span>Classification</span>
                <strong>{humanStatusLabel(decoderResearchReport.classification.kind)}</strong>
              </div>
              <div>
                <span>Candidate groups</span>
                <strong>{decoderResearchReport.candidateGroups.length}</strong>
              </div>
            </div>

            <div className="split-list">
              <div>
                <h3>Blockers</h3>
                {decoderResearchReport.blockers.length > 0 ? (
                  <ul>{decoderResearchReport.blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}</ul>
                ) : (
                  <p className="muted">No research blockers returned.</p>
                )}
              </div>
              <div>
                <h3>Suggested next steps</h3>
                {decoderResearchReport.suggestedNextSteps.length > 0 ? (
                  <ul>{decoderResearchReport.suggestedNextSteps.map((step) => <li key={step}>{step}</li>)}</ul>
                ) : (
                  <p className="muted">No suggested next steps returned.</p>
                )}
              </div>
            </div>

            <div className="detail-box">
              <h3>Candidate groups</h3>
              {decoderResearchReport.candidateGroups.length > 0 ? (
                <div className="detail-table">
                  {decoderResearchReport.candidateGroups.map((group) => (
                    <article key={group.kind} className="detail-row">
                      <div>
                        <span>Kind</span>
                        <strong>{humanStatusLabel(group.kind)}</strong>
                      </div>
                      <div>
                        <span>Count</span>
                        <strong>{group.count}</strong>
                      </div>
                      <div>
                        <span>Confidence</span>
                        <strong>{group.confidenceLevels.map(humanStatusLabel).join(", ")}</strong>
                      </div>
                      <div>
                        <span>Sample raw amounts</span>
                        <code>{group.sampleAmountsRaw.join(", ") || "none"}</code>
                      </div>
                      <div className="wide-cell">
                        <span>Paths</span>
                        <code>{group.paths.join(", ") || "none"}</code>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="muted">No grouped candidates returned.</p>
              )}
            </div>

            {decoderResearchReport.warnings.length > 0 ? (
              <div className="detail-box">
                <h3>Research warnings</h3>
                <ul>{decoderResearchReport.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>
              </div>
            ) : null}
          </div>
        ) : null}

        {accountInspection ? (
          <div className="detail-stack">
            <div className="definition-grid">
              <div>
                <span>Mode</span>
                <strong>{humanStatusLabel(accountInspection.mode)}</strong>
              </div>
              <div>
                <span>Account present</span>
                <StatusBadge label={accountInspection.accountPresent ? "Yes" : "No"} tone={accountInspection.accountPresent ? "success" : "warning"} />
              </div>
              <div>
                <span>Classification</span>
                <strong>{humanStatusLabel(accountInspection.accountClassification.kind)}</strong>
              </div>
              <div>
                <span>Decoder confidence</span>
                <strong>{humanStatusLabel(accountInspection.balanceEvidence.recommendedSnapshotConfidence)}</strong>
              </div>
              <div>
                <span>Balance candidates</span>
                <strong>{accountInspection.balanceCandidates.length}</strong>
              </div>
              <div>
                <span>Raw account container</span>
                <strong>{accountInspection.rawShape.accountContainer}</strong>
              </div>
            </div>

            {accountInspection.normalizedAccount ? (
              <div className="detail-box">
                <h3>Normalized account fields</h3>
                <div className="definition-grid">
                  <div>
                    <span>ID</span>
                    <code>{accountInspection.normalizedAccount.id ?? "not returned"}</code>
                  </div>
                  <div>
                    <span>Account ID</span>
                    <code>{accountInspection.normalizedAccount.accountId ?? "not returned"}</code>
                  </div>
                  <div>
                    <span>DApp ID</span>
                    <code>{accountInspection.normalizedAccount.dappId ?? "not returned"}</code>
                  </div>
                  <div>
                    <span>Raw balance</span>
                    <code>{accountInspection.normalizedAccount.balance ?? "not returned"}</code>
                  </div>
                  <div>
                    <span>BOC</span>
                    <strong>{accountInspection.normalizedAccount.boc ? "present" : "missing"}</strong>
                  </div>
                  <div>
                    <span>Code hash</span>
                    <code>{accountInspection.normalizedAccount.codeHash ?? "not returned"}</code>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="split-list">
              <div>
                <h3>Decoder hints</h3>
                {accountInspection.decoderHints.length > 0 ? (
                  <ul>
                    {accountInspection.decoderHints.map((hint) => (
                      <li key={`${hint.level}-${hint.message}`}>
                        <strong>{humanStatusLabel(hint.level)}:</strong> {hint.message}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">No decoder hints returned.</p>
                )}
              </div>
              <div>
                <h3>Warnings</h3>
                {accountInspection.warnings.length > 0 ? (
                  <ul>
                    {accountInspection.warnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">No inspection warnings.</p>
                )}
              </div>
            </div>

            <div className="detail-box">
              <h3>Balance candidates</h3>
              {accountInspection.balanceCandidates.length > 0 ? (
                <div className="detail-table">
                  {accountInspection.balanceCandidates.map((candidate) => (
                    <article key={`${candidate.source}-${candidate.path}-${candidate.amountRaw}`} className="detail-row">
                      <div>
                        <span>Token</span>
                        <strong>{candidate.token}</strong>
                      </div>
                      <div>
                        <span>Raw amount</span>
                        <code>{candidate.amountRaw}</code>
                      </div>
                      <div>
                        <span>Confidence</span>
                        <strong>{humanStatusLabel(candidate.confidence)}</strong>
                      </div>
                      <div>
                        <span>Evidence</span>
                        <strong>{candidate.path}</strong>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="muted">No balance candidates found in this inspection.</p>
              )}
            </div>
          </div>
        ) : null}
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
            <span className="card-label">History</span>
            <h2>Research snapshot history</h2>
          </div>
          <StatusBadge
            label={snapshotHistory ? `${snapshotHistory.snapshots.length} saved` : "Unavailable"}
            tone={snapshotHistory ? "success" : "warning"}
          />
        </div>

        {snapshotHistory ? (
          <>
            <p className="muted">{snapshotHistory.storage.warning}</p>
            {snapshotHistory.snapshots.length > 0 ? (
              <div className="history-table">
                {snapshotHistory.snapshots.map((snapshot) => (
                  <article key={snapshot.snapshotId} className="history-row">
                    <div>
                      <strong>{snapshot.snapshotId}</strong>
                      <small>{new Date(snapshot.createdAt).toLocaleString()}</small>
                    </div>
                    <div>
                      <span>Policy</span>
                      <StatusBadge
                        label={humanStatusLabel(snapshot.policyMode)}
                        tone={snapshot.safeToSave ? "success" : "warning"}
                      />
                    </div>
                    <div>
                      <span>Wallets</span>
                      <strong>{snapshot.walletCount}</strong>
                      <p>
                        {snapshot.successfulWallets} ok · {snapshot.partialWallets} partial · {snapshot.failedWallets} failed · {snapshot.skippedWallets} skipped
                      </p>
                    </div>
                    <div>
                      <span>Blocking reasons</span>
                      <strong>{snapshot.policyReasonCount}</strong>
                    </div>
                    <div>
                      <button
                        className="secondary-button"
                        type="button"
                        onClick={() => void loadSnapshotDetail(snapshot.snapshotId)}
                      >
                        View detail
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p>
                No research snapshots are stored yet. Use the server route
                <code> POST /snapshots/live/research-save</code> once live-read mode is configured.
              </p>
            )}
          </>
        ) : (
          <p className="muted">Snapshot history is only available when the web app is connected to the Watchtower server.</p>
        )}
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <span className="card-label">History Detail</span>
            <h2>Selected research snapshot detail</h2>
          </div>
          <StatusBadge
            label={selectedSnapshotId ? "Selected" : "No selection"}
            tone={selectedSnapshotId ? "success" : "neutral"}
          />
        </div>

        {!selectedSnapshotId ? (
          <p className="muted">Select a saved research snapshot from the history panel to inspect stored wallet snapshots, balance candidates, API health, and epoch evidence.</p>
        ) : detailLoading ? (
          <p className="muted">Loading snapshot detail…</p>
        ) : detailError ? (
          <p className="error-text">{detailError}</p>
        ) : selectedSnapshotDetail ? (
          <div className="detail-stack">
            <div className="definition-grid">
              <div>
                <span>Snapshot ID</span>
                <code>{selectedSnapshotDetail.snapshot.id}</code>
              </div>
              <div>
                <span>Created</span>
                <strong>{new Date(selectedSnapshotDetail.snapshot.createdAt).toLocaleString()}</strong>
              </div>
              <div>
                <span>Policy</span>
                <StatusBadge
                  label={humanStatusLabel(selectedSnapshotDetail.snapshot.policyMode)}
                  tone={selectedSnapshotDetail.snapshot.safeToSave ? "success" : "warning"}
                />
              </div>
            </div>

            {selectedSnapshotDetail.snapshot.policyReasons.length > 0 ? (
              <div className="detail-box">
                <h3>Stored policy reasons</h3>
                <ul>
                  {selectedSnapshotDetail.snapshot.policyReasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="split-list">
              <div>
                <h3>API health evidence</h3>
                {selectedSnapshotDetail.apiHealth ? (
                  <ul>
                    <li>Status: {humanStatusLabel(selectedSnapshotDetail.apiHealth.status)}</li>
                    <li>Reachable: {selectedSnapshotDetail.apiHealth.reachable ? "yes" : "no"}</li>
                    <li>Endpoint: {selectedSnapshotDetail.apiHealth.endpointKind}</li>
                    <li>Checked: {new Date(selectedSnapshotDetail.apiHealth.checkedAt).toLocaleString()}</li>
                  </ul>
                ) : (
                  <p className="muted">No API health record stored for this snapshot.</p>
                )}
              </div>
              <div>
                <h3>Epoch evidence</h3>
                {selectedSnapshotDetail.epoch ? (
                  <ul>
                    <li>Status: {humanStatusLabel(selectedSnapshotDetail.epoch.status)}</li>
                    <li>Decoder: {humanStatusLabel(selectedSnapshotDetail.epoch.decoderStatus)}</li>
                    <li>Root: {selectedSnapshotDetail.epoch.rootAddress ?? "not stored"}</li>
                    <li>Matched paths: {selectedSnapshotDetail.epoch.matchedFieldPaths.length}</li>
                  </ul>
                ) : (
                  <p className="muted">No epoch record stored for this snapshot.</p>
                )}
              </div>
            </div>

            <div className="detail-box">
              <h3>Wallet snapshot records</h3>
              {selectedSnapshotDetail.walletSnapshots.length > 0 ? (
                <div className="detail-table">
                  {selectedSnapshotDetail.walletSnapshots.map((walletSnapshot) => (
                    <article key={walletSnapshot.id} className="detail-row">
                      <div>
                        <span>Wallet</span>
                        <code>{walletSnapshot.walletId}</code>
                      </div>
                      <div>
                        <span>Status</span>
                        <StatusBadge
                          label={humanStatusLabel(walletSnapshot.status)}
                          tone={walletSnapshot.status === "ERROR" ? "danger" : walletSnapshot.status === "PARTIAL" ? "warning" : "neutral"}
                        />
                      </div>
                      <div>
                        <span>Decoder confidence</span>
                        <strong>{humanStatusLabel(walletSnapshot.decoderConfidence)}</strong>
                      </div>
                      <div>
                        <span>Classification</span>
                        <strong>{walletSnapshot.accountClassification ?? "Not classified"}</strong>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="muted">No wallet snapshot records stored for this snapshot.</p>
              )}
            </div>

            <div className="detail-box">
              <h3>Balance candidates</h3>
              {selectedSnapshotDetail.balanceCandidates.length > 0 ? (
                <div className="detail-table">
                  {selectedSnapshotDetail.balanceCandidates.map((candidate) => (
                    <article key={candidate.id} className="detail-row">
                      <div>
                        <span>Token</span>
                        <strong>{candidate.token}</strong>
                      </div>
                      <div>
                        <span>Raw amount</span>
                        <code>{candidate.amountRaw}</code>
                      </div>
                      <div>
                        <span>Confidence</span>
                        <strong>{humanStatusLabel(candidate.confidence)}</strong>
                      </div>
                      <div>
                        <span>Evidence</span>
                        <strong>{candidate.evidencePath ?? candidate.source}</strong>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="muted">No balance candidates stored for this snapshot.</p>
              )}
            </div>
          </div>
        ) : (
          <p className="muted">No detail selected.</p>
        )}
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
