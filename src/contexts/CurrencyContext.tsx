
"use client";

import type { ReactNode } from 'react';
import { createContext, useState, useCallback, useMemo, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { DEFAULT_CURRENCY_CODE, BASE_CURRENCY_CODE, CONVERSION_RATES, type SUPPORTED_CURRENCIES } from '@/lib/constants';
import type { CurrencyCode } from '@/lib/types';

interface CurrencyContextType {
  currency: CurrencyCode; // Selected display currency
  baseCurrency: CurrencyCode; // Base currency for storage (IDR)
  setCurrency: (currencyCode: CurrencyCode) => void;
  convertAmount: (amountInBase: number, targetCurrency: CurrencyCode) => number;
  ratesUpdatedAt?: number;
}

export const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const CURRENCY_STORAGE_KEY = 'pennyPincherCurrency';
const RATES_CACHE_KEY = 'pennyPincherExchangeRates';
const RATES_CACHE_TIMESTAMP_KEY = 'pennyPincherExchangeRatesTimestamp';
const CACHE_DURATION = 86400000; // 1 day in milliseconds

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [storedDisplayCurrency, setStoredDisplayCurrency] = useLocalStorage<CurrencyCode>(
    CURRENCY_STORAGE_KEY,
    DEFAULT_CURRENCY_CODE
  );

  const [conversionRates, setConversionRates] = useState<Record<string, number>>(CONVERSION_RATES);
  const [ratesUpdatedAt, setRatesUpdatedAt] = useState<number>(0);

  // Fetch exchange rates from API
  const fetchExchangeRates = useCallback(async () => {
    try {
      // Check cache first
      if (typeof window !== 'undefined') {
        const cachedRates = localStorage.getItem(RATES_CACHE_KEY);
        const cachedTimestamp = localStorage.getItem(RATES_CACHE_TIMESTAMP_KEY);

        if (cachedRates && cachedTimestamp) {
          const timestamp = parseInt(cachedTimestamp, 10);
          const now = Date.now();

          // If cache is still valid, use it
          if (now - timestamp < CACHE_DURATION) {
            const rates = JSON.parse(cachedRates) as Record<string, number>;
            setConversionRates(rates);
            setRatesUpdatedAt(timestamp);
            return;
          }
        }
      }

      // Fetch from API
      const response = await fetch('/api/exchange-rates');
      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();
      const rates = data.rates as Record<string, number>;

      // Update state
      setConversionRates(rates);
      setRatesUpdatedAt(data.timestamp * 1000); // Convert to milliseconds

      // Cache in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(RATES_CACHE_KEY, JSON.stringify(rates));
        localStorage.setItem(RATES_CACHE_TIMESTAMP_KEY, String(data.timestamp * 1000));
      }
    } catch (error) {
      console.error('Failed to fetch exchange rates:', error);
      // Keep using existing rates (either from previous fetch or fallback)
    }
  }, []);

  // Fetch rates on mount
  useEffect(() => {
    fetchExchangeRates();

    // Set up periodic refresh (every day)
    const interval = setInterval(fetchExchangeRates, CACHE_DURATION);

    return () => clearInterval(interval);
  }, [fetchExchangeRates]);

  const setCurrency = useCallback((currencyCode: CurrencyCode) => {
    setStoredDisplayCurrency(currencyCode);
  }, [setStoredDisplayCurrency]);

  const convertAmount = useCallback((amountInBase: number, targetDisplayCurrency: CurrencyCode): number => {
    if (BASE_CURRENCY_CODE === targetDisplayCurrency) {
      return amountInBase;
    }

    const rate = conversionRates[targetDisplayCurrency];
    if (rate === undefined) {
      console.warn(`Conversion rate not found for ${targetDisplayCurrency}. Returning base amount.`);
      return amountInBase;
    }

    return amountInBase * rate;
  }, [conversionRates]);

  const contextValue = useMemo(() => ({
    currency: storedDisplayCurrency,
    baseCurrency: BASE_CURRENCY_CODE,
    setCurrency,
    convertAmount,
    ratesUpdatedAt,
  }), [storedDisplayCurrency, setCurrency, convertAmount, ratesUpdatedAt]);

  return (
    <CurrencyContext.Provider value={contextValue}>
      {children}
    </CurrencyContext.Provider>
  );
}
