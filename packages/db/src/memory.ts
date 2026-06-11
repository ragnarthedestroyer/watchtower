import type { Watchlist, WatchtowerSnapshot } from "@watchtower/core";
import type { RepositoryResult, WatchtowerRepository } from "./repository";

type MemoryRepositoryState = {
  watchlistsByUser: Map<string, Watchlist[]>;
  snapshotsByWatchlist: Map<string, WatchtowerSnapshot[]>;
};

export function createMemoryWatchtowerRepository(): WatchtowerRepository {
  const state: MemoryRepositoryState = {
    watchlistsByUser: new Map(),
    snapshotsByWatchlist: new Map()
  };

  function ok<T>(data: T): RepositoryResult<T> {
    return { ok: true, data, errors: [] };
  }

  function userWatchlists(userId: string): Watchlist[] {
    return state.watchlistsByUser.get(userId) ?? [];
  }

  return {
    async getWatchlistsForUser(userId) {
      return ok(userWatchlists(userId));
    },

    async getWatchlistById(userId, watchlistId) {
      const watchlist = userWatchlists(userId).find((item) => item.id === watchlistId) ?? null;
      return ok(watchlist);
    },

    async saveWatchlist(userId, watchlist) {
      const current = userWatchlists(userId);
      const existingIndex = current.findIndex((item) => item.id === watchlist.id);

      const next =
        existingIndex >= 0
          ? current.map((item) => (item.id === watchlist.id ? watchlist : item))
          : [...current, watchlist];

      state.watchlistsByUser.set(userId, next);
      return ok(watchlist);
    },

    async deleteWatchlist(userId, watchlistId) {
      const current = userWatchlists(userId);
      const next = current.filter((item) => item.id !== watchlistId);
      state.watchlistsByUser.set(userId, next);
      return ok(next.length !== current.length);
    },

    async saveSnapshot(snapshot) {
      const watchlistId = snapshot.snapshotId;
      const current = state.snapshotsByWatchlist.get(watchlistId) ?? [];
      state.snapshotsByWatchlist.set(watchlistId, [...current, snapshot]);
      return ok(snapshot);
    },

    async getLatestSnapshotForWatchlist(watchlistId) {
      const snapshots = state.snapshotsByWatchlist.get(watchlistId) ?? [];
      return ok(snapshots.at(-1) ?? null);
    }
  };
}
