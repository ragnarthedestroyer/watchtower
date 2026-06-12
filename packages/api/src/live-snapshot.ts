import {
  countSnapshotWalletStatuses,
  evaluateSnapshotPolicy,
  formatAccountIdentity,
  isLegacyAccountIdentity,
  isStateV2AccountIdentity,
  type Watchlist,
  type WatchtowerEndpointConfig,
  type WatchtowerSnapshot,
  type WatchtowerWalletSnapshot
} from "@watchtower/core";
import { buildLiveHealthResponse } from "./live-health";
import { readLiveMobileVerifierRoot } from "./live-mobile-verifier";
import type { MobileVerifierRootReadResult } from "./mobile-verifier";
import { readLiveRawAccount } from "./live-account";
import type { RawAccountReadRequest } from "./account-reader";
import { decodeBalanceCandidatesFromRawAccount } from "./balance-decoder";
import { summarizeWalletBalanceEvidence } from "./decoder-confidence";

export type BuildLiveSnapshotInput = {
  endpointConfig: WatchtowerEndpointConfig;
  watchlist: Watchlist;
  runtime?: WatchtowerSnapshot["source"]["runtime"];
  mobileVerifierRootAddress?: string;
};

export type LiveSnapshotBuildResult = {
  ok: boolean;
  snapshot: WatchtowerSnapshot;
  mobileVerifier: MobileVerifierRootReadResult;
  errors: string[];
  warnings: string[];
};

function rawAccountRequestForWallet(
  wallet: Watchlist["wallets"][number]
): RawAccountReadRequest {
  if (isLegacyAccountIdentity(wallet.identity)) {
    return {
      mode: "legacy",
      legacyAddress: wallet.identity.legacyAddress
    };
  }

  return {
    mode: "state_v2",
    accountId: wallet.identity.accountId,
    dappId: wallet.identity.dappId
  };
}

function skippedWalletSnapshot(
  wallet: Watchlist["wallets"][number]
): WatchtowerWalletSnapshot {
  return {
    walletId: wallet.id,
    label: wallet.label,
    identity: wallet.identity,
    resolvedDisplayAddress: formatAccountIdentity(wallet.identity),
    status: "SKIPPED",
    balances: [],
    errors: [],
    warnings: ["Wallet is disabled in the watchlist."]
  };
}

async function buildWalletSnapshot(input: {
  endpointConfig: WatchtowerEndpointConfig;
  wallet: Watchlist["wallets"][number];
}): Promise<WatchtowerWalletSnapshot> {
  const { endpointConfig, wallet } = input;

  if (!wallet.enabled) {
    return skippedWalletSnapshot(wallet);
  }

  const readResult = await readLiveRawAccount({
    endpointConfig,
    request: rawAccountRequestForWallet(wallet)
  });

  const snapshot: WatchtowerWalletSnapshot = {
    walletId: wallet.id,
    label: wallet.label,
    identity: wallet.identity,
    resolvedDisplayAddress: formatAccountIdentity(wallet.identity),
    status: readResult.ok ? "PARTIAL" : "ERROR",
    balances: [],
    errors: readResult.errors,
    warnings: []
  };

  if (isLegacyAccountIdentity(wallet.identity)) {
    snapshot.resolvedLegacyAddress = wallet.identity.legacyAddress;
  }

  if (isStateV2AccountIdentity(wallet.identity)) {
    snapshot.resolvedAccountId = wallet.identity.accountId;
    snapshot.resolvedDappId = wallet.identity.dappId;
  }

  const balanceDecode = decodeBalanceCandidatesFromRawAccount(readResult);
  snapshot.balances.push(...balanceDecode.balances);
  snapshot.warnings.push(...balanceDecode.warnings);

  if (readResult.ok) {
    snapshot.warnings.push(
      "Balance candidates are decoder hints only; confirmed wallet/token decoding is not implemented yet."
    );
  }

  if (readResult.normalizerWarnings) {
    snapshot.warnings.push(...readResult.normalizerWarnings);
  }

  if (!readResult.account?.boc) {
    snapshot.warnings.push(
      "BOC is missing from the normalized account response; ABI/BOC decoding cannot run yet."
    );
  }

  return snapshot;
}

function mvRootAgeMinutes(mobileVerifier: MobileVerifierRootReadResult): number | null {
  const rewardLastTimeIso = mobileVerifier.epoch.rewardLastTimeIso;

  if (!rewardLastTimeIso) {
    return null;
  }

  const rewardLastMs = Date.parse(rewardLastTimeIso);

  if (Number.isNaN(rewardLastMs)) {
    return null;
  }

  return Math.max(0, Math.round((Date.now() - rewardLastMs) / 60_000));
}

export async function buildLiveSnapshot(
  input: BuildLiveSnapshotInput
): Promise<LiveSnapshotBuildResult> {
  const createdAt = new Date().toISOString();
  const runtime = input.runtime ?? "server-job";
  const errors: string[] = [];
  const warnings: string[] = [];

  const health = await buildLiveHealthResponse({
    endpointConfig: input.endpointConfig
  });

  const mvRequest = input.mobileVerifierRootAddress
    ? { rootAddress: input.mobileVerifierRootAddress }
    : {};

  const mobileVerifier = await readLiveMobileVerifierRoot({
    endpointConfig: input.endpointConfig,
    request: mvRequest
  });

  if (!mobileVerifier.ok) {
    errors.push(...mobileVerifier.errors);
  }

  warnings.push(...mobileVerifier.warnings);

  const wallets = await Promise.all(
    input.watchlist.wallets.map((wallet) =>
      buildWalletSnapshot({ endpointConfig: input.endpointConfig, wallet })
    )
  );

  const balanceEvidence = summarizeWalletBalanceEvidence(wallets);
  warnings.push(...balanceEvidence.warnings);

  const totals = countSnapshotWalletStatuses(wallets);
  const enabledWallets = input.watchlist.wallets.filter((wallet) => wallet.enabled);
  const successfulWallets = wallets.filter((wallet) => wallet.status === "OK" || wallet.status === "PARTIAL").length;
  const allBalancesZero =
    wallets.length > 0 &&
    wallets.every((wallet) =>
      wallet.balances.length === 0 ||
      wallet.balances.every((balance) => balance.amountRaw === "0")
    );

  const policyDecision = evaluateSnapshotPolicy({
    apiTrustStatus: health.apiTrust.status,
    epochStatus: mobileVerifier.epoch.status,
    mvRootStatusAgeMinutes: mvRootAgeMinutes(mobileVerifier),
    successfulWallets,
    configuredWallets: enabledWallets.length,
    allBalancesZero,
    decoderConfidence: balanceEvidence.recommendedSnapshotConfidence,
    hasRateLimitSignal: health.apiTrust.hasRateLimitSignal,
    hasCloudflareOutageSignal: health.apiTrust.hasCloudflareOutageSignal
  });

  const snapshot: WatchtowerSnapshot = {
    snapshotId: `live-${input.watchlist.id}-${Date.now()}`,
    createdAt,
    source: {
      app: "acki-watchtower",
      runtime,
      version: "0.1.0-live-read"
    },
    apiTrust: health.apiTrust,
    epoch: mobileVerifier.epoch,
    policyDecision,
    wallets,
    totals: {
      ...totals,
      confirmedNacklFormatted: "Not confirmed",
      confirmedShellFormatted: "Not confirmed",
      confirmedUsdcFormatted: "Not confirmed"
    }
  };

  return {
    ok: policyDecision.safeToSave,
    snapshot,
    mobileVerifier,
    errors,
    warnings
  };
}
