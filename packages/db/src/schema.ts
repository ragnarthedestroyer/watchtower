import type {
  ApiTrustStatus,
  EpochStatus,
  SnapshotDecisionMode,
  WatchtowerAddressMode,
  WatchtowerNetworkMode
} from "@watchtower/core";

export type DatabaseId = string;
export type IsoDateTime = string;

export type WatchtowerUserRecord = {
  id: DatabaseId;
  provider: "local" | "telegram" | "github" | "unknown";
  providerUserId?: string;
  displayName?: string;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
};

export type WatchtowerWatchlistRecord = {
  id: DatabaseId;
  ownerUserId: DatabaseId;
  name: string;
  description?: string;
  visibility: "private" | "shared_read_only" | "public";
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
};

export type WatchtowerWalletRecord = {
  id: DatabaseId;
  watchlistId: DatabaseId;
  label: string;
  enabled: boolean;
  identityScheme: "legacy" | "state_v2";
  legacyAddress?: string;
  dappId?: string;
  accountId?: string;
  notes?: string;
  tags: string[];
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
};

export type WatchtowerApiHealthRecord = {
  id: DatabaseId;
  checkedAt: IsoDateTime;
  networkMode: WatchtowerNetworkMode;
  addressMode: WatchtowerAddressMode;
  endpointKind: "graphql" | "rest" | "unknown";
  status: ApiTrustStatus;
  reachable: boolean;
  httpStatus?: number;
  responseMs?: number;
  reasons: string[];
};

export type WatchtowerEpochRecord = {
  id: DatabaseId;
  checkedAt: IsoDateTime;
  source: "mobile_verifiers_root";
  rootAddress?: string;
  status: EpochStatus;
  statusReason: string;
  decoderStatus: "confirmed" | "partial" | "unresolved";
  epochStartIso?: IsoDateTime;
  epochEndIso?: IsoDateTime;
  rewardLastTimeIso?: IsoDateTime;
  rewardPeriodSeconds?: number;
  matchedFieldPaths: string[];
};

export type WatchtowerSnapshotRecord = {
  id: DatabaseId;
  watchlistId: DatabaseId;
  createdAt: IsoDateTime;
  runtime: "web" | "telegram" | "server-job" | "manual";
  policyMode: SnapshotDecisionMode;
  safeToSave: boolean;
  policyReasons: string[];
  apiHealthId?: DatabaseId;
  epochId?: DatabaseId;
  walletCount: number;
  successfulWallets: number;
  partialWallets: number;
  failedWallets: number;
  skippedWallets: number;
};

export type WatchtowerWalletSnapshotRecord = {
  id: DatabaseId;
  snapshotId: DatabaseId;
  walletId: DatabaseId;
  status: "OK" | "PARTIAL" | "ERROR" | "SKIPPED";
  resolvedDisplayAddress?: string;
  resolvedLegacyAddress?: string;
  resolvedDappId?: string;
  resolvedAccountId?: string;
  accountClassification?: string;
  decoderConfidence: "confirmed" | "partial" | "unresolved";
  warnings: string[];
  errors: string[];
};

export type WatchtowerBalanceCandidateRecord = {
  id: DatabaseId;
  walletSnapshotId: DatabaseId;
  token: "NACKL" | "SHELL" | "USDC" | "UNKNOWN";
  amountRaw: string;
  decimals: number;
  source: string;
  confidence: "confirmed" | "partial" | "unresolved";
  evidencePath?: string;
  evidenceReason?: string;
};

export type WatchtowerRawInspectionRecord = {
  id: DatabaseId;
  walletId?: DatabaseId;
  address?: string;
  dappId?: string;
  accountId?: string;
  inspectedAt: IsoDateTime;
  accountFound: boolean;
  hasBoc: boolean;
  rawJson: unknown;
};
