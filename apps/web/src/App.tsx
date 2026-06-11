import { buildDemoHealthResponse, buildDemoSnapshot, buildDemoWatchlists } from "@watchtower/api";
import { DEFAULT_WATCHTOWER_CONFIG, formatAccountIdentity } from "@watchtower/core";
import { apiTrustTone, snapshotDecisionTone, humanStatusLabel } from "@watchtower/ui";

const health = buildDemoHealthResponse("web");
const snapshotDecision = health.snapshotPolicy;
const demoWatchlists = buildDemoWatchlists();
const latestSnapshot = buildDemoSnapshot("web");

function StatusBadge(props: { label: string; tone: "success" | "warning" | "danger" | "neutral" }) {
  return <span className={`badge badge-${props.tone}`}>{props.label}</span>;
}

export function App() {
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

      <section className="grid">
        <article className="card">
          <span className="card-label">API Trust</span>
          <StatusBadge label={humanStatusLabel(health.apiTrust.status)} tone={apiTrustTone(health.apiTrust.status)} />
          <p>Current placeholder signal: reachable HTTP 200.</p>
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
        <h2>Latest demo snapshot</h2>
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
        <h2>Demo watchlist</h2>
        {demoWatchlists.map((watchlist) => (
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
          <li>Add backend health endpoint.</li>
          <li>Add Mobile Verifier epoch reader.</li>
          <li>Add watchlist creation and wallet identity forms.</li>
          <li>Keep all snapshot writes behind policy gates.</li>
        </ul>
      </section>
    </main>
  );
}
