const fs = require('fs');

// 1. Create the hooks directory
fs.mkdirSync('packages/core/src/hooks', { recursive: true });

// 2. Write the Manifest
const readmeContent = `# Batch 88: Frontend Balance Hooks and Safe Processing Pipeline\n\n## Objective\nEnforces strict compliance with tvm-sdk v3 balance response maps across frontend data-fetching layers. This mitigates Safe Integer precision loss by forcing a pure BigInt math pipeline and guarantees structural key lookups use explicit string subscripts.\n\n## Changes Executed\n* **Safe React Hook**: Created \`useSafeBalance.ts\` inside \`packages/core/src/hooks/\` to handle asynchronous reactive balance checking safely.\n* **Overflow Protection**: Replaced native array/number casting mechanisms with string-keyed map lookups and high-precision allocations.\n`;
fs.writeFileSync('README_BATCH_88.md', readmeContent);

// 3. Write the typed hook
const hookContent = `import { useState, useEffect } from 'react';
import { BeeWalletManager } from '../BeeWalletManager';

export function useSafeBalance(balancesMap: Record<string, string> | undefined, currencyCode: number | string) {
  const [balance, setBalance] = useState<bigint>(0n);

  useEffect(() => {
    if (!balancesMap) { 
      setBalance(0n); 
      return; 
    }
    const parsed = BeeWalletManager.parseNativeBalance(balancesMap, currencyCode);
    setBalance(parsed);
  }, [balancesMap, currencyCode]);

  return {
    balance,
    displayString: balance.toString(),
    formattedValue: (fractionDigits: number = 9) => {
      const divisor = BigInt(10 ** fractionDigits);
      const integral = balance / divisor;
      const fractional = balance % divisor;
      return \`\${integral}.\${fractional.toString().padStart(fractionDigits, '0')}\`;
    }
  };
}
`;
fs.writeFileSync('packages/core/src/hooks/useSafeBalance.ts', hookContent);

console.log('[SUCCESS] Batch 88 files generated directly in the workspace.');
