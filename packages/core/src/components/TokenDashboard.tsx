import React, { useEffect, useState } from 'react';
import { BeeWalletManager, SUPPORTED_TOKENS } from '../BeeWalletManager';
import { useSafeBalance } from '../hooks/useSafeBalance';

interface TokenDashboardProps {
  appId: string;
  userAddress: string;
}

export const TokenDashboard: React.FC<TokenDashboardProps> = ({ appId, userAddress }) => {
  const [walletManager, setWalletManager] = useState<BeeWalletManager | null>(null);
  const [rawBalances, setRawBalances] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  // Initialize the Wallet Manager exactly once
  useEffect(() => {
    // Automatically pulls the API token from your environment variables
    const token = import.meta.env?.VITE_BEE_API_TOKEN || null;
    const manager = new BeeWalletManager(appId, token);
    setWalletManager(manager);
  }, [appId]);

  // Fetch the live balances when the manager is ready
  useEffect(() => {
    if (!walletManager || !userAddress) return;

    const fetchNetworkData = async () => {
      try {
        const balances = await walletManager.getBalances(userAddress);
        // Safely assert the SDK response to match our strict React state
        setRawBalances(balances as unknown as Record<string, string>);
        setError(null);
      } catch (err: any) {
        console.error('[Dashboard] Failed to fetch balances:', err);
        setError(err.message || 'Network error occurred.');
      }
    };

    fetchNetworkData();
    // Poll for updates every 15 seconds
    const interval = setInterval(fetchNetworkData, 15000);
    return () => clearInterval(interval);
  }, [walletManager, userAddress]);

  // Use our Batch 88 Safe Hook for USDC (assuming currency code is 1 for this example)
  const usdcBalance = useSafeBalance(rawBalances, 1);

  return (
    <div className="p-6 bg-gray-900 text-white rounded-lg shadow-xl max-w-md">
      <h2 className="text-2xl font-bold mb-4">Watchtower Live State</h2>
      
      {error && (
        <div className="bg-red-900 text-red-200 p-3 rounded mb-4 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {SUPPORTED_TOKENS.map((token) => (
          <div key={token.symbol} className="bg-gray-800 p-4 rounded border border-gray-700 flex justify-between items-center">
            <span className="font-semibold text-lg text-blue-400">{token.symbol}</span>
            <span className="font-mono text-xl">
              {/* If it's USDC, use our safe formatted value hook */}
              {token.symbol === 'USDC' ? usdcBalance.formattedValue(token.decimals) : '0.000000'}
            </span>
          </div>
        ))}
      </div>
      
      <div className="mt-6 text-xs text-gray-500 uppercase tracking-widest text-right">
        Engine: tvm-sdk v3.0 Active
      </div>
    </div>
  );
};
