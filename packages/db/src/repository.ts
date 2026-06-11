import type {
  Watchlist,
  WatchtowerSnapshot
} from "@watchtower/core";

export type RepositoryResult<T> = {
  ok: boolean;
  data?: T;
  errors: string[];
};

export type WatchtowerRepository = {
  getWatchlistsForUser(userId: string): Promise<RepositoryResult<Watchlist[]>>;

  getWatchlistById(
    userId: string,
    watchlistId: string
  ): Promise<RepositoryResult<Watchlist | null>>;

  saveWatchlist(
    userId: string,
    watchlist: Watchlist
  ): Promise<RepositoryResult<Watchlist>>;

  deleteWatchlist(
    userId: string,
    watchlistId: string
  ): Promise<RepositoryResult<boolean>>;

  saveSnapshot(
    snapshot: WatchtowerSnapshot
  ): Promise<RepositoryResult<WatchtowerSnapshot>>;

  getLatestSnapshotForWatchlist(
    watchlistId: string
  ): Promise<RepositoryResult<WatchtowerSnapshot | null>>;
};
