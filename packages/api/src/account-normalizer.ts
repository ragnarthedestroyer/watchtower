export type NormalizedRawAccount = {
  present: boolean;
  id?: string;
  accountId?: string;
  dappId?: string;
  boc?: string | null;
  balance?: string | null;
  lastPaid?: string | null;
  codeHash?: string | null;
  dataHash?: string | null;
  extractedFields: string[];
  warnings: string[];
};

export type NormalizedRawAccountGraphqlResponse = {
  account: NormalizedRawAccount | null;
  accountCount: number;
  graphqlErrors: string[];
  warnings: string[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function valueToString(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "bigint") return String(value);
  if (typeof value === "boolean") return String(value);
  return null;
}

function optionalString(value: unknown): string | undefined {
  const converted = valueToString(value);
  return converted === null ? undefined : converted;
}

function nullableString(value: unknown): string | null | undefined {
  if (value === null) return null;
  return optionalString(value);
}

function collectGraphqlErrors(raw: unknown): string[] {
  if (!isRecord(raw) || !Array.isArray(raw.errors)) {
    return [];
  }

  return raw.errors.map((error, index) => {
    if (isRecord(error)) {
      const message = valueToString(error.message);
      return message || `GraphQL error at index ${index}.`;
    }

    return valueToString(error) || `GraphQL error at index ${index}.`;
  });
}

function extractAccountsArray(raw: unknown): unknown[] {
  if (!isRecord(raw)) return [];

  const data = raw.data;
  if (!isRecord(data)) return [];

  const accounts = data.accounts;

  if (Array.isArray(accounts)) {
    return accounts;
  }

  if (isRecord(accounts) && Array.isArray(accounts.edges)) {
    return accounts.edges
      .map((edge) => (isRecord(edge) ? edge.node : null))
      .filter((node): node is Record<string, unknown> => isRecord(node));
  }

  const account = data.account;
  if (isRecord(account)) {
    return [account];
  }

  return [];
}

export function normalizeRawAccountRecord(record: unknown): NormalizedRawAccount {
  const warnings: string[] = [];

  if (!isRecord(record)) {
    return {
      present: false,
      extractedFields: [],
      warnings: ["Account record is not an object."]
    };
  }

  const account: NormalizedRawAccount = {
    present: true,
    extractedFields: [],
    warnings
  };

  const id = optionalString(record.id);
  if (id !== undefined) {
    account.id = id;
    account.extractedFields.push("id");
  }

  const accountId = optionalString(record.account_id ?? record.accountId);
  if (accountId !== undefined) {
    account.accountId = accountId;
    account.extractedFields.push("account_id");
  }

  const dappId = optionalString(record.dapp_id ?? record.dappId);
  if (dappId !== undefined) {
    account.dappId = dappId;
    account.extractedFields.push("dapp_id");
  }

  const boc = nullableString(record.boc);
  if (boc !== undefined) {
    account.boc = boc;
    account.extractedFields.push("boc");
  }

  const balance = nullableString(record.balance);
  if (balance !== undefined) {
    account.balance = balance;
    account.extractedFields.push("balance");
  }

  const lastPaid = nullableString(record.last_paid ?? record.lastPaid);
  if (lastPaid !== undefined) {
    account.lastPaid = lastPaid;
    account.extractedFields.push("last_paid");
  }

  const codeHash = nullableString(record.code_hash ?? record.codeHash);
  if (codeHash !== undefined) {
    account.codeHash = codeHash;
    account.extractedFields.push("code_hash");
  }

  const dataHash = nullableString(record.data_hash ?? record.dataHash);
  if (dataHash !== undefined) {
    account.dataHash = dataHash;
    account.extractedFields.push("data_hash");
  }

  if (account.extractedFields.length === 0) {
    warnings.push("Account record contained no recognized fields.");
  }

  if (!account.boc) {
    warnings.push("Account BOC is missing; ABI/BOC decoding cannot run yet.");
  }

  return account;
}

export function normalizeRawAccountGraphqlResponse(
  raw: unknown
): NormalizedRawAccountGraphqlResponse {
  const graphqlErrors = collectGraphqlErrors(raw);
  const accounts = extractAccountsArray(raw);
  const warnings: string[] = [];

  if (accounts.length === 0) {
    warnings.push("No account records were found in the GraphQL response.");
  }

  if (accounts.length > 1) {
    warnings.push(
      `GraphQL response returned ${accounts.length} account records; Watchtower will use the first one.`
    );
  }

  const firstAccount = accounts[0];
  const account = firstAccount === undefined ? null : normalizeRawAccountRecord(firstAccount);

  return {
    account,
    accountCount: accounts.length,
    graphqlErrors,
    warnings: account ? [...warnings, ...account.warnings] : warnings
  };
}
