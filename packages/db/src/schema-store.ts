import type {
  DatabaseId,
  WatchtowerApiHealthRecord,
  WatchtowerBalanceCandidateRecord,
  WatchtowerEpochRecord,
  WatchtowerRawInspectionRecord,
  WatchtowerSnapshotRecord,
  WatchtowerUserRecord,
  WatchtowerWalletRecord,
  WatchtowerWalletSnapshotRecord,
  WatchtowerWatchlistRecord
} from "./schema";

export type WatchtowerPersistedSnapshotBundle = {
  snapshot: WatchtowerSnapshotRecord;
  walletSnapshots: WatchtowerWalletSnapshotRecord[];
  balanceCandidates: WatchtowerBalanceCandidateRecord[];
  apiHealth?: WatchtowerApiHealthRecord;
  epoch?: WatchtowerEpochRecord;
};

export type WatchtowerSchemaStoreState = {
  users: WatchtowerUserRecord[];
  watchlists: WatchtowerWatchlistRecord[];
  wallets: WatchtowerWalletRecord[];
  apiHealthChecks: WatchtowerApiHealthRecord[];
  epochs: WatchtowerEpochRecord[];
  snapshots: WatchtowerSnapshotRecord[];
  walletSnapshots: WatchtowerWalletSnapshotRecord[];
  balanceCandidates: WatchtowerBalanceCandidateRecord[];
  rawInspections: WatchtowerRawInspectionRecord[];
};

export type WatchtowerSchemaStore = {
  getState(): WatchtowerSchemaStoreState;

  saveUser(user: WatchtowerUserRecord): WatchtowerUserRecord;
  getUserById(userId: DatabaseId): WatchtowerUserRecord | null;

  saveWatchlist(input: {
    watchlist: WatchtowerWatchlistRecord;
    wallets: WatchtowerWalletRecord[];
  }): WatchtowerWatchlistRecord;

  listWatchlistsForUser(ownerUserId: DatabaseId): WatchtowerWatchlistRecord[];
  listWalletsForWatchlist(watchlistId: DatabaseId): WatchtowerWalletRecord[];

  deleteWatchlist(watchlistId: DatabaseId): boolean;

  saveSnapshotBundle(bundle: WatchtowerPersistedSnapshotBundle): WatchtowerSnapshotRecord;
  getLatestSnapshotForWatchlist(watchlistId: DatabaseId): WatchtowerSnapshotRecord | null;
  listWalletSnapshots(snapshotId: DatabaseId): WatchtowerWalletSnapshotRecord[];
  listBalanceCandidates(walletSnapshotId: DatabaseId): WatchtowerBalanceCandidateRecord[];

  saveRawInspection(record: WatchtowerRawInspectionRecord): WatchtowerRawInspectionRecord;
  listRawInspectionsForWallet(walletId: DatabaseId): WatchtowerRawInspectionRecord[];
};

function replaceById<T extends { id: DatabaseId }>(items: T[], record: T): T[] {
  const exists = items.some((item) => item.id === record.id);

  if (!exists) {
    return [...items, record];
  }

  return items.map((item) => (item.id === record.id ? record : item));
}

function sortNewestFirst<T extends { createdAt?: string; checkedAt?: string; inspectedAt?: string }>(
  items: T[]
): T[] {
  return [...items].sort((a, b) => {
    const aDate = a.createdAt ?? a.checkedAt ?? a.inspectedAt ?? "";
    const bDate = b.createdAt ?? b.checkedAt ?? b.inspectedAt ?? "";
    return bDate.localeCompare(aDate);
  });
}

export function createEmptySchemaStoreState(): WatchtowerSchemaStoreState {
  return {
    users: [],
    watchlists: [],
    wallets: [],
    apiHealthChecks: [],
    epochs: [],
    snapshots: [],
    walletSnapshots: [],
    balanceCandidates: [],
    rawInspections: []
  };
}

export function createInMemorySchemaStore(
  initialState: WatchtowerSchemaStoreState = createEmptySchemaStoreState()
): WatchtowerSchemaStore {
  const state: WatchtowerSchemaStoreState = {
    users: [...initialState.users],
    watchlists: [...initialState.watchlists],
    wallets: [...initialState.wallets],
    apiHealthChecks: [...initialState.apiHealthChecks],
    epochs: [...initialState.epochs],
    snapshots: [...initialState.snapshots],
    walletSnapshots: [...initialState.walletSnapshots],
    balanceCandidates: [...initialState.balanceCandidates],
    rawInspections: [...initialState.rawInspections]
  };

  return {
    getState() {
      return {
        users: [...state.users],
        watchlists: [...state.watchlists],
        wallets: [...state.wallets],
        apiHealthChecks: [...state.apiHealthChecks],
        epochs: [...state.epochs],
        snapshots: [...state.snapshots],
        walletSnapshots: [...state.walletSnapshots],
        balanceCandidates: [...state.balanceCandidates],
        rawInspections: [...state.rawInspections]
      };
    },

    saveUser(user) {
      state.users = replaceById(state.users, user);
      return user;
    },

    getUserById(userId) {
      return state.users.find((user) => user.id === userId) ?? null;
    },

    saveWatchlist(input) {
      state.watchlists = replaceById(state.watchlists, input.watchlist);

      const otherWallets = state.wallets.filter(
        (wallet) => wallet.watchlistId !== input.watchlist.id
      );
      state.wallets = [...otherWallets, ...input.wallets];

      return input.watchlist;
    },

    listWatchlistsForUser(ownerUserId) {
      return state.watchlists.filter((watchlist) => watchlist.ownerUserId === ownerUserId);
    },

    listWalletsForWatchlist(watchlistId) {
      return state.wallets.filter((wallet) => wallet.watchlistId === watchlistId);
    },

    deleteWatchlist(watchlistId) {
      const beforeCount = state.watchlists.length;

      state.watchlists = state.watchlists.filter((watchlist) => watchlist.id !== watchlistId);
      state.wallets = state.wallets.filter((wallet) => wallet.watchlistId !== watchlistId);
      state.snapshots = state.snapshots.filter((snapshot) => snapshot.watchlistId !== watchlistId);

      const snapshotIds = new Set(state.snapshots.map((snapshot) => snapshot.id));
      state.walletSnapshots = state.walletSnapshots.filter((walletSnapshot) =>
        snapshotIds.has(walletSnapshot.snapshotId)
      );

      const walletSnapshotIds = new Set(
        state.walletSnapshots.map((walletSnapshot) => walletSnapshot.id)
      );
      state.balanceCandidates = state.balanceCandidates.filter((candidate) =>
        walletSnapshotIds.has(candidate.walletSnapshotId)
      );

      return state.watchlists.length !== beforeCount;
    },

    saveSnapshotBundle(bundle) {
      state.snapshots = replaceById(state.snapshots, bundle.snapshot);

      state.walletSnapshots = [
        ...state.walletSnapshots.filter(
          (walletSnapshot) => walletSnapshot.snapshotId !== bundle.snapshot.id
        ),
        ...bundle.walletSnapshots
      ];

      const walletSnapshotIds = new Set(bundle.walletSnapshots.map((record) => record.id));
      state.balanceCandidates = [
        ...state.balanceCandidates.filter(
          (candidate) => !walletSnapshotIds.has(candidate.walletSnapshotId)
        ),
        ...bundle.balanceCandidates
      ];

      if (bundle.apiHealth) {
        state.apiHealthChecks = replaceById(state.apiHealthChecks, bundle.apiHealth);
      }

      if (bundle.epoch) {
        state.epochs = replaceById(state.epochs, bundle.epoch);
      }

      return bundle.snapshot;
    },

    getLatestSnapshotForWatchlist(watchlistId) {
      const snapshots = state.snapshots.filter(
        (snapshot) => snapshot.watchlistId === watchlistId
      );

      return sortNewestFirst(snapshots)[0] ?? null;
    },

    listWalletSnapshots(snapshotId) {
      return state.walletSnapshots.filter(
        (walletSnapshot) => walletSnapshot.snapshotId === snapshotId
      );
    },

    listBalanceCandidates(walletSnapshotId) {
      return state.balanceCandidates.filter(
        (candidate) => candidate.walletSnapshotId === walletSnapshotId
      );
    },

    saveRawInspection(record) {
      state.rawInspections = replaceById(state.rawInspections, record);
      return record;
    },

    listRawInspectionsForWallet(walletId) {
      return sortNewestFirst(
        state.rawInspections.filter((inspection) => inspection.walletId === walletId)
      );
    }
  };
}
