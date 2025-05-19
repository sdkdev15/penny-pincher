
"use client";

import type { ReactNode } from 'react';
import { createContext, useState, useCallback, useMemo } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { DEFAULT_CURRENCY_CODE, BASE_CURRENCY_CODE, CONVERSION_RATES, type SUPPORTED_CURRENCIES } from '@/lib/constants';
import type { CurrencyCode } from '@/lib/types';

interface CurrencyContextType {
  currency: CurrencyCode; // Selected display currency
  baseCurrency: CurrencyCode; // Base currency for storage (USD)
  setCurrency: (currencyCode: CurrencyCode) => void;
  convertAmount: (amountInBase: number, targetCurrency: CurrencyCode) => number;
}

export const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const CURRENCY_STORAGE_KEY = 'pennyPincherCurrency';

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [storedDisplayCurrency, setStoredDisplayCurrency] = useLocalStorage<CurrencyCode>(
    CURRENCY_STORAGE_KEY,
    DEFAULT_CURRENCY_CODE
  );

  const setCurrency = useCallback((currencyCode: CurrencyCode) => {
    setStoredDisplayCurrency(currencyCode);
  }, [setStoredDisplayCurrency]);

  const convertAmount = useCallback((amountInBase: number, targetDisplayCurrency: CurrencyCode): number => {
    if (BASE_CURRENCY_CODE === targetDisplayCurrency) {
      return amountInBase;
    }
    const rateFromBaseToTarget = CONVERSION_RATES[targetDisplayCurrency];
    if (rateFromBaseToTarget === undefined) {
      console.warn(`Conversion rate not found for ${targetDisplayCurrency}. Returning base amount.`);
      return amountInBase; // Or throw an error, or handle as per app's requirements
    }
    // Assuming all rates in CONVERSION_RATES are relative to 1 unit of BASE_CURRENCY_CODE (USD)
    return amountInBase * rateFromBaseToTarget;
  }, []);


  const contextValue = useMemo(() => ({
    currency: storedDisplayCurrency,
    baseCurrency: BASE_CURRENCY_CODE,
    setCurrency,
    convertAmount,
  }), [storedDisplayCurrency, setCurrency, convertAmount]);

  return (
    <CurrencyContext.Provider value={contextValue}>
      {children}
    </CurrencyContext.Provider>
  );
}
