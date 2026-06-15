import type {
  DatabaseId,
  WatchtowerApiHealthRecord,
  WatchtowerBalanceCandidateRecord,
  WatchtowerEpochRecord,
  WatchtowerSnapshotRecord,
  WatchtowerWalletSnapshotRecord
} from "./schema";
import type { WatchtowerSchemaStore } from "./schema-store";

export type WatchtowerSnapshotHistorySummary = {
  snapshotId: DatabaseId;
  watchlistId: DatabaseId;
  createdAt: string;
  runtime: WatchtowerSnapshotRecord["runtime"];
  policyMode: WatchtowerSnapshotRecord["policyMode"];
  safeToSave: boolean;
  policyReasonCount: number;
  walletCount: number;
  successfulWallets: number;
  partialWallets: number;
  failedWallets: number;
  skippedWallets: number;
};

export type WatchtowerSnapshotHistoryDetail = {
  snapshot: WatchtowerSnapshotRecord;
  walletSnapshots: WatchtowerWalletSnapshotRecord[];
  balanceCandidates: WatchtowerBalanceCandidateRecord[];
  apiHealth: WatchtowerApiHealthRecord | null;
  epoch: WatchtowerEpochRecord | null;
};

export type ListSnapshotHistoryInput = {
  store: WatchtowerSchemaStore;
  watchlistId?: DatabaseId;
  limit?: number;
};

export type SnapshotHistoryResult<T> = {
  ok: boolean;
  data?: T;
  errors: string[];
};

function newestSnapshotsFirst(
  snapshots: WatchtowerSnapshotRecord[]
): WatchtowerSnapshotRecord[] {
  return [...snapshots].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function snapshotToHistorySummary(
  snapshot: WatchtowerSnapshotRecord
): WatchtowerSnapshotHistorySummary {
  return {
    snapshotId: snapshot.id,
    watchlistId: snapshot.watchlistId,
    createdAt: snapshot.createdAt,
    runtime: snapshot.runtime,
    policyMode: snapshot.policyMode,
    safeToSave: snapshot.safeToSave,
    policyReasonCount: snapshot.policyReasons.length,
    walletCount: snapshot.walletCount,
    successfulWallets: snapshot.successfulWallets,
    partialWallets: snapshot.partialWallets,
    failedWallets: snapshot.failedWallets,
    skippedWallets: snapshot.skippedWallets
  };
}

export function listSnapshotHistory(
  input: ListSnapshotHistoryInput
): SnapshotHistoryResult<WatchtowerSnapshotHistorySummary[]> {
  const state = input.store.getState();
  const limit = input.limit ?? 20;

  const snapshots = newestSnapshotsFirst(
    state.snapshots.filter((snapshot) => {
      if (!input.watchlistId) {
        return true;
      }

      return snapshot.watchlistId === input.watchlistId;
    })
  ).slice(0, Math.max(0, limit));

  return {
    ok: true,
    data: snapshots.map(snapshotToHistorySummary),
    errors: []
  };
}

export function getSnapshotHistoryDetail(input: {
  store: WatchtowerSchemaStore;
  snapshotId: DatabaseId;
}): SnapshotHistoryResult<WatchtowerSnapshotHistoryDetail | null> {
  const state = input.store.getState();
  const snapshot = state.snapshots.find((item) => item.id === input.snapshotId) ?? null;

  if (!snapshot) {
    return {
      ok: true,
      data: null,
      errors: []
    };
  }

  const walletSnapshots = state.walletSnapshots.filter(
    (walletSnapshot) => walletSnapshot.snapshotId === snapshot.id
  );

  const walletSnapshotIds = new Set(walletSnapshots.map((walletSnapshot) => walletSnapshot.id));

  const balanceCandidates = state.balanceCandidates.filter((candidate) =>
    walletSnapshotIds.has(candidate.walletSnapshotId)
  );

  const apiHealth = snapshot.apiHealthId
    ? state.apiHealthChecks.find((record) => record.id === snapshot.apiHealthId) ?? null
    : null;

  const epoch = snapshot.epochId
    ? state.epochs.find((record) => record.id === snapshot.epochId) ?? null
    : null;

  return {
    ok: true,
    data: {
      snapshot,
      walletSnapshots,
      balanceCandidates,
      apiHealth,
      epoch
    },
    errors: []
  };
}
