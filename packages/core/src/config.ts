export type WatchtowerNetworkMode = "mainnet" | "shellnet" | "custom";

export type WatchtowerAddressMode = "legacy" | "state_v2" | "hybrid";

export type WatchtowerApiConfig = {
  networkMode: WatchtowerNetworkMode;

  graphqlEndpoint?: string;
  restEndpoint?: string;

  addressMode: WatchtowerAddressMode;

  requestDelayMs: number;
  requestTimeoutMs: number;
  maxRetries: number;

  stopOnRateLimit: boolean;
  stopOnCloudflareOutage: boolean;
};

export type WatchtowerSnapshotPolicyConfig = {
  minSuccessfulWalletRatio: number;
  blockAllZeroSnapshots: boolean;
  maxMvRootStatusAgeMinutes: number;
  allowExpiredEpochGraceMinutes: number;
  requireConfirmedDecoderConfidence: boolean;
};

export type WatchtowerPublicConfig = {
  appName: "Acki Watchtower";
  appSlug: "acki-watchtower";

  api: WatchtowerApiConfig;
  snapshotPolicy: WatchtowerSnapshotPolicyConfig;
};

export const DEFAULT_WATCHTOWER_CONFIG: WatchtowerPublicConfig = {
  appName: "Acki Watchtower",
  appSlug: "acki-watchtower",

  api: {
    networkMode: "mainnet",
    addressMode: "hybrid",

    requestDelayMs: 2500,
    requestTimeoutMs: 10000,
    maxRetries: 2,

    stopOnRateLimit: true,
    stopOnCloudflareOutage: true
  },

  snapshotPolicy: {
    minSuccessfulWalletRatio: 0.8,
    blockAllZeroSnapshots: true,
    maxMvRootStatusAgeMinutes: 30,
    allowExpiredEpochGraceMinutes: 20,
    requireConfirmedDecoderConfidence: true
  }
};
