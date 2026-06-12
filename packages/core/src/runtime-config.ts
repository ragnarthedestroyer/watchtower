import { validateDappId } from "./validation";

export type WatchtowerRuntimeMode = "demo" | "live-read";

export type WatchtowerEndpointConfigInput = {
  mode?: string;
  graphqlEndpoint?: string;
  restEndpoint?: string;
  dappId?: string;
  apiKey?: string;
  blockManagerEndpoint?: string;
};

export type WatchtowerEndpointConfig = {
  mode: WatchtowerRuntimeMode;

  graphqlEndpoint: string | null;
  graphqlEndpointConfigured: boolean;

  restEndpoint: string | null;
  restEndpointConfigured: boolean;

  dappId: string | null;
  dappIdConfigured: boolean;

  apiKeyPresent: boolean;

  blockManagerEndpoint: string | null;
  blockManagerEndpointConfigured: boolean;

  warnings: string[];
  errors: string[];
};

function normalizeOptionalValue(value: string | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function normalizeRuntimeMode(value: string | undefined): WatchtowerRuntimeMode {
  const normalized = value?.trim().toLowerCase();

  if (normalized === "live" || normalized === "live-read") {
    return "live-read";
  }

  return "demo";
}

export function buildWatchtowerEndpointConfig(
  input: WatchtowerEndpointConfigInput
): WatchtowerEndpointConfig {
  const warnings: string[] = [];
  const errors: string[] = [];

  const mode = normalizeRuntimeMode(input.mode);

  if (
    input.mode &&
    !["demo", "live", "live-read"].includes(input.mode.trim().toLowerCase())
  ) {
    warnings.push(
      `Unknown WATCHTOWER_MODE "${input.mode}"; falling back to demo mode.`
    );
  }

  const graphqlEndpoint = normalizeOptionalValue(input.graphqlEndpoint);
  const restEndpoint = normalizeOptionalValue(input.restEndpoint);
  const dappId = normalizeOptionalValue(input.dappId);
  const apiKey = normalizeOptionalValue(input.apiKey);
  const blockManagerEndpoint = normalizeOptionalValue(input.blockManagerEndpoint);

  if (dappId) {
    const dappIdValidation = validateDappId(dappId);

    if (!dappIdValidation.ok) {
      errors.push(...dappIdValidation.errors);
    }
  }

  if (mode === "live-read" && !graphqlEndpoint && !restEndpoint) {
    errors.push(
      "Live-read mode requires WATCHTOWER_GRAPHQL_ENDPOINT or WATCHTOWER_REST_ENDPOINT."
    );
  }

  if (!dappId) {
    warnings.push(
      "WATCHTOWER_DAPP_ID is not configured; State V2 account reads will remain disabled or limited."
    );
  }

  if (!blockManagerEndpoint) {
    warnings.push(
      "WATCHTOWER_BLOCK_MANAGER_ENDPOINT is not configured; public endpoints may be rate-limited."
    );
  }

  if (mode === "demo") {
    warnings.push(
      "Server is running in demo mode; live Acki Nacki reads are disabled."
    );
  }

  return {
    mode,

    graphqlEndpoint,
    graphqlEndpointConfigured: Boolean(graphqlEndpoint),

    restEndpoint,
    restEndpointConfigured: Boolean(restEndpoint),

    dappId,
    dappIdConfigured: Boolean(dappId),

    apiKeyPresent: Boolean(apiKey),

    blockManagerEndpoint,
    blockManagerEndpointConfigured: Boolean(blockManagerEndpoint),

    warnings,
    errors
  };
}

export function endpointConfigIsUsableForLiveReads(
  config: WatchtowerEndpointConfig
): boolean {
  return (
    config.mode === "live-read" &&
    config.errors.length === 0 &&
    (config.graphqlEndpointConfigured || config.restEndpointConfigured)
  );
}
