import type { WatchtowerAccountIdentity } from "./identity";
import type { SnapshotPolicyDecision } from "./snapshot-policy";
import type { ApiTrustDecision } from "./api-trust";
import type { MobileVerifierEpoch } from "./epoch";

export type BalanceConfidence = "confirmed" | "partial" | "unresolved";

export type WatchtowerBalance = {
  token: "NACKL" | "SHELL" | "USDC" | "UNKNOWN";
  amountRaw: string;
  decimals: number;
  amountFormatted: string;
  confidence: BalanceConfidence;
  source: string;
};

export type WatchtowerWalletSnapshot = {
  walletId: string;
  label: string;
  identity: WatchtowerAccountIdentity;

  resolvedDisplayAddress?: string;
  resolvedLegacyAddress?: string;
  resolvedDappId?: string;
  resolvedAccountId?: string;

  status: "OK" | "PARTIAL" | "ERROR" | "SKIPPED";
  balances: WatchtowerBalance[];

  errors: string[];
  warnings: string[];
};

export type WatchtowerSnapshot = {
  snapshotId: string;
  createdAt: string;

  source: {
    app: "acki-watchtower";
    runtime: "web" | "telegram" | "server-job" | "manual";
    version?: string;
  };

  apiTrust: ApiTrustDecision;
  epoch: MobileVerifierEpoch | null;
  policyDecision: SnapshotPolicyDecision;

  wallets: WatchtowerWalletSnapshot[];

  totals: {
    walletCount: number;
    successfulWallets: number;
    partialWallets: number;
    failedWallets: number;
    skippedWallets: number;

    confirmedNacklFormatted?: string;
    confirmedShellFormatted?: string;
    confirmedUsdcFormatted?: string;
  };
};

export function countSnapshotWalletStatuses(
  wallets: WatchtowerWalletSnapshot[]
): WatchtowerSnapshot["totals"] {
  const successfulWallets = wallets.filter((wallet) => wallet.status === "OK").length;
  const partialWallets = wallets.filter((wallet) => wallet.status === "PARTIAL").length;
  const failedWallets = wallets.filter((wallet) => wallet.status === "ERROR").length;
  const skippedWallets = wallets.filter((wallet) => wallet.status === "SKIPPED").length;

  return {
    walletCount: wallets.length,
    successfulWallets,
    partialWallets,
    failedWallets,
    skippedWallets
  };
}
