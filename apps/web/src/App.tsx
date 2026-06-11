import { buildDemoHealthResponse } from "@watchtower/api";
import { DEFAULT_WATCHTOWER_CONFIG } from "@watchtower/core";
import { apiTrustTone, snapshotDecisionTone, humanStatusLabel } from "@watchtower/ui";

const health = buildDemoHealthResponse("web");
const snapshotDecision = health.snapshotPolicy;

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
