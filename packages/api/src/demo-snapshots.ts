import {
  countSnapshotWalletStatuses,
  formatAccountIdentity,
  type WatchtowerSnapshot,
  type WatchtowerWalletSnapshot
} from "@watchtower/core";
import { buildDemoHealthResponse, type DemoRuntime } from "./demo";
import { buildDemoWatchlists } from "./demo-watchlists";

export function buildDemoSnapshot(runtime: DemoRuntime): WatchtowerSnapshot {
  const createdAt = new Date().toISOString();
  const health = buildDemoHealthResponse(runtime);
  const watchlist = buildDemoWatchlists()[0];

  const wallets: WatchtowerWalletSnapshot[] = (watchlist?.wallets || []).map(
    (wallet): WatchtowerWalletSnapshot => {
      if (!wallet.enabled) {
        return {
          walletId: wallet.id,
          label: wallet.label,
          identity: wallet.identity,
          resolvedDisplayAddress: formatAccountIdentity(wallet.identity),
          status: "SKIPPED",
          balances: [],
          errors: [],
          warnings: ["Wallet is disabled in the demo watchlist."]
        };
      }

      return {
        walletId: wallet.id,
        label: wallet.label,
        identity: wallet.identity,
        resolvedDisplayAddress: formatAccountIdentity(wallet.identity),
        status: "PARTIAL",
        balances: [
          {
            token: "NACKL",
            amountRaw: "0",
            decimals: 9,
            amountFormatted: "Decoder pending",
            confidence: "unresolved",
            source: "demo-placeholder"
          }
        ],
        errors: [],
        warnings: [
          "Balance decoder is not connected yet.",
          "Snapshot is read-only until epoch and decoder confidence are confirmed."
        ]
      };
    }
  );

  return {
    snapshotId: `demo-${runtime}-${Date.now()}`,
    createdAt,
    source: {
      app: "acki-watchtower",
      runtime,
      version: "0.1.0-demo"
    },
    apiTrust: health.apiTrust,
    epoch: health.epoch,
    policyDecision: health.snapshotPolicy ?? {
      mode: "BLOCKED",
      safeToSave: false,
      reasons: ["Snapshot policy was not available."]
    },
    wallets,
    totals: {
      ...countSnapshotWalletStatuses(wallets),
      confirmedNacklFormatted: "Not confirmed",
      confirmedShellFormatted: "Not confirmed",
      confirmedUsdcFormatted: "Not confirmed"
    }
  };
}
