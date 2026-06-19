/**
 * Watchtower Batch 62 — Token Movement API Contract Foundation
 *
 * Read-only request/response contracts for exposing token movement history,
 * evidence, export and incident-review data through a future server route layer.
 *
 * This file intentionally does not perform network reads, decoding, signing,
 * wallet operations, trading, custody, PrivateNote operations, or persistence.
 */

import type { TokenMovement } from "./token-movement";
import type { TokenMovementQuery, TokenMovementQueryResult } from "./token-movement-query";
import type { TokenMovementEvidenceBundle } from "./token-movement-evidence-bundle";
import type {
  TokenMovementExportBundle,
  TokenMovementExportFormat,
  TokenMovementExportScope,
} from "./token-movement-export";
import type { IncidentTracingReport } from "./incident-tracing-report";

export type TokenMovementApiRouteId =
  | "token-movements.query"
  | "token-movements.history"
  | "token-movements.evidence"
  | "token-movements.export"
  | "token-movements.incident-report";

export type TokenMovementApiHttpMethod = "GET" | "POST";

export type TokenMovementApiRiskLevel = "safe-read-only" | "review-required" | "blocked";

export interface TokenMovementApiRouteDescriptor {
  readonly id: TokenMovementApiRouteId;
  readonly method: TokenMovementApiHttpMethod;
  readonly path: string;
  readonly purpose: string;
  readonly riskLevel: TokenMovementApiRiskLevel;
  readonly requiresLiveRead: boolean;
  readonly acceptsPrivateKeys: false;
  readonly signsTransactions: false;
  readonly notes: readonly string[];
}

export interface TokenMovementApiSafetyPolicy {
  readonly readOnly: true;
  readonly acceptsSeedPhrases: false;
  readonly acceptsPrivateKeys: false;
  readonly signsTransactions: false;
  readonly broadcastsMessages: false;
  readonly offersCustody: false;
  readonly unresolvedRowsAreProof: false;
  readonly notes: readonly string[];
}

export interface TokenMovementApiSubject {
  readonly address: string | null;
  readonly dappId: string | null;
  readonly accountId: string | null;
  readonly label: string | null;
}

export interface TokenMovementApiPage {
  readonly limit: number;
  readonly offset: number;
  readonly totalBeforePagination: number;
  readonly returned: number;
}

export interface TokenMovementQueryApiRequest {
  readonly subject: TokenMovementApiSubject;
  readonly query: TokenMovementQuery;
  readonly includeEvidence: boolean;
  readonly includeRawReferences: boolean;
}

export interface TokenMovementHistoryApiPayload {
  readonly subject: TokenMovementApiSubject;
  readonly movements: readonly TokenMovement[];
  readonly page: TokenMovementApiPage;
  readonly warnings: readonly string[];
}

export interface TokenMovementQueryApiPayload {
  readonly subject: TokenMovementApiSubject;
  readonly result: TokenMovementQueryResult;
}

export interface TokenMovementEvidenceApiPayload {
  readonly subject: TokenMovementApiSubject;
  readonly movementId: string;
  readonly bundle: TokenMovementEvidenceBundle;
}

export interface TokenMovementExportApiRequest {
  readonly subject: TokenMovementApiSubject;
  readonly scope: TokenMovementExportScope;
  readonly format: TokenMovementExportFormat;
  readonly query: TokenMovementQuery;
}

export interface TokenMovementExportApiPayload {
  readonly subject: TokenMovementApiSubject;
  readonly format: TokenMovementExportFormat;
  readonly bundle: TokenMovementExportBundle;
  readonly rendered: string;
}

export interface TokenMovementIncidentReportApiPayload {
  readonly subject: TokenMovementApiSubject;
  readonly report: IncidentTracingReport;
}

export interface TokenMovementApiSuccess<TPayload> {
  readonly ok: true;
  readonly generatedAt: string;
  readonly safety: TokenMovementApiSafetyPolicy;
  readonly payload: TPayload;
  readonly warnings: readonly string[];
}

export interface TokenMovementApiError {
  readonly ok: false;
  readonly generatedAt: string;
  readonly safety: TokenMovementApiSafetyPolicy;
  readonly code: TokenMovementApiErrorCode;
  readonly message: string;
  readonly details: readonly string[];
}

export type TokenMovementApiErrorCode =
  | "invalid-request"
  | "missing-subject"
  | "live-read-unavailable"
  | "decoder-unavailable"
  | "unsafe-operation-blocked"
  | "not-found"
  | "unknown";

export type TokenMovementApiResponse<TPayload> = TokenMovementApiSuccess<TPayload> | TokenMovementApiError;

export interface TokenMovementApiResponseOptions {
  readonly generatedAt?: string;
  readonly warnings?: readonly string[];
  readonly safety?: TokenMovementApiSafetyPolicy;
}

export interface TokenMovementApiErrorOptions {
  readonly generatedAt?: string;
  readonly details?: readonly string[];
  readonly safety?: TokenMovementApiSafetyPolicy;
}

export interface TokenMovementApiContractPlan {
  readonly title: string;
  readonly generatedAt: string;
  readonly routes: readonly TokenMovementApiRouteDescriptor[];
  readonly safety: TokenMovementApiSafetyPolicy;
  readonly dataDependencies: readonly string[];
  readonly nextImplementationSteps: readonly string[];
}

export const TOKEN_MOVEMENT_API_SAFETY_POLICY: TokenMovementApiSafetyPolicy = {
  readOnly: true,
  acceptsSeedPhrases: false,
  acceptsPrivateKeys: false,
  signsTransactions: false,
  broadcastsMessages: false,
  offersCustody: false,
  unresolvedRowsAreProof: false,
  notes: [
    "Token movement API routes must be read-only.",
    "The API must never ask for seed phrases, private keys, signer payloads, or custody permissions.",
    "Candidate, partial, or unresolved movement rows must remain clearly marked as unproven.",
  ],
};

export const TOKEN_MOVEMENT_API_ROUTES: readonly TokenMovementApiRouteDescriptor[] = [
  {
    id: "token-movements.query",
    method: "POST",
    path: "/api/token-movements/query",
    purpose: "Apply token movement filters and return conservative movement candidates.",
    riskLevel: "safe-read-only",
    requiresLiveRead: false,
    acceptsPrivateKeys: false,
    signsTransactions: false,
    notes: ["Consumes already observed or demo movement records; does not fetch chain data by itself."],
  },
  {
    id: "token-movements.history",
    method: "GET",
    path: "/api/token-movements/history",
    purpose: "Return movement history for a watched subject once a reader is connected.",
    riskLevel: "review-required",
    requiresLiveRead: true,
    acceptsPrivateKeys: false,
    signsTransactions: false,
    notes: ["Must return partial/unknown status when history exists but token decoding is incomplete."],
  },
  {
    id: "token-movements.evidence",
    method: "GET",
    path: "/api/token-movements/:movementId/evidence",
    purpose: "Return the evidence bundle for a single movement candidate.",
    riskLevel: "safe-read-only",
    requiresLiveRead: false,
    acceptsPrivateKeys: false,
    signsTransactions: false,
    notes: ["Evidence bundles explain what is known, missing, inferred, or unresolved."],
  },
  {
    id: "token-movements.export",
    method: "POST",
    path: "/api/token-movements/export",
    purpose: "Build JSON, CSV, or Markdown exports from movement candidates and evidence.",
    riskLevel: "safe-read-only",
    requiresLiveRead: false,
    acceptsPrivateKeys: false,
    signsTransactions: false,
    notes: ["Exports are reporting artifacts only; they must not be treated as wallet or transaction tools."],
  },
  {
    id: "token-movements.incident-report",
    method: "GET",
    path: "/api/token-movements/incident-report",
    purpose: "Return a read-only incident report for accumulator, bridge, SHELL, or USDC tracing.",
    riskLevel: "review-required",
    requiresLiveRead: false,
    acceptsPrivateKeys: false,
    signsTransactions: false,
    notes: ["Incident reports must separate observed facts from suspected accumulator or bridge links."],
  },
];

export function createTokenMovementApiSubject(input: Partial<TokenMovementApiSubject> = {}): TokenMovementApiSubject {
  return {
    address: normalizeNullableText(input.address),
    dappId: normalizeNullableText(input.dappId),
    accountId: normalizeNullableText(input.accountId),
    label: normalizeNullableText(input.label),
  };
}

export function tokenMovementApiSubjectIsUsable(subject: TokenMovementApiSubject): boolean {
  return Boolean(subject.address || (subject.dappId && subject.accountId));
}

export function createTokenMovementApiSuccess<TPayload>(
  payload: TPayload,
  options: TokenMovementApiResponseOptions = {},
): TokenMovementApiSuccess<TPayload> {
  return {
    ok: true,
    generatedAt: options.generatedAt ?? new Date(0).toISOString(),
    safety: options.safety ?? TOKEN_MOVEMENT_API_SAFETY_POLICY,
    payload,
    warnings: options.warnings ?? [],
  };
}

export function createTokenMovementApiError(
  code: TokenMovementApiErrorCode,
  message: string,
  options: TokenMovementApiErrorOptions = {},
): TokenMovementApiError {
  return {
    ok: false,
    generatedAt: options.generatedAt ?? new Date(0).toISOString(),
    safety: options.safety ?? TOKEN_MOVEMENT_API_SAFETY_POLICY,
    code,
    message,
    details: options.details ?? [],
  };
}

export function getTokenMovementApiRoute(id: TokenMovementApiRouteId): TokenMovementApiRouteDescriptor {
  const route = TOKEN_MOVEMENT_API_ROUTES.find((item) => item.id === id);
  if (!route) {
    return {
      id,
      method: "GET",
      path: "/api/token-movements/unknown",
      purpose: "Unknown token movement API route.",
      riskLevel: "blocked",
      requiresLiveRead: false,
      acceptsPrivateKeys: false,
      signsTransactions: false,
      notes: ["Unknown API route id. Do not expose this route until it is explicitly designed."],
    };
  }
  return route;
}

export function createTokenMovementApiPage(input: Partial<TokenMovementApiPage> = {}): TokenMovementApiPage {
  const totalBeforePagination = normalizeCount(input.totalBeforePagination);
  const returned = normalizeCount(input.returned);
  return {
    limit: normalizeCount(input.limit, 25),
    offset: normalizeCount(input.offset),
    totalBeforePagination,
    returned,
  };
}

export function createTokenMovementApiContractPlan(generatedAt = new Date(0).toISOString()): TokenMovementApiContractPlan {
  return {
    title: "Watchtower token movement API contract foundation",
    generatedAt,
    routes: TOKEN_MOVEMENT_API_ROUTES,
    safety: TOKEN_MOVEMENT_API_SAFETY_POLICY,
    dataDependencies: [
      "Batch 51 TokenMovement model",
      "Batch 52 known contract labels",
      "Batch 53 transaction/message observations",
      "Batch 54 movement normalizer",
      "Batch 59 query layer",
      "Batch 60 evidence bundles",
      "Batch 61 export layer",
    ],
    nextImplementationSteps: [
      "Connect these contracts to server route handlers without enabling writes.",
      "Return deterministic demo payloads before enabling live history reads.",
      "Add explicit warnings when source evidence is incomplete or undecoded.",
      "Keep accumulator, bridge, SHELL, and USDC incident reports separated from confirmed movement claims.",
    ],
  };
}

function normalizeNullableText(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeCount(value: number | null | undefined, fallback = 0): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return fallback;
  return Math.floor(value);
}
