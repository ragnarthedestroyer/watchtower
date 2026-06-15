import type {
  Watchlist,
  WatchtowerAddressMode,
  WatchtowerNetworkMode,
  WatchtowerSnapshot,
  WatchtowerWalletSnapshot
} from "@watchtower/core";
import {
  createDatabaseId,
  mapBalanceCandidatesToRecords,
  mapSnapshotToRecord,
  mapWalletSnapshotToRecord,
  mapWatchlistToRecord,
  mapWatchlistWalletsToRecords
} from "./schema-mapper";
import type {
  WatchtowerApiHealthRecord,
  WatchtowerEpochRecord,
  WatchtowerSnapshotRecord
} from "./schema";
import type {
  WatchtowerPersistedSnapshotBundle,
  WatchtowerSchemaStore
} from "./schema-store";

export type SnapshotPersistenceMode =
  | "save-only-safe"
  | "save-research-even-if-blocked";

export type PersistWatchlistResult = {
  ok: boolean;
  watchlistId: string;
  walletCount: number;
  errors: string[];
};

export type PersistSnapshotResult = {
  ok: boolean;
  saved: boolean;
  snapshotId: string;
  mode: SnapshotPersistenceMode;
  persistedSnapshot?: WatchtowerSnapshotRecord;
  reasons: string[];
  errors: string[];
};

export type PersistSnapshotInput = {
  store: WatchtowerSchemaStore;
  watchlistId: string;
  snapshot: WatchtowerSnapshot;
  mode?: SnapshotPersistenceMode;
  networkMode?: WatchtowerNetworkMode;
  addressMode?: WatchtowerAddressMode;
};

function strongestWalletDecoderConfidence(
  walletSnapshot: WatchtowerWalletSnapshot
): "confirmed" | "partial" | "unresolved" {
  if (walletSnapshot.balances.length === 0) {
    return "unresolved";
  }

  if (walletSnapshot.balances.every((balance) => balance.confidence === "confirmed")) {
    return "confirmed";
  }

  if (walletSnapshot.balances.some((balance) => balance.confidence === "partial")) {
    return "partial";
  }

  return "unresolved";
}

function buildApiHealthRecord(input: {
  snapshot: WatchtowerSnapshot;
  networkMode: WatchtowerNetworkMode;
  addressMode: WatchtowerAddressMode;
}): WatchtowerApiHealthRecord {
  const { snapshot, networkMode, addressMode } = input;
  const record: WatchtowerApiHealthRecord = {
    id: createDatabaseId("api_health"),
    checkedAt: snapshot.createdAt,
    networkMode,
    addressMode,
    endpointKind: "unknown",
    status: snapshot.apiTrust.status,
    reachable: snapshot.apiTrust.status !== "DOWN",
    reasons: snapshot.apiTrust.reasons
  };

  return record;
}

function buildEpochRecord(snapshot: WatchtowerSnapshot): WatchtowerEpochRecord | undefined {
  if (!snapshot.epoch) {
    return undefined;
  }

  const record: WatchtowerEpochRecord = {
    id: createDatabaseId("epoch"),
    checkedAt: snapshot.createdAt,
    source: snapshot.epoch.source,
    status: snapshot.epoch.status,
    statusReason: snapshot.epoch.statusReason,
    decoderStatus: "unresolved",
    matchedFieldPaths: []
  };

  if (snapshot.epoch.rootAddress) {
    record.rootAddress = snapshot.epoch.rootAddress;
  }

  if (snapshot.epoch.epochStartIso) {
    record.epochStartIso = snapshot.epoch.epochStartIso;
  }

  if (snapshot.epoch.epochEndIso) {
    record.epochEndIso = snapshot.epoch.epochEndIso;
  }

  if (snapshot.epoch.rewardLastTimeIso) {
    record.rewardLastTimeIso = snapshot.epoch.rewardLastTimeIso;
  }

  if (snapshot.epoch.rewardPeriodSeconds !== undefined && snapshot.epoch.rewardPeriodSeconds !== null) {
    record.rewardPeriodSeconds = snapshot.epoch.rewardPeriodSeconds;
  }

  return record;
}

function buildSnapshotBundle(input: {
  watchlistId: string;
  snapshot: WatchtowerSnapshot;
  networkMode: WatchtowerNetworkMode;
  addressMode: WatchtowerAddressMode;
}): WatchtowerPersistedSnapshotBundle {
  const apiHealth = buildApiHealthRecord(input);
  const epoch = buildEpochRecord(input.snapshot);

  const snapshotRecordInput: {
    snapshot: WatchtowerSnapshot;
    watchlistId: string;
    apiHealthId?: string;
    epochId?: string;
  } = {
    snapshot: input.snapshot,
    watchlistId: input.watchlistId,
    apiHealthId: apiHealth.id
  };

  if (epoch) {
    snapshotRecordInput.epochId = epoch.id;
  }

  const snapshotRecord = mapSnapshotToRecord(snapshotRecordInput);

  const walletSnapshots = input.snapshot.wallets.map((walletSnapshot) =>
    mapWalletSnapshotToRecord({
      snapshotId: input.snapshot.snapshotId,
      walletSnapshot,
      decoderConfidence: strongestWalletDecoderConfidence(walletSnapshot)
    })
  );

  const balanceCandidates = walletSnapshots.flatMap((walletSnapshotRecord, index) => {
    const sourceWalletSnapshot = input.snapshot.wallets[index];

    if (!sourceWalletSnapshot) {
      return [];
    }

    return mapBalanceCandidatesToRecords({
      walletSnapshotId: walletSnapshotRecord.id,
      walletSnapshot: sourceWalletSnapshot
    });
  });

  const bundle: WatchtowerPersistedSnapshotBundle = {
    snapshot: snapshotRecord,
    walletSnapshots,
    balanceCandidates,
    apiHealth
  };

  if (epoch) {
    bundle.epoch = epoch;
  }

  return bundle;
}

export function persistWatchlist(input: {
  store: WatchtowerSchemaStore;
  watchlist: Watchlist;
}): PersistWatchlistResult {
  const watchlistRecord = mapWatchlistToRecord(input.watchlist);
  const walletRecords = mapWatchlistWalletsToRecords(input.watchlist);

  input.store.saveWatchlist({
    watchlist: watchlistRecord,
    wallets: walletRecords
  });

  return {
    ok: true,
    watchlistId: watchlistRecord.id,
    walletCount: walletRecords.length,
    errors: []
  };
}

export function persistSnapshot(input: PersistSnapshotInput): PersistSnapshotResult {
  const mode = input.mode ?? "save-only-safe";
  const reasons: string[] = [];

  if (!input.snapshot.policyDecision.safeToSave && mode === "save-only-safe") {
    return {
      ok: true,
      saved: false,
      snapshotId: input.snapshot.snapshotId,
      mode,
      reasons: [
        "Snapshot was not saved because the snapshot policy marked it unsafe.",
        ...input.snapshot.policyDecision.reasons
      ],
      errors: []
    };
  }

  if (!input.snapshot.policyDecision.safeToSave && mode === "save-research-even-if-blocked") {
    reasons.push(
      "Snapshot was saved for research/history only even though policy marked it unsafe. Do not treat it as confirmed portfolio data."
    );
  }

  const bundle = buildSnapshotBundle({
    watchlistId: input.watchlistId,
    snapshot: input.snapshot,
    networkMode: input.networkMode ?? "mainnet",
    addressMode: input.addressMode ?? "hybrid"
  });

  const persistedSnapshot = input.store.saveSnapshotBundle(bundle);

  return {
    ok: true,
    saved: true,
    snapshotId: input.snapshot.snapshotId,
    mode,
    persistedSnapshot,
    reasons,
    errors: []
  };
}
