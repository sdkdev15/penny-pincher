import type { Category, Currency } from "./types";

// Add optional budget property to default categories where appropriate
export const DEFAULT_CATEGORIES: Omit<Category, "id">[] = [
  { name: "Salary", isDefault: true },
  { name: "Food & Groceries", isDefault: true, budget: 3000000 }, 
  { name: "Rent/Mortgage", isDefault: true },
  { name: "Utilities", isDefault: true, budget: 150000 }, 
  { name: "Transportation", isDefault: true, budget: 400000 }, 
  { name: "Entertainment", isDefault: true, budget: 500000 }, 
  { name: "Healthcare", isDefault: true },
  { name: "Education", isDefault: true },
  { name: "Shopping", isDefault: true, budget: 350000 }, 
  { name: "Gifts/Donations", isDefault: true },
  { name: "Freelance Income", isDefault: true },
  { name: "Investments", isDefault: true },
  { name: "Miscellaneous", isDefault: true },
];

export const APP_NAME = "PennyPincher";

export const SUPPORTED_CURRENCIES: Currency[] = [
  { code: 'USD', name: 'USD - US Dollar', symbol: '$' },
  { code: 'IDR', name: 'IDR - Indonesian Rupiah', symbol: 'Rp' },
  { code: 'EUR', name: 'EUR - Euro', symbol: '€' },
  { code: 'GBP', name: 'GBP - British Pound', symbol: '£' },
];

export const DEFAULT_CURRENCY_CODE = 'IDR';
export const BASE_CURRENCY_CODE: 'IDR' = 'IDR';

export const CONVERSION_RATES: Record<string, number> = {
  IDR: 1,
  USD: 1 / 15500, // 1 IDR = 0.0000645 USD
  EUR: 0.92 / 15500, // 1 IDR = 0.00005935 EUR
  GBP: 0.79 / 15500, // 1 IDR = 0.00005097 GBP
};
