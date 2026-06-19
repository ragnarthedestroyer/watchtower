import {
  createDemoTokenMovementApiStubStore,
  createTokenMovementApiStubRoutePlan,
  handleTokenMovementApiRouteStub,
  type TokenMovementApiRouteId,
  type TokenMovementApiStubRequest,
  type TokenMovementApiStubResponse,
  type TokenMovementApiStubStore,
  type TokenMovementQuery,
  type TokenMovementExportFormat,
  type TokenMovementExportScope,
} from "@watchtower/core";

export interface TokenMovementServerRouteStubRequest {
  readonly routeId: TokenMovementApiRouteId;
  readonly subject?: TokenMovementApiStubRequest["subject"];
  readonly query?: TokenMovementQuery;
  readonly movementId?: string;
  readonly exportScope?: TokenMovementExportScope;
  readonly exportFormat?: TokenMovementExportFormat;
}

export interface TokenMovementServerRouteStubRegistry {
  readonly routePrefix: "/api/token-movements";
  readonly generatedAt: string;
  readonly readOnly: true;
  readonly liveReadsEnabled: false;
  readonly routes: readonly string[];
  readonly warnings: readonly string[];
}

export function createTokenMovementServerRouteStubRegistry(
  generatedAt = new Date(0).toISOString(),
): TokenMovementServerRouteStubRegistry {
  const plan = createTokenMovementApiStubRoutePlan(generatedAt);
  return {
    routePrefix: "/api/token-movements",
    generatedAt,
    readOnly: true,
    liveReadsEnabled: false,
    routes: plan.routes.map((route) => `${route.method} ${route.path}`),
    warnings: plan.warnings,
  };
}

export function handleTokenMovementServerRouteStub(
  request: TokenMovementServerRouteStubRequest,
  store: TokenMovementApiStubStore = createDemoTokenMovementApiStubStore({ label: "server demo subject" }),
): TokenMovementApiStubResponse {
  return handleTokenMovementApiRouteStub(toCoreStubRequest(request), store);
}

function toCoreStubRequest(request: TokenMovementServerRouteStubRequest): TokenMovementApiStubRequest {
  return {
    routeId: request.routeId,
    ...(request.subject === undefined ? {} : { subject: request.subject }),
    ...(request.query === undefined ? {} : { query: request.query }),
    ...(request.movementId === undefined ? {} : { movementId: request.movementId }),
    ...(request.exportScope === undefined ? {} : { exportScope: request.exportScope }),
    ...(request.exportFormat === undefined ? {} : { exportFormat: request.exportFormat }),
  };
}
