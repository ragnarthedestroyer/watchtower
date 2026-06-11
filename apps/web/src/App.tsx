import {
  DEFAULT_WATCHTOWER_CONFIG,
  evaluateApiTrust,
  evaluateSnapshotPolicy,
  type ApiHealthSignal
} from "@watchtower/core";
import { apiTrustTone, snapshotDecisionTone, humanStatusLabel } from "@watchtower/ui";

const demoApiSignal: ApiHealthSignal = {
  checkedAt: new Date().toISOString(),
  reachable: true,
  httpStatus: 200,
  responseMs: 412,
  stale: false
};

const apiTrust = evaluateApiTrust(demoApiSignal);

const snapshotDecision = evaluateSnapshotPolicy({
  apiTrustStatus: apiTrust.status,
  epochStatus: "UNKNOWN",
  mvRootStatusAgeMinutes: null,
  successfulWallets: 0,
  configuredWallets: 0,
  allBalancesZero: false,
  decoderConfidence: "unresolved",
  hasRateLimitSignal: apiTrust.hasRateLimitSignal,
  hasCloudflareOutageSignal: apiTrust.hasCloudflareOutageSignal
});

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
          <StatusBadge label={humanStatusLabel(apiTrust.status)} tone={apiTrustTone(apiTrust.status)} />
          <p>Current placeholder signal: reachable HTTP 200.</p>
        </article>

        <article className="card">
          <span className="card-label">Snapshot Mode</span>
          <StatusBadge
            label={humanStatusLabel(snapshotDecision.mode)}
            tone={snapshotDecisionTone(snapshotDecision.mode)}
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
