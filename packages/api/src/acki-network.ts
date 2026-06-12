import type { ApiHealthSignal } from "@watchtower/core";

export type AckiNetworkClientConfig = {
  graphqlEndpoint?: string;
  restEndpoint?: string;
  requestTimeoutMs?: number;
};

export type AckiNetworkHealthTarget = {
  kind: "graphql" | "rest";
  endpoint: string;
};

export function chooseAckiHealthTarget(
  config: AckiNetworkClientConfig
): AckiNetworkHealthTarget | null {
  if (config.graphqlEndpoint) {
    return {
      kind: "graphql",
      endpoint: config.graphqlEndpoint
    };
  }

  if (config.restEndpoint) {
    return {
      kind: "rest",
      endpoint: config.restEndpoint
    };
  }

  return null;
}

export async function checkAckiNetworkHealth(
  config: AckiNetworkClientConfig
): Promise<ApiHealthSignal> {
  const checkedAt = new Date().toISOString();
  const target = chooseAckiHealthTarget(config);

  if (!target) {
    return {
      checkedAt,
      reachable: false,
      errorText: "No Acki Nacki endpoint is configured."
    };
  }

  const startedAt = Date.now();
  const timeoutMs = config.requestTimeoutMs ?? 10_000;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(target.endpoint, {
      method: target.kind === "graphql" ? "POST" : "GET",
      headers:
        target.kind === "graphql"
          ? {
              "content-type": "application/json"
            }
          : undefined,
      body:
        target.kind === "graphql"
          ? JSON.stringify({
              query: "query WatchtowerHealthCheck { __typename }"
            })
          : undefined,
      signal: controller.signal
    });

    const responseMs = Date.now() - startedAt;
    const bodyText = await response.text().catch(() => "");

    return {
      checkedAt,
      reachable: response.ok,
      httpStatus: response.status,
      responseMs,
      stale: false,
      errorText: response.ok ? undefined : bodyText.slice(0, 500)
    };
  } catch (error) {
    const responseMs = Date.now() - startedAt;
    const errorText =
      error instanceof Error ? error.message : "Unknown Acki Nacki network error.";

    return {
      checkedAt,
      reachable: false,
      responseMs,
      stale: false,
      errorText
    };
  } finally {
    clearTimeout(timeout);
  }
}
