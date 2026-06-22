import { useState, useEffect } from 'react';
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
      return `${integral}.${fractional.toString().padStart(fractionDigits, '0')}`;
    }
  };
}
