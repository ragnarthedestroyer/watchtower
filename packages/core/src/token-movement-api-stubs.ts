/**
 * Watchtower Batch 63 — Token Movement API Route Stub Foundation
 *
 * Deterministic read-only route handlers for the Batch 62 API contract.
 * These stubs return demo/in-memory responses only. They do not perform live
 * chain reads, decoding, signing, broadcasting, custody, DEX activity,
 * PrivateNote operations, or wallet operations.
 */

import {
  TOKEN_MOVEMENT_RESEARCH_FIXTURES,
  type TokenMovement,
  type TokenMovementHistory,
} from "./token-movement";
import {
  buildIncidentTracingReport,
  type IncidentTracingReport,
} from "./incident-tracing-report";
import {
  buildTokenMovementEvidenceBundle,
  type TokenMovementEvidenceBundle,
} from "./token-movement-evidence-bundle";
import {
  createTokenMovementExportBundle,
  renderTokenMovementExportCsv,
  renderTokenMovementExportJson,
  renderTokenMovementExportMarkdown,
  type TokenMovementExportBundle,
  type TokenMovementExportFormat,
  type TokenMovementExportScope,
  type TokenMovementExportSourceLike,
} from "./token-movement-export";
import {
  queryTokenMovements,
  type TokenMovementQuery,
  type TokenMovementQueryResult,
} from "./token-movement-query";
import {
  createTokenMovementApiError,
  createTokenMovementApiPage,
  createTokenMovementApiSubject,
  createTokenMovementApiSuccess,
  tokenMovementApiSubjectIsUsable,
  TOKEN_MOVEMENT_API_ROUTES,
  type TokenMovementApiError,
  type TokenMovementApiResponse,
  type TokenMovementApiRouteDescriptor,
  type TokenMovementApiRouteId,
  type TokenMovementApiSubject,
  type TokenMovementEvidenceApiPayload,
  type TokenMovementExportApiPayload,
  type TokenMovementHistoryApiPayload,
  type TokenMovementIncidentReportApiPayload,
  type TokenMovementQueryApiPayload,
} from "./token-movement-api-contract";

export interface TokenMovementApiStubStore {
  readonly subject: TokenMovementApiSubject;
  readonly movements: readonly TokenMovement[];
  readonly warnings: readonly string[];
}

export interface TokenMovementApiStubRequest {
  readonly routeId: TokenMovementApiRouteId;
  readonly subject?: Partial<TokenMovementApiSubject>;
  readonly query?: TokenMovementQuery;
  readonly movementId?: string;
  readonly exportScope?: TokenMovementExportScope;
  readonly exportFormat?: TokenMovementExportFormat;
  readonly generatedAt?: string;
}

export interface TokenMovementApiStubRoutePlan {
  readonly generatedAt: string;
  readonly routes: readonly TokenMovementApiRouteDescriptor[];
  readonly handlers: readonly {
    readonly routeId: TokenMovementApiRouteId;
    readonly implemented: true;
    readonly liveReadEnabled: false;
    readonly responseMode: "deterministic-demo";
  }[];
  readonly warnings: readonly string[];
}

export type TokenMovementApiStubResponse =
  | TokenMovementApiResponse<TokenMovementQueryApiPayload>
  | TokenMovementApiResponse<TokenMovementHistoryApiPayload>
  | TokenMovementApiResponse<TokenMovementEvidenceApiPayload>
  | TokenMovementApiResponse<TokenMovementExportApiPayload>
  | TokenMovementApiResponse<TokenMovementIncidentReportApiPayload>;

export function createEmptyTokenMovementApiStubStore(
  subject: Partial<TokenMovementApiSubject> = {},
): TokenMovementApiStubStore {
  return {
    subject: createTokenMovementApiSubject(subject),
    movements: [],
    warnings: [
      "Token movement API route stubs are connected, but no movement source is wired yet.",
      "This response is read-only and must not be interpreted as confirmed asset history.",
    ],
  };
}

export function createDemoTokenMovementApiStubStore(
  subject: Partial<TokenMovementApiSubject> = {},
): TokenMovementApiStubStore {
  return {
    subject: createTokenMovementApiSubject({
      label: "demo watch subject",
      ...subject,
    }),
    movements: TOKEN_MOVEMENT_RESEARCH_FIXTURES,
    warnings: [
      "Demo route store uses research fixtures only.",
      "The SHELL accumulator / USDC incident row is unresolved candidate evidence, not proof.",
    ],
  };
}

export function createTokenMovementApiStubRoutePlan(
  generatedAt = new Date(0).toISOString(),
): TokenMovementApiStubRoutePlan {
  return {
    generatedAt,
    routes: TOKEN_MOVEMENT_API_ROUTES,
    handlers: TOKEN_MOVEMENT_API_ROUTES.map((route) => ({
      routeId: route.id,
      implemented: true,
      liveReadEnabled: false,
      responseMode: "deterministic-demo",
    })),
    warnings: [
      "Batch 63 handlers are route stubs only.",
      "No live reads, token decoding, transaction signing, broadcasting, custody, DEX, or PrivateNote operation is enabled.",
    ],
  };
}

export function handleTokenMovementApiRouteStub(
  request: TokenMovementApiStubRequest,
  store: TokenMovementApiStubStore = createDemoTokenMovementApiStubStore(),
): TokenMovementApiStubResponse {
  const generatedAt = request.generatedAt ?? new Date(0).toISOString();
  const subject = resolveSubject(store, request.subject);

  if (!tokenMovementApiSubjectIsUsable(subject)) {
    return createTokenMovementApiError(
      "missing-subject",
      "Token movement route stub needs a legacy address or a State V2 dapp_id + account_id subject before live wiring.",
      {
        generatedAt,
        details: [
          "The demo store may still return fixture data, but production routes must receive a usable subject.",
          "No seed phrase, private key, signer, or custody permission is accepted.",
        ],
      },
    );
  }

  switch (request.routeId) {
    case "token-movements.query":
      return handleTokenMovementQueryRouteStub(store, subject, request.query, generatedAt);
    case "token-movements.history":
      return handleTokenMovementHistoryRouteStub(store, subject, request.query, generatedAt);
    case "token-movements.evidence":
      return handleTokenMovementEvidenceRouteStub(store, subject, request.movementId, generatedAt);
    case "token-movements.export":
      return handleTokenMovementExportRouteStub(
        store,
        subject,
        request.query,
        request.exportScope,
        request.exportFormat,
        generatedAt,
      );
    case "token-movements.incident-report":
      return handleTokenMovementIncidentReportRouteStub(store, subject, generatedAt);
  }
}

export function handleTokenMovementQueryRouteStub(
  store: TokenMovementApiStubStore,
  subject: TokenMovementApiSubject = store.subject,
  query: TokenMovementQuery = {},
  generatedAt = new Date(0).toISOString(),
): TokenMovementApiResponse<TokenMovementQueryApiPayload> {
  const result = queryTokenMovements(store.movements, query);
  return createTokenMovementApiSuccess(
    {
      subject,
      result,
    },
    {
      generatedAt,
      warnings: [...store.warnings, ...result.warnings],
    },
  );
}

export function handleTokenMovementHistoryRouteStub(
  store: TokenMovementApiStubStore,
  subject: TokenMovementApiSubject = store.subject,
  query: TokenMovementQuery = {},
  generatedAt = new Date(0).toISOString(),
): TokenMovementApiResponse<TokenMovementHistoryApiPayload> {
  const result = queryTokenMovements(store.movements, query);
  const history: TokenMovementHistory = {
    subject: {
      address: subject.address,
      label: subject.label,
      role: "wallet",
      dappId: subject.dappId,
      accountId: subject.accountId,
    },
    generatedAt,
    movements: [...result.movements],
    warnings: [...store.warnings, ...result.warnings],
  };

  return createTokenMovementApiSuccess(
    {
      subject,
      movements: history.movements,
      page: createTokenMovementApiPage({
        limit: query.limit ?? result.returned,
        offset: query.offset ?? 0,
        totalBeforePagination: result.totalBeforePagination,
        returned: result.returned,
      }),
      warnings: history.warnings,
    },
    {
      generatedAt,
      warnings: history.warnings,
    },
  );
}

export function handleTokenMovementEvidenceRouteStub(
  store: TokenMovementApiStubStore,
  subject: TokenMovementApiSubject = store.subject,
  movementId: string | undefined,
  generatedAt = new Date(0).toISOString(),
): TokenMovementApiResponse<TokenMovementEvidenceApiPayload> {
  const movement = movementId ? store.movements.find((item) => item.id === movementId) : store.movements[0];

  if (!movement) {
    return createTokenMovementApiError("not-found", "No movement candidate was available for the evidence route stub.", {
      generatedAt,
      details: ["Attach a movement id or connect an in-memory movement source before requesting evidence."],
    });
  }

  const bundle: TokenMovementEvidenceBundle = buildTokenMovementEvidenceBundle(movement, generatedAt);
  return createTokenMovementApiSuccess(
    {
      subject,
      movementId: movement.id,
      bundle,
    },
    {
      generatedAt,
      warnings: [...store.warnings, ...bundle.warnings],
    },
  );
}

export function handleTokenMovementExportRouteStub(
  store: TokenMovementApiStubStore,
  subject: TokenMovementApiSubject = store.subject,
  query: TokenMovementQuery = {},
  scope: TokenMovementExportScope = "all",
  format: TokenMovementExportFormat = "markdown",
  generatedAt = new Date(0).toISOString(),
): TokenMovementApiResponse<TokenMovementExportApiPayload> {
  const result: TokenMovementQueryResult = queryTokenMovements(store.movements, query);
  const source = result.movements.map(movementToExportSource);
  const bundle: TokenMovementExportBundle = createTokenMovementExportBundle(source, {
    title: "Token movement API route stub export",
    scope,
    generatedAt,
  });

  return createTokenMovementApiSuccess(
    {
      subject,
      format,
      bundle,
      rendered: renderExportBundle(bundle, format),
    },
    {
      generatedAt,
      warnings: [...store.warnings, ...result.warnings, ...bundle.safetyNotes],
    },
  );
}

export function handleTokenMovementIncidentReportRouteStub(
  store: TokenMovementApiStubStore,
  subject: TokenMovementApiSubject = store.subject,
  generatedAt = new Date(0).toISOString(),
): TokenMovementApiResponse<TokenMovementIncidentReportApiPayload> {
  const report: IncidentTracingReport = {
    ...buildIncidentTracingReport({ movements: [...store.movements] }),
    generatedAt,
  };

  return createTokenMovementApiSuccess(
    {
      subject,
      report,
    },
    {
      generatedAt,
      warnings: [...store.warnings, ...report.warnings],
    },
  );
}

function resolveSubject(
  store: TokenMovementApiStubStore,
  requestSubject: Partial<TokenMovementApiSubject> | undefined,
): TokenMovementApiSubject {
  if (!requestSubject) return store.subject;
  return createTokenMovementApiSubject({
    address: requestSubject.address ?? store.subject.address,
    dappId: requestSubject.dappId ?? store.subject.dappId,
    accountId: requestSubject.accountId ?? store.subject.accountId,
    label: requestSubject.label ?? store.subject.label,
  });
}

function movementToExportSource(movement: TokenMovement): TokenMovementExportSourceLike {
  return {
    id: movement.id,
    token: movement.token.symbol || movement.token.family,
    amount: movement.amount,
    direction: movement.direction,
    from: movement.from.label ?? movement.from.address ?? "unknown",
    to: movement.to.label ?? movement.to.address ?? "unknown",
    observedAt: movement.observedAt ?? "unknown",
    proofStatus: movement.proofStatus,
    confidence: movement.proofStatus,
    likelyExplanation: movement.likelyAction || movement.summary,
    warnings: [...movement.warnings, ...movement.uncertainty.map((item) => item.reason)],
    evidence: movement.evidence,
  };
}

function renderExportBundle(bundle: TokenMovementExportBundle, format: TokenMovementExportFormat): string {
  switch (format) {
    case "csv":
      return renderTokenMovementExportCsv(bundle);
    case "json":
      return renderTokenMovementExportJson(bundle);
    case "markdown":
    default:
      return renderTokenMovementExportMarkdown(bundle);
  }
}
