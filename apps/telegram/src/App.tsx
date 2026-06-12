import { useEffect, useState } from "react";
import {
  type HealthResponse,
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
};

const telegram = initializeTelegramApp();
function StatusBadge(props: { label: string; tone: "success" | "warning" | "danger" | "neutral" }) {
  return <span className={`badge badge-${props.tone}`}>{props.label}</span>;
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

  if (error) return <ErrorCard message={error} />;
  if (!data) return <LoadingCard />;

  const { health, watchlists, latestSnapshot } = data;
  const snapshotDecision = health.snapshotPolicy;
  const demoWatchlist = watchlists[0];

  return (
    <main className="telegram-shell">
      <section className="hero-card">
        <p className="eyebrow">Telegram Mini App</p>
        <h1>Acki Watchtower</h1>
        <p>
          Compact monitoring for wallet/account states, Mobile Verifier epoch health,
          API trust, and snapshot safety.
        </p>
      </section>

      <section className="runtime-card">
        <span className="card-label">API Client</span>
        <StatusBadge label={humanStatusLabel(apiClientMode)} tone={apiClientMode === "server" ? "success" : "warning"} />
        <p>{apiClientBaseUrl}</p>
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
        <span className="card-label">Latest snapshot</span>
        <h2>{humanStatusLabel(latestSnapshot.policyDecision.mode)}</h2>
        <p>
          {latestSnapshot.totals.walletCount} wallets · {latestSnapshot.totals.partialWallets} partial · {latestSnapshot.totals.skippedWallets} skipped
        </p>
        <p>Confirmed NACKL: {latestSnapshot.totals.confirmedNacklFormatted}</p>
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
