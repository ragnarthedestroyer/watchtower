/**
 * Watchtower Batch 86 — DApp ID missing-state diagnostics foundation
 *
 * Converts a missing/unknown State V2 DApp ID into an explicit, actionable
 * diagnostic state for token movement history. This file is read-only and
 * does not fetch chain data, store wallet history, operate wallets, sign
 * messages, or guess the DApp ID.
 */

import type { AccountHistoryResponse } from "./transaction-history";

export type TokenMovementDappIdDiagnosticStatus =
  | "ready-for-state-v2-test"
  | "missing-dapp-id"
  | "invalid-dapp-id"
  | "invalid-account-id"
  | "legacy-probe-only"
  | "waiting-for-dev-confirmation";

export type TokenMovementDappIdInputKind =
  | "legacy-address"
  | "state-v2-account-id"
  | "multifactor-address"
  | "unknown";

export interface TokenMovementDappIdDiagnosticsInput {
  readonly legacyAddress?: string;
  readonly accountId?: string;
  readonly dappId?: string;
  readonly multifactorAddress?: string;
  readonly response?: AccountHistoryResponse | null;
  readonly routeBaseUrl?: string;
}

export interface TokenMovementDappIdDiagnostics {
  readonly status: TokenMovementDappIdDiagnosticStatus;
  readonly title: string;
  readonly summary: string;
  readonly inputKind: TokenMovementDappIdInputKind;
  readonly accountId: string | null;
  readonly dappId: string | null;
  readonly legacyAddress: string | null;
  readonly multifactorAddress: string | null;
  readonly multifactorLooksLikeAddress: boolean;
  readonly canAttemptStateV2: boolean;
  readonly legacyProbeObserved: boolean;
  readonly legacyApiDisabledObserved: boolean;
  readonly accountTransactionsUnavailableObserved: boolean;
  readonly stateV2Curl: string | null;
  readonly legacyProbeCurl: string | null;
  readonly blockers: readonly string[];
  readonly nextSteps: readonly string[];
  readonly safetyNotes: readonly string[];
}

const HEX_64_PATTERN = /^[0-9a-f]{64}$/;
const LEGACY_ADDRESS_PATTERN = /^0:[0-9a-f]{64}$/;
const DEFAULT_LOCAL_ROUTE_BASE_URL = "http://localhost:8787";

export function createTokenMovementDappIdDiagnostics(
  input: TokenMovementDappIdDiagnosticsInput = {},
): TokenMovementDappIdDiagnostics {
  const legacyAddress = normalizeLegacyAddress(input.legacyAddress);
  const explicitAccountId = normalizeHex64(input.accountId);
  const extractedAccountId = explicitAccountId ?? extractAccountIdFromLegacyAddress(legacyAddress);
  const normalizedDappId = normalizeHex64(input.dappId);
  const rawDappId = normalizeTrimmed(input.dappId);
  const multifactorAddress = normalizeLegacyAddress(input.multifactorAddress);
  const responseWarnings = input.response?.warnings ?? [];
  const legacyApiDisabledObserved = responseWarnings.some((warning) => warning.toLowerCase().includes("deprecated api is disabled"));
  const accountTransactionsUnavailableObserved = responseWarnings.some((warning) => warning.toLowerCase().includes("does not expose a transactions field"));
  const legacyProbeObserved = legacyApiDisabledObserved
    || accountTransactionsUnavailableObserved
    || responseWarnings.some((warning) => warning.toLowerCase().includes("legacy 0:<address> history"));
  const invalidDappId = rawDappId !== null && normalizedDappId === null;
  const invalidAccountId = !extractedAccountId && Boolean(normalizeTrimmed(input.accountId) ?? legacyAddress);
  const canAttemptStateV2 = Boolean(extractedAccountId && normalizedDappId);
  const inputKind = classifyInputKind({
    legacyAddress,
    explicitAccountId,
    multifactorAddress,
  });

  const status = classifyDiagnosticsStatus({
    canAttemptStateV2,
    invalidDappId,
    invalidAccountId,
    legacyAddress,
    legacyProbeObserved,
    extractedAccountId,
  });
  const routeBaseUrl = normalizeRouteBaseUrl(input.routeBaseUrl);

  return {
    status,
    title: titleForStatus(status),
    summary: summaryForStatus(status),
    inputKind,
    accountId: extractedAccountId,
    dappId: normalizedDappId,
    legacyAddress,
    multifactorAddress,
    multifactorLooksLikeAddress: Boolean(multifactorAddress),
    canAttemptStateV2,
    legacyProbeObserved,
    legacyApiDisabledObserved,
    accountTransactionsUnavailableObserved,
    stateV2Curl: createStateV2Curl({ routeBaseUrl, accountId: extractedAccountId, dappId: normalizedDappId }),
    legacyProbeCurl: createLegacyProbeCurl({ routeBaseUrl, legacyAddress }),
    blockers: createBlockers({
      status,
      rawDappId,
      extractedAccountId,
      multifactorAddress,
      legacyApiDisabledObserved,
      accountTransactionsUnavailableObserved,
    }),
    nextSteps: createNextSteps({
      status,
      extractedAccountId,
      normalizedDappId,
      multifactorAddress,
    }),
    safetyNotes: [
      "Watchtower must not guess or derive a DApp ID from a wallet address, account ID, or multifactor address without evidence.",
      "The multifactor address is useful public evidence, but it is not automatically the State V2 dapp_id.",
      "This diagnostic is read-only and on-the-fly; it does not store searched addresses or transaction history.",
    ],
  };
}

export function extractAccountIdFromLegacyAddress(address: string | null | undefined): string | null {
  const normalized = normalizeLegacyAddress(address);
  if (!normalized) return null;
  return normalized.slice(2);
}

export function isWatchtowerHex64(value: string | null | undefined): boolean {
  const normalized = normalizeTrimmed(value);
  return Boolean(normalized && HEX_64_PATTERN.test(normalized));
}

function classifyInputKind(input: {
  readonly legacyAddress: string | null;
  readonly explicitAccountId: string | null;
  readonly multifactorAddress: string | null;
}): TokenMovementDappIdInputKind {
  if (input.explicitAccountId) return "state-v2-account-id";
  if (input.legacyAddress) return "legacy-address";
  if (input.multifactorAddress) return "multifactor-address";
  return "unknown";
}

function classifyDiagnosticsStatus(input: {
  readonly canAttemptStateV2: boolean;
  readonly invalidDappId: boolean;
  readonly invalidAccountId: boolean;
  readonly legacyAddress: string | null;
  readonly legacyProbeObserved: boolean;
  readonly extractedAccountId: string | null;
}): TokenMovementDappIdDiagnosticStatus {
  if (input.canAttemptStateV2) return "ready-for-state-v2-test";
  if (input.invalidDappId) return "invalid-dapp-id";
  if (input.invalidAccountId) return "invalid-account-id";
  if (input.extractedAccountId && input.legacyProbeObserved) return "missing-dapp-id";
  if (input.legacyAddress) return "legacy-probe-only";
  return "waiting-for-dev-confirmation";
}

function titleForStatus(status: TokenMovementDappIdDiagnosticStatus): string {
  switch (status) {
    case "ready-for-state-v2-test":
      return "Ready for State V2 live-history test";
    case "missing-dapp-id":
      return "Blocked by missing DApp ID";
    case "invalid-dapp-id":
      return "DApp ID format is invalid";
    case "invalid-account-id":
      return "Account ID format is invalid";
    case "legacy-probe-only":
      return "Legacy probe only";
    case "waiting-for-dev-confirmation":
      return "Waiting for DApp ID confirmation";
  }
}

function summaryForStatus(status: TokenMovementDappIdDiagnosticStatus): string {
  switch (status) {
    case "ready-for-state-v2-test":
      return "A 64-hex account_id and a 64-hex dapp_id are available. Watchtower can attempt the State V2 history route.";
    case "missing-dapp-id":
      return "The account_id is known, but live transaction history is blocked until the real State V2 dapp_id is known.";
    case "invalid-dapp-id":
      return "The provided dapp_id is not exactly 64 lowercase hex characters.";
    case "invalid-account-id":
      return "The provided account value is not a valid 0:<64hex> legacy address or 64-hex account_id.";
    case "legacy-probe-only":
      return "Watchtower can probe the legacy address, but this upstream path appears deprecated or incomplete for transaction history.";
    case "waiting-for-dev-confirmation":
      return "Provide a legacy address or State V2 account_id, then add the real dapp_id once Acki Nacki exposes or confirms it.";
  }
}

function createBlockers(input: {
  readonly status: TokenMovementDappIdDiagnosticStatus;
  readonly rawDappId: string | null;
  readonly extractedAccountId: string | null;
  readonly multifactorAddress: string | null;
  readonly legacyApiDisabledObserved: boolean;
  readonly accountTransactionsUnavailableObserved: boolean;
}): readonly string[] {
  const blockers: string[] = [];

  if (!input.extractedAccountId) {
    blockers.push("No valid account_id is available yet. Use 0:<64hex> or account_id=<64hex>.");
  }

  if (input.status === "missing-dapp-id" || input.status === "legacy-probe-only" || input.status === "waiting-for-dev-confirmation") {
    blockers.push("The real State V2 dapp_id is not available from the current inputs.");
  }

  if (input.rawDappId !== null && !HEX_64_PATTERN.test(input.rawDappId)) {
    blockers.push("The entered dapp_id is not 64 lowercase hex characters.");
  }

  if (input.multifactorAddress) {
    blockers.push("A multifactor address was provided, but that public address is not enough to prove the dapp_id.");
  }

  if (input.legacyApiDisabledObserved) {
    blockers.push("The upstream legacy API reported that the deprecated API is disabled.");
  }

  if (input.accountTransactionsUnavailableObserved) {
    blockers.push("The root account query does not expose a transactions field on this endpoint.");
  }

  return blockers;
}

function createNextSteps(input: {
  readonly status: TokenMovementDappIdDiagnosticStatus;
  readonly extractedAccountId: string | null;
  readonly normalizedDappId: string | null;
  readonly multifactorAddress: string | null;
}): readonly string[] {
  if (input.status === "ready-for-state-v2-test") {
    return [
      "Run the generated State V2 curl command and inspect the returned warnings before treating rows as movement evidence.",
      "Keep include_raw_payloads disabled unless raw bodies are needed for a focused decoder test.",
    ];
  }

  const steps = [
    "Keep the account_id extracted from the 0:<64hex> address; it is already useful for State V2 requests.",
    "Ask Acki Nacki devs where the production dapp_id is exposed for the wallet/multifactor namespace.",
    "Check wallet developer mode and network requests for labels such as DAPP ID, dapp_id, or app_dapp_id.",
  ];

  if (input.multifactorAddress) {
    steps.push("Keep the multifactor address as context for the dev question, but do not use it as dapp_id without confirmation.");
  }

  if (input.extractedAccountId && !input.normalizedDappId) {
    steps.push("Once a real 64-hex dapp_id is available, paste it into the State V2 field and retry live raw history.");
  }

  return steps;
}

function createStateV2Curl(input: {
  readonly routeBaseUrl: string;
  readonly accountId: string | null;
  readonly dappId: string | null;
}): string | null {
  if (!input.accountId) return null;
  const dappId = input.dappId ?? "PASTE_REAL_64_HEX_DAPP_ID_HERE";
  return `curl -i "${input.routeBaseUrl}/api/token-movements/live-raw-history?account_id=${input.accountId}&dapp_id=${dappId}&limit=25"`;
}

function createLegacyProbeCurl(input: {
  readonly routeBaseUrl: string;
  readonly legacyAddress: string | null;
}): string | null {
  if (!input.legacyAddress) return null;
  return `curl -i "${input.routeBaseUrl}/api/token-movements/live-raw-history?address=${input.legacyAddress}&limit=25"`;
}

function normalizeTrimmed(value: string | null | undefined): string | null {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeHex64(value: string | null | undefined): string | null {
  const normalized = normalizeTrimmed(value);
  if (!normalized) return null;
  return HEX_64_PATTERN.test(normalized) ? normalized : null;
}

function normalizeLegacyAddress(value: string | null | undefined): string | null {
  const normalized = normalizeTrimmed(value);
  if (!normalized) return null;
  return LEGACY_ADDRESS_PATTERN.test(normalized) ? normalized : null;
}

function normalizeRouteBaseUrl(value: string | null | undefined): string {
  const normalized = normalizeTrimmed(value);
  if (!normalized) return DEFAULT_LOCAL_ROUTE_BASE_URL;
  return normalized.endsWith("/") ? normalized.slice(0, -1) : normalized;
}
