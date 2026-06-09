import type { WatchtowerAccountIdentity } from "./identity";

export type WatchlistVisibility = "private" | "shared_read_only" | "public";

export type WatchlistWallet = {
  id: string;
  label: string;
  enabled: boolean;
  identity: WatchtowerAccountIdentity;

  notes?: string;
  tags?: string[];

  createdAt: string;
  updatedAt: string;
};

export type Watchlist = {
  id: string;
  ownerUserId: string;

  name: string;
  description?: string;

  visibility: WatchlistVisibility;

  wallets: WatchlistWallet[];

  createdAt: string;
  updatedAt: string;
};

export type WatchlistMutationResult = {
  ok: boolean;
  watchlist?: Watchlist;
  errors: string[];
};

export function addWalletToWatchlist(
  watchlist: Watchlist,
  wallet: WatchlistWallet
): WatchlistMutationResult {
  const exists = watchlist.wallets.some((item) => item.id === wallet.id);

  if (exists) {
    return {
      ok: false,
      errors: [`Wallet with id "${wallet.id}" already exists in this watchlist.`]
    };
  }

  return {
    ok: true,
    watchlist: {
      ...watchlist,
      wallets: [...watchlist.wallets, wallet],
      updatedAt: new Date().toISOString()
    },
    errors: []
  };
}

export function removeWalletFromWatchlist(
  watchlist: Watchlist,
  walletId: string
): WatchlistMutationResult {
  const nextWallets = watchlist.wallets.filter((wallet) => wallet.id !== walletId);

  if (nextWallets.length === watchlist.wallets.length) {
    return {
      ok: false,
      errors: [`Wallet with id "${walletId}" was not found in this watchlist.`]
    };
  }

  return {
    ok: true,
    watchlist: {
      ...watchlist,
      wallets: nextWallets,
      updatedAt: new Date().toISOString()
    },
    errors: []
  };
}

export function enabledWatchlistWallets(watchlist: Watchlist): WatchlistWallet[] {
  return watchlist.wallets.filter((wallet) => wallet.enabled);
}
