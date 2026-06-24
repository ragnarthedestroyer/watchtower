export interface TokenDappIdDiagnostics {
  isLegacyAddress: boolean;
  extractedAccountId: string | null;
  missingTokenDappId: boolean;
  explanation: string[];
  curlTemplate: string | null;
}

export function analyzeTokenDappIdState(
  address: string | null,
  tokenDappId: string | null
): TokenDappIdDiagnostics {
  const isLegacy = typeof address === "string" && address.startsWith("0:");
  let accountId = null;

  if (isLegacy && address) {
    accountId = address.substring(2);
  } else if (address && address.length === 64) {
    accountId = address;
  }

  const missingTokenDappId = !tokenDappId || tokenDappId.trim() === "";

  const explanation = [];
  if (missingTokenDappId) {
    explanation.push(
      "State V2 history requires a Token DApp ID (token_dapp).",
      "According to the bee-sdk-v3 architecture, every TIP-3 token (like USDC) has its own unique 64-hex token_dapp namespace.",
      "The Multifactor address or the main app ID will not work here. We need the specific token_dapp for the asset you are querying."
    );
  } else {
    explanation.push("Token DApp ID provided. Ready for State V2 query.");
  }

  const curlTemplate = missingTokenDappId && accountId
    ? `curl -i "http://localhost:8787/api/token-movements/live-raw-history?account_id=${accountId}&dapp_id=INSERT_USDC_TOKEN_DAPP_HERE&limit=25"`
    : null;

  return {
    isLegacyAddress: isLegacy,
    extractedAccountId: accountId,
    missingTokenDappId,
    explanation,
    curlTemplate,
  };
}
