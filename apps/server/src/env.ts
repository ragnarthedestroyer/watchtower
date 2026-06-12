import {
  buildWatchtowerEndpointConfig,
  type WatchtowerEndpointConfig,
  type WatchtowerEndpointConfigInput
} from "@watchtower/core";

export type ServerEnv = {
  host: string;
  port: number;
  allowedOrigin: string;
  runtime: "server-job";
  endpointConfig: WatchtowerEndpointConfig;
};

function readPort(value: string | undefined): number {
  if (!value) return 8787;

  const parsed = Number.parseInt(value, 10);

  if (Number.isNaN(parsed) || parsed <= 0 || parsed > 65_535) {
    throw new Error(`Invalid PORT value: ${value}`);
  }

  return parsed;
}

function optionalEnvValue(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

export function readServerEnv(source: NodeJS.ProcessEnv = process.env): ServerEnv {
  const endpointConfigInput: WatchtowerEndpointConfigInput = {};

  const mode = optionalEnvValue(source.WATCHTOWER_MODE);
  const graphqlEndpoint = optionalEnvValue(source.WATCHTOWER_GRAPHQL_ENDPOINT);
  const restEndpoint = optionalEnvValue(source.WATCHTOWER_REST_ENDPOINT);
  const dappId = optionalEnvValue(source.WATCHTOWER_DAPP_ID);
  const apiKey = optionalEnvValue(source.WATCHTOWER_API_KEY);
  const blockManagerEndpoint = optionalEnvValue(
    source.WATCHTOWER_BLOCK_MANAGER_ENDPOINT
  );

  if (mode !== undefined) endpointConfigInput.mode = mode;
  if (graphqlEndpoint !== undefined) endpointConfigInput.graphqlEndpoint = graphqlEndpoint;
  if (restEndpoint !== undefined) endpointConfigInput.restEndpoint = restEndpoint;
  if (dappId !== undefined) endpointConfigInput.dappId = dappId;
  if (apiKey !== undefined) endpointConfigInput.apiKey = apiKey;
  if (blockManagerEndpoint !== undefined) {
    endpointConfigInput.blockManagerEndpoint = blockManagerEndpoint;
  }

  return {
    host: source.HOST || "0.0.0.0",
    port: readPort(source.PORT),
    allowedOrigin: source.WATCHTOWER_ALLOWED_ORIGIN || "*",
    runtime: "server-job",
    endpointConfig: buildWatchtowerEndpointConfig(endpointConfigInput)
  };
}
