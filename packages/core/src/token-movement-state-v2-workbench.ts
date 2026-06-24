export interface StateV2WorkbenchValidation {
  isValid: boolean;
  warnings: string[];
  testCommand: string | null;
  devQuestionTemplate: string;
}

export function validateTokenDappIdCandidate(
  accountId: string | null,
  candidate: string
): StateV2WorkbenchValidation {
  const warnings: string[] = [];
  const cleanCandidate = candidate.trim().toLowerCase();

  if (!cleanCandidate) {
    warnings.push("Candidate is empty.");
  } else if (cleanCandidate.startsWith("0:")) {
    warnings.push("A Token DApp ID should not have a '0:' prefix (must be raw hex).");
  } else if (cleanCandidate.length !== 64) {
    warnings.push(`Expected exactly 64 hex characters, got ${cleanCandidate.length}.`);
  } else if (!/^[0-9a-f]{64}$/.test(cleanCandidate)) {
    warnings.push("Candidate contains invalid non-hex characters.");
  }

  if (accountId && cleanCandidate === accountId.toLowerCase()) {
    warnings.push("Suspicious: Token DApp ID is identical to the Account ID. They are usually distinct namespaces.");
  }

  const isValid = warnings.length === 0 && cleanCandidate.length === 64;

  const testCommand = isValid && accountId
    ? `curl -i "http://localhost:8787/api/token-movements/live-raw-history?account_id=${accountId}&dapp_id=${cleanCandidate}&limit=25"`
    : null;

  const devQuestionTemplate = 
    `Hello! We are migrating to the State V2 history API. Our frontend needs to query the live raw transaction history for TIP-3 tokens. ` +
    `Could you provide the public 64-hex 'token_dapp' value specifically for USDC on mainnet?`;

  return {
    isValid,
    warnings,
    testCommand,
    devQuestionTemplate,
  };
}
