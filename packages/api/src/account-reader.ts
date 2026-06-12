import {
  validateAccountId,
  validateDappId,
  validateLegacyAddress
} from "@watchtower/core";
import {
  normalizeRawAccountGraphqlResponse,
  type NormalizedRawAccount
} from "./account-normalizer";

export type RawAccountReadMode = "legacy" | "state_v2";

export type RawAccountReadRequest = {
  mode: RawAccountReadMode;
  legacyAddress?: string;
  accountId?: string;
  dappId?: string;
};

export type RawAccountReadValidation = {
  ok: boolean;
  errors: string[];
};

export type RawAccountReadQuery = {
  endpoint: string;
  body: {
    query: string;
    variables: Record<string, string>;
  };
};

export type RawAccountReadResult = {
  ok: boolean;
  mode: RawAccountReadMode;
  requestedAt: string;
  endpointKind: "graphql";
  legacyAddress?: string;
  accountId?: string;
  dappId?: string;
  raw?: unknown;
  account?: NormalizedRawAccount;
  accountCount?: number;
  graphqlErrors?: string[];
  normalizerWarnings?: string[];
  errors: string[];
};

export function validateRawAccountReadRequest(
  request: RawAccountReadRequest
): RawAccountReadValidation {
  const errors: string[] = [];

  if (request.mode === "legacy") {
    const validation = validateLegacyAddress(request.legacyAddress ?? "");

    if (!validation.ok) {
      errors.push(...validation.errors);
    }
  }

  if (request.mode === "state_v2") {
    const accountValidation = validateAccountId(request.accountId ?? "");
    const dappValidation = validateDappId(request.dappId ?? "");

    if (!accountValidation.ok) {
      errors.push(...accountValidation.errors);
    }

    if (!dappValidation.ok) {
      errors.push(...dappValidation.errors);
    }
  }

  return {
    ok: errors.length === 0,
    errors
  };
}

export function buildRawAccountGraphqlQuery(
  endpoint: string,
  request: RawAccountReadRequest
): RawAccountReadQuery {
  if (request.mode === "legacy") {
    return {
      endpoint,
      body: {
        query: `
          query WatchtowerRawLegacyAccount($address: String!) {
            accounts(filter: { id: { eq: $address } }) {
              id
              boc
              balance
              last_paid
              code_hash
              data_hash
            }
          }
        `,
        variables: {
          address: request.legacyAddress ?? ""
        }
      }
    };
  }

  return {
    endpoint,
    body: {
      query: `
        query WatchtowerRawStateV2Account($accountId: String!, $dappId: String!) {
          accounts(filter: { account_id: { eq: $accountId }, dapp_id: { eq: $dappId } }) {
            id
            account_id
            dapp_id
            boc
            balance
            last_paid
            code_hash
            data_hash
          }
        }
      `,
      variables: {
        accountId: request.accountId ?? "",
        dappId: request.dappId ?? ""
      }
    }
  };
}

export async function readRawAccountFromGraphql(input: {
  endpoint: string;
  request: RawAccountReadRequest;
  timeoutMs?: number;
}): Promise<RawAccountReadResult> {
  const requestedAt = new Date().toISOString();
  const validation = validateRawAccountReadRequest(input.request);

  if (!validation.ok) {
    return {
      ok: false,
      mode: input.request.mode,
      requestedAt,
      endpointKind: "graphql",
      errors: validation.errors
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), input.timeoutMs ?? 10_000);
  const query = buildRawAccountGraphqlQuery(input.endpoint, input.request);

  try {
    const response = await fetch(query.endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(query.body),
      signal: controller.signal
    });

    const rawText = await response.text();
    let raw: unknown = rawText;

    try {
      raw = rawText ? JSON.parse(rawText) : null;
    } catch {
      raw = rawText;
    }

    const normalized = normalizeRawAccountGraphqlResponse(raw);
    const errors: string[] = [];

    if (!response.ok) {
      errors.push(`GraphQL account read failed with HTTP ${response.status}.`);
    }

    if (normalized.graphqlErrors.length > 0) {
      errors.push(...normalized.graphqlErrors);
    }

    if (response.ok && normalized.accountCount === 0) {
      errors.push("GraphQL account read returned no matching account record.");
    }

    const result: RawAccountReadResult = {
      ok: response.ok && errors.length === 0,
      mode: input.request.mode,
      requestedAt,
      endpointKind: "graphql",
      raw,
      accountCount: normalized.accountCount,
      errors
    };

    if (normalized.account !== null) {
      result.account = normalized.account;
    }

    if (normalized.graphqlErrors.length > 0) {
      result.graphqlErrors = normalized.graphqlErrors;
    }

    if (normalized.warnings.length > 0) {
      result.normalizerWarnings = normalized.warnings;
    }

    if (input.request.legacyAddress !== undefined) {
      result.legacyAddress = input.request.legacyAddress;
    }

    if (input.request.accountId !== undefined) {
      result.accountId = input.request.accountId;
    }

    if (input.request.dappId !== undefined) {
      result.dappId = input.request.dappId;
    }

    return result;
  } catch (error) {
    const errorText =
      error instanceof Error ? error.message : "Unknown raw account read error.";

    const result: RawAccountReadResult = {
      ok: false,
      mode: input.request.mode,
      requestedAt,
      endpointKind: "graphql",
      errors: [errorText]
    };

    if (input.request.legacyAddress !== undefined) {
      result.legacyAddress = input.request.legacyAddress;
    }

    if (input.request.accountId !== undefined) {
      result.accountId = input.request.accountId;
    }

    if (input.request.dappId !== undefined) {
      result.dappId = input.request.dappId;
    }

    return result;
  } finally {
    clearTimeout(timeout);
  }
}
