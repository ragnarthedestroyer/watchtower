import { buildDemoHealthResponse, buildDemoSnapshot, buildDemoWatchlists } from "@watchtower/api";
import { DEFAULT_WATCHTOWER_CONFIG, formatAccountIdentity } from "@watchtower/core";
import { apiTrustTone, snapshotDecisionTone, humanStatusLabel } from "@watchtower/ui";
import { initializeTelegramApp } from "./telegram";

const telegram = initializeTelegramApp();
const health = buildDemoHealthResponse("telegram");
const snapshotDecision = health.snapshotPolicy;
const demoWatchlist = buildDemoWatchlists()[0];
const latestSnapshot = buildDemoSnapshot("telegram");

function StatusBadge(props: { label: string; tone: "success" | "warning" | "danger" | "neutral" }) {
  return <span className={`badge badge-${props.tone}`}>{props.label}</span>;
}

export function App() {
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
        <span className="card-label">Latest demo snapshot</span>
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
          <span className="card-label">Demo watchlist</span>
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
