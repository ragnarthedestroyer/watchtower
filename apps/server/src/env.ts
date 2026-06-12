import {
  buildWatchtowerEndpointConfig,
  type WatchtowerEndpointConfig
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

export function readServerEnv(source: NodeJS.ProcessEnv = process.env): ServerEnv {
  return {
    host: source.HOST || "0.0.0.0",
    port: readPort(source.PORT),
    allowedOrigin: source.WATCHTOWER_ALLOWED_ORIGIN || "*",
    runtime: "server-job",
    endpointConfig: buildWatchtowerEndpointConfig({
      mode: source.WATCHTOWER_MODE,
      graphqlEndpoint: source.WATCHTOWER_GRAPHQL_ENDPOINT,
      restEndpoint: source.WATCHTOWER_REST_ENDPOINT,
      dappId: source.WATCHTOWER_DAPP_ID,
      apiKey: source.WATCHTOWER_API_KEY,
      blockManagerEndpoint: source.WATCHTOWER_BLOCK_MANAGER_ENDPOINT
    })
  };
}
