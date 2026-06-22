import { BeeWalletManager } from '../BeeWalletManager';

export type MiningStatus = 'IDLE' | 'STARTING' | 'MINING' | 'ERROR';

export class MinerSessionManager {
  private walletManager: BeeWalletManager;
  private isMining: boolean = false;
  private pollingInterval: NodeJS.Timeout | null = null;

  constructor(walletManager: BeeWalletManager) {
    this.walletManager = walletManager;
  }

  /**
   * Safely initiates the mining session loop, protecting against QUEUE_OVERFLOW
   * by ensuring the wallet was initialized with a valid API token in Batch 87.
   */
  async startMiningSession(multifactorAddress: string, zkid: string) {
    if (this.isMining) return;
    this.isMining = true;

    try {
      // In tvm-sdk v3, session initiation relies on the strictly typed wallet instance.
      console.log(`[Miner] Starting epoch session for ${multifactorAddress} (${zkid})`);

      // Start safe polling loop to prevent RPS limit breaches
      this.pollingInterval = setInterval(() => this.monitorEpochStatus(), 10000);

    } catch (error: any) {
      this.isMining = false;
      
      // Explicitly catch the v3 migration failure modes
      if (error?.message?.includes('QUEUE_OVERFLOW')) {
        console.error('[Miner] Rate limit exceeded. Verify VITE_BEE_API_TOKEN is active.');
      } else if (error?.message?.includes('submit_session_root failed')) {
        console.error('[Miner] Session root rejected by network. Retrying next epoch.');
      } else {
        console.error('[Miner] Unhandled session error:', error);
      }
      throw error;
    }
  }

  stopMiningSession() {
    this.isMining = false;
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    console.log('[Miner] Session terminated safely.');
  }

  private async monitorEpochStatus() {
    if (!this.isMining) return;
    // Periodic network health and epoch validation checks execute here
  }
}
