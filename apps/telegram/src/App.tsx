import {
  DEFAULT_WATCHTOWER_CONFIG,
  evaluateApiTrust,
  evaluateSnapshotPolicy,
  type ApiHealthSignal
} from "@watchtower/core";
import { apiTrustTone, snapshotDecisionTone, humanStatusLabel } from "@watchtower/ui";
import { initializeTelegramApp } from "./telegram";

const telegram = initializeTelegramApp();

const demoApiSignal: ApiHealthSignal = {
  checkedAt: new Date().toISOString(),
  reachable: true,
  httpStatus: 200,
  responseMs: 530,
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
            <strong>{humanStatusLabel(apiTrust.status)}</strong>
          </div>
          <StatusBadge label={humanStatusLabel(apiTrust.status)} tone={apiTrustTone(apiTrust.status)} />
        </article>

        <article className="status-row">
          <div>
            <span className="card-label">Snapshot Mode</span>
            <strong>{humanStatusLabel(snapshotDecision.mode)}</strong>
          </div>
          <StatusBadge
            label={humanStatusLabel(snapshotDecision.mode)}
            tone={snapshotDecisionTone(snapshotDecision.mode)}
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
        <h2>Snapshot safety first</h2>
        <p>
          Telegram users should see live read-only signals before any snapshot is saved.
          Writes remain blocked until API trust, epoch status, and decoder confidence are confirmed.
        </p>
      </section>
    </main>
  );
}
