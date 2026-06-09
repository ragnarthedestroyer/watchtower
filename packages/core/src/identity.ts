export type LegacyAccountIdentity = {
  scheme: "legacy";
  legacyAddress: string;
};

export type StateV2AccountIdentity = {
  scheme: "state_v2";
  dappId: string;
  accountId: string;
};

export type WatchtowerAccountIdentity =
  | LegacyAccountIdentity
  | StateV2AccountIdentity;

export type WatchtowerWallet = {
  id: string;
  label: string;
  enabled: boolean;
  identity: WatchtowerAccountIdentity;
};

export type ResolvedWatchtowerAccount = {
  walletId: string;
  label: string;
  identityScheme: WatchtowerAccountIdentity["scheme"];
  displayAddress: string;
  legacyAddress?: string;
  dappId?: string;
  accountId?: string;
  resolvedAt: string;
  resolverVersion: string;
};

export function formatAccountIdentity(identity: WatchtowerAccountIdentity): string {
  if (identity.scheme === "legacy") {
    return identity.legacyAddress;
  }

  return `${identity.dappId}::${identity.accountId}`;
}

export function isLegacyAccountIdentity(
  identity: WatchtowerAccountIdentity
): identity is LegacyAccountIdentity {
  return identity.scheme === "legacy";
}

export function isStateV2AccountIdentity(
  identity: WatchtowerAccountIdentity
): identity is StateV2AccountIdentity {
  return identity.scheme === "state_v2";
}
