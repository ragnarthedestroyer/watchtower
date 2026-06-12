import { useEffect, useState } from "react";
import {
  type HealthResponse,
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
};

function StatusBadge(props: { label: string; tone: "success" | "warning" | "danger" | "neutral" }) {
  return <span className={`badge badge-${props.tone}`}>{props.label}</span>;
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

export function App() {
  const [data, setData] = useState<AppData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const [health, watchlistsResponse, snapshotResponse] = await Promise.all([
          apiClient.getHealth(),
          apiClient.getWatchlists(),
          apiClientMode === "server"
            ? apiClient.getLiveSnapshot().then((result) => result.snapshot)
            : apiClient.getLatestSnapshot().then((result) => result.snapshot)
        ]);

        if (!active) return;

        setData({
          health,
          watchlists: watchlistsResponse.watchlists,
          latestSnapshot: snapshotResponse
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

  if (error) return <ErrorPanel message={error} />;
  if (!data) return <LoadingPanel />;

  const { health, watchlists, latestSnapshot } = data;
  const snapshotDecision = health.snapshotPolicy;

  return (
    <main className="page-shell">
      <section className="hero">
        <p className="eyebrow">Acki Watchtower</p>
        <h1>Wallet and epoch monitoring without unsafe snapshots.</h1>
        <p className="hero-text">
          Web-first and Telegram-ready monitoring for Acki Nacki account states,
          Mobile Verifier epochs, API trust, and snapshot safety.
        </p>
      </section>

      <section className="panel">
        <h2>API client mode</h2>
        <p>Mode: <strong>{humanStatusLabel(apiClientMode)}</strong></p>
        <p>Base URL: <code>{apiClientBaseUrl}</code></p>
        <p>Use <code>VITE_WATCHTOWER_API_BASE_URL</code> to connect the web app to the server.</p>
      </section>

      <section className="grid">
        <article className="card">
          <span className="card-label">API Trust</span>
          <StatusBadge label={humanStatusLabel(health.apiTrust.status)} tone={apiTrustTone(health.apiTrust.status)} />
          <p>Current data is loaded through the shared Watchtower API client.</p>
        </article>

        <article className="card">
          <span className="card-label">Snapshot Mode</span>
          <StatusBadge
            label={snapshotDecision ? humanStatusLabel(snapshotDecision.mode) : "Unknown"}
            tone={snapshotDecision ? snapshotDecisionTone(snapshotDecision.mode) : "warning"}
          />
          <p>Snapshots are blocked until epoch and decoder confidence are confirmed.</p>
        </article>

        <article className="card">
          <span className="card-label">Address Mode</span>
          <StatusBadge label={humanStatusLabel(DEFAULT_WATCHTOWER_CONFIG.api.addressMode)} tone="warning" />
          <p>Hybrid mode keeps legacy compatibility while preparing for State V2.</p>
        </article>
      </section>

      <section className="panel">
        <h2>Latest snapshot</h2>
        <div className="snapshot-grid">
          <article>
            <span className="card-label">Snapshot ID</span>
            <code>{latestSnapshot.snapshotId}</code>
          </article>
          <article>
            <span className="card-label">Wallets</span>
            <strong>{latestSnapshot.totals.walletCount}</strong>
            <p>
              {latestSnapshot.totals.successfulWallets} ok · {latestSnapshot.totals.partialWallets} partial · {latestSnapshot.totals.skippedWallets} skipped
            </p>
          </article>
          <article>
            <span className="card-label">Confirmed NACKL</span>
            <strong>{latestSnapshot.totals.confirmedNacklFormatted}</strong>
            <p>No balance is trusted until the decoder is confirmed.</p>
          </article>
        </div>

        <ul>
          {latestSnapshot.wallets.map((wallet) => (
            <li key={wallet.walletId}>
              <strong>{wallet.label}</strong> — {humanStatusLabel(wallet.status)}
              {wallet.warnings.length > 0 ? ` — ${wallet.warnings[0]}` : ""}
            </li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <h2>Watchlist</h2>
        {watchlists.map((watchlist) => (
          <article key={watchlist.id}>
            <h3>{watchlist.name}</h3>
            <p>{watchlist.description}</p>
            <ul>
              {watchlist.wallets.map((wallet) => (
                <li key={wallet.id}>
                  <strong>{wallet.label}</strong> — {humanStatusLabel(wallet.identity.scheme)} — {wallet.enabled ? "enabled" : "disabled"}
                  <br />
                  <code>{formatAccountIdentity(wallet.identity)}</code>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="panel">
        <h2>Why snapshots are currently blocked</h2>
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

      <section className="panel">
        <h2>Next technical target</h2>
        <ul>
          <li>Replace demo transport with a deployed API route.</li>
          <li>Add Mobile Verifier epoch reader.</li>
          <li>Add watchlist creation and wallet identity forms.</li>
          <li>Keep all snapshot writes behind policy gates.</li>
        </ul>
      </section>
    </main>
  );
}
