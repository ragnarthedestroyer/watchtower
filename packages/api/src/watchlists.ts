import type { Watchlist } from "@watchtower/core";
import type { WatchtowerRepository } from "@watchtower/db";
import type { ApiResponse, CreateWatchlistRequest, WatchlistsResponse } from "./types";

export type CreateWatchlistInput = {
  userId: string;
  request: CreateWatchlistRequest;
  repository: WatchtowerRepository;
};

export type ListWatchlistsInput = {
  userId: string;
  repository: WatchtowerRepository;
};

function createId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function listWatchlists(
  input: ListWatchlistsInput
): Promise<ApiResponse<WatchlistsResponse>> {
  const result = await input.repository.getWatchlistsForUser(input.userId);

  if (!result.ok || !result.data) {
    return {
      ok: false,
      errors: result.errors.length > 0 ? result.errors : ["Failed to load watchlists."]
    };
  }

  return {
    ok: true,
    data: {
      watchlists: result.data
    },
    errors: []
  };
}

export async function createWatchlist(
  input: CreateWatchlistInput
): Promise<ApiResponse<Watchlist>> {
  const name = input.request.name.trim();

  if (!name) {
    return {
      ok: false,
      errors: ["Watchlist name is required."]
    };
  }

  const now = new Date().toISOString();

  const description = input.request.description?.trim();

  const watchlist: Watchlist = {
    id: createId("watchlist"),
    ownerUserId: input.userId,
    name,
    ...(description ? { description } : {}),
    visibility: "private",
    wallets: [],
    createdAt: now,
    updatedAt: now
  };

  const result = await input.repository.saveWatchlist(input.userId, watchlist);

  if (!result.ok || !result.data) {
    return {
      ok: false,
      errors: result.errors.length > 0 ? result.errors : ["Failed to save watchlist."]
    };
  }

  return {
    ok: true,
    data: result.data,
    errors: []
  };
}
