import type { WatchtowerEndpointConfig } from "@watchtower/core";
import { endpointConfigIsUsableForLiveReads } from "@watchtower/core";
import {
  readRawAccountFromGraphql,
  type RawAccountReadRequest,
  type RawAccountReadResult
} from "./account-reader";

export type LiveRawAccountReadInput = {
  endpointConfig: WatchtowerEndpointConfig;
  request: RawAccountReadRequest;
  requestTimeoutMs?: number;
};

export async function readLiveRawAccount(
  input: LiveRawAccountReadInput
): Promise<RawAccountReadResult> {
  const requestedAt = new Date().toISOString();

  if (!endpointConfigIsUsableForLiveReads(input.endpointConfig)) {
    return {
      ok: false,
      mode: input.request.mode,
      requestedAt,
      endpointKind: "graphql",
      errors: [
        "Live reads are not enabled or endpoint configuration is invalid.",
        ...input.endpointConfig.errors
      ]
    };
  }

  if (!input.endpointConfig.graphqlEndpoint) {
    return {
      ok: false,
      mode: input.request.mode,
      requestedAt,
      endpointKind: "graphql",
      errors: [
        "Raw account reads currently require WATCHTOWER_GRAPHQL_ENDPOINT. REST fallback is not implemented for account reads yet."
      ]
    };
  }

  const readInput: {
    endpoint: string;
    request: RawAccountReadRequest;
    timeoutMs?: number;
  } = {
    endpoint: input.endpointConfig.graphqlEndpoint,
    request: input.request
  };

  if (input.requestTimeoutMs !== undefined) {
    readInput.timeoutMs = input.requestTimeoutMs;
  }

  return readRawAccountFromGraphql(readInput);
}
