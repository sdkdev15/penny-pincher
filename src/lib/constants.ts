import type { Currency } from "./types";

export const APP_NAME = "PennyPincher";

export const SUPPORTED_CURRENCIES: Currency[] = [
  { code: 'USD', name: 'USD - US Dollar', symbol: '$' },
  { code: 'IDR', name: 'IDR - Indonesian Rupiah', symbol: 'Rp' },
  { code: 'EUR', name: 'EUR - Euro', symbol: '€' },
  { code: 'GBP', name: 'GBP - British Pound', symbol: '£' },
];

export const DEFAULT_CURRENCY_CODE = 'IDR';
export const BASE_CURRENCY_CODE: 'IDR' = 'IDR';

// Fallback rates (used when API is unavailable)
// Format: 1 unit of BASE_CURRENCY_CODE (IDR) = X units of target currency
export const CONVERSION_RATES: Record<string, number> = {
  IDR: 1,
  USD: 1 / 16000, // 1 IDR ≈ 0.0000625 USD
  EUR: 1 / 17500, // 1 IDR ≈ 0.0000571 EUR
  GBP: 1 / 20000, // 1 IDR ≈ 0.00005 GBP
};