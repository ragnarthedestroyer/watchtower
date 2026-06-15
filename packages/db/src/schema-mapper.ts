import type {
  Watchlist,
  WatchlistWallet,
  WatchtowerSnapshot,
  WatchtowerWalletSnapshot
} from "@watchtower/core";
import type {
  DatabaseId,
  WatchtowerBalanceCandidateRecord,
  WatchtowerSnapshotRecord,
  WatchtowerWalletRecord,
  WatchtowerWalletSnapshotRecord,
  WatchtowerWatchlistRecord
} from "./schema";

export function createDatabaseId(prefix: string): DatabaseId {
  const safePrefix = prefix.replace(/[^a-zA-Z0-9_-]/g, "_") || "record";
  const randomPart = Math.random().toString(36).slice(2, 10);

  return `${safePrefix}_${Date.now()}_${randomPart}`;
}

export function mapWatchlistToRecord(
  watchlist: Watchlist
): WatchtowerWatchlistRecord {
  const record: WatchtowerWatchlistRecord = {
    id: watchlist.id,
    ownerUserId: watchlist.ownerUserId,
    name: watchlist.name,
    visibility: watchlist.visibility,
    createdAt: watchlist.createdAt,
    updatedAt: watchlist.updatedAt
  };

  if (watchlist.description) {
    record.description = watchlist.description;
  }

  return record;
}

export function mapWatchlistWalletToRecord(input: {
  watchlistId: DatabaseId;
  wallet: WatchlistWallet;
}): WatchtowerWalletRecord {
  const { watchlistId, wallet } = input;

  const record: WatchtowerWalletRecord = {
    id: wallet.id,
    watchlistId,
    label: wallet.label,
    enabled: wallet.enabled,
    identityScheme: wallet.identity.scheme,
    tags: wallet.tags ?? [],
    createdAt: wallet.createdAt,
    updatedAt: wallet.updatedAt
  };

  if (wallet.identity.scheme === "legacy") {
    record.legacyAddress = wallet.identity.legacyAddress;
  }

  if (wallet.identity.scheme === "state_v2") {
    record.dappId = wallet.identity.dappId;
    record.accountId = wallet.identity.accountId;
  }

  if (wallet.notes) {
    record.notes = wallet.notes;
  }

  return record;
}

export function mapWatchlistWalletsToRecords(
  watchlist: Watchlist
): WatchtowerWalletRecord[] {
  return watchlist.wallets.map((wallet) =>
    mapWatchlistWalletToRecord({
      watchlistId: watchlist.id,
      wallet
    })
  );
}

export function mapSnapshotToRecord(input: {
  snapshot: WatchtowerSnapshot;
  watchlistId: DatabaseId;
  apiHealthId?: DatabaseId;
  epochId?: DatabaseId;
}): WatchtowerSnapshotRecord {
  const { snapshot, watchlistId } = input;

  const record: WatchtowerSnapshotRecord = {
    id: snapshot.snapshotId,
    watchlistId,
    createdAt: snapshot.createdAt,
    runtime: snapshot.source.runtime,
    policyMode: snapshot.policyDecision.mode,
    safeToSave: snapshot.policyDecision.safeToSave,
    policyReasons: snapshot.policyDecision.reasons,
    walletCount: snapshot.totals.walletCount,
    successfulWallets: snapshot.totals.successfulWallets,
    partialWallets: snapshot.totals.partialWallets,
    failedWallets: snapshot.totals.failedWallets,
    skippedWallets: snapshot.totals.skippedWallets
  };

  if (input.apiHealthId) {
    record.apiHealthId = input.apiHealthId;
  }

  if (input.epochId) {
    record.epochId = input.epochId;
  }

  return record;
}

export function mapWalletSnapshotToRecord(input: {
  snapshotId: DatabaseId;
  walletSnapshot: WatchtowerWalletSnapshot;
  decoderConfidence?: "confirmed" | "partial" | "unresolved";
  accountClassification?: string;
}): WatchtowerWalletSnapshotRecord {
  const { snapshotId, walletSnapshot } = input;

  const record: WatchtowerWalletSnapshotRecord = {
    id: createDatabaseId("wallet_snapshot"),
    snapshotId,
    walletId: walletSnapshot.walletId,
    status: walletSnapshot.status,
    decoderConfidence: input.decoderConfidence ?? "unresolved",
    warnings: walletSnapshot.warnings,
    errors: walletSnapshot.errors
  };

  if (walletSnapshot.resolvedDisplayAddress) {
    record.resolvedDisplayAddress = walletSnapshot.resolvedDisplayAddress;
  }

  if (walletSnapshot.resolvedLegacyAddress) {
    record.resolvedLegacyAddress = walletSnapshot.resolvedLegacyAddress;
  }

  if (walletSnapshot.resolvedDappId) {
    record.resolvedDappId = walletSnapshot.resolvedDappId;
  }

  if (walletSnapshot.resolvedAccountId) {
    record.resolvedAccountId = walletSnapshot.resolvedAccountId;
  }

  if (input.accountClassification) {
    record.accountClassification = input.accountClassification;
  }

  return record;
}

export function mapBalanceCandidatesToRecords(input: {
  walletSnapshotId: DatabaseId;
  walletSnapshot: WatchtowerWalletSnapshot;
}): WatchtowerBalanceCandidateRecord[] {
  return input.walletSnapshot.balances.map((balance) => {
    const record: WatchtowerBalanceCandidateRecord = {
      id: createDatabaseId("balance_candidate"),
      walletSnapshotId: input.walletSnapshotId,
      token: balance.token,
      amountRaw: balance.amountRaw,
      decimals: balance.decimals,
      source: balance.source,
      confidence: balance.confidence
    };

    return record;
  });
}
