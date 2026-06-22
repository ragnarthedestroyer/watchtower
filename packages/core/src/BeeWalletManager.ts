import { Wallet } from '@teamgosh/bee-sdk';

/**
 * Strict Token Configuration Layout
 * Every token must explicitly store its bare 64-hex dApp ID (no '0:' prefix).
 */
export type TokenConfig = {
  symbol: string;
  tokenRoot: string;
  tokenDapp: string;
  decimals: number;
};

// Replace these placeholders with the actual active roots from the network.
export const SUPPORTED_TOKENS: TokenConfig[] = [
  {
    symbol: 'USDC',
    tokenRoot: '0:0000000000000000000000000000000000000000000000000000000000000000', 
    tokenDapp: '0000000000000000000000000000000000000000000000000000000000000000', // Bare 64-hex ID
    decimals: 6
  }
];

export class BeeWalletManager {
  private wallet: Wallet;

  constructor(appId: string, apiToken: string | null = null) {
    // Positional Constructor Arguments required by SDK v3
    const blockManagerEndpoints = ['https://mainnet-cf.ackinacki.org'];
    const archiveEndpoints = ['https://archive.acki.live'];
    const apiUrl = 'https://mainnet.ackinacki.org';
    const maxRps = 60;

    this.wallet = new Wallet(
      blockManagerEndpoints,
      archiveEndpoints,
      apiUrl,
      appId,
      apiToken,
      maxRps
    );
  }

  async getBalances(multifactorAddress: string): Promise<Record<string, string>> {
    const formattedRoots = SUPPORTED_TOKENS.map((token) => ({
      token_root: token.tokenRoot,
      token_dapp: token.tokenDapp // Mandated by v3 API upgrade
    }));

    return await this.wallet.get_tokens_balances({
      multifactor_address: multifactorAddress,
      token_roots: formattedRoots
    });
  }

  async migrateUsdc(params: {
    multifactorAddress: string;
    token: TokenConfig;
    amountRaw: string | number;
    signerKeys: { public: string; secret: string };
    bounce?: boolean;
  }) {
    return await this.wallet.migrate_tip3_usdc({
      multifactor_address: params.multifactorAddress,
      token_root: params.token.tokenRoot,
      token_dapp: params.token.tokenDapp, // Upgraded API property
      amount_raw: params.amountRaw,
      signer_keys: params.signerKeys,
      bounce: params.bounce ?? true
    });
  }

  static parseNativeBalance(
    nativeBalancesMap: Record<string, string> | undefined,
    currencyCode: number | string
  ): bigint {
    const rawAmount = nativeBalancesMap?.[String(currencyCode)] ?? '0';
    return BigInt(rawAmount);
  }
}
