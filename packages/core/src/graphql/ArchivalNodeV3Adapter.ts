import { SUPPORTED_TOKENS, TokenConfig } from '../BeeWalletManager';

export type GqlV3TokenFilter = {
  token_root: string;
  token_dapp: string;
};

export class ArchivalNodeV3Adapter {
  private readonly archiveEndpoint = 'https://archive.acki.live/graphql';

  /**
   * Generates a v3-compliant filter array for historical GraphQL queries.
   * Ensures that every root query is securely paired with its bare hex dApp ID.
   */
  static buildTokenFilters(tokens: TokenConfig[] = SUPPORTED_TOKENS): GqlV3TokenFilter[] {
    return tokens.map(token => {
      if (!token.tokenDapp) {
        console.warn(`[GraphQL Adapter] Missing tokenDapp for ${token.symbol}. Query may fail.`);
      }
      return {
        token_root: token.tokenRoot,
        token_dapp: token.tokenDapp
      };
    });
  }

  /**
   * Example payload generator for fetching token movements.
   * The returned variables object must be passed to your Apollo/urql client.
   */
  static generateMovementQueryVariables(multifactorAddress: string, limit: number = 50) {
    return {
      address: multifactorAddress,
      limit,
      tokens: this.buildTokenFilters()
    };
  }
}
