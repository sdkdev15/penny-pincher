export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  date: string; // ISO string date
  notes?: string;
  createdAt: string; // ISO string date
}

export interface Category {
  id: string;
  name: string;
  isDefault?: boolean;
  budget?: number; 
}

export interface ChartData {
  name: string;
  value: number;
  fill?: string;
}

export type Theme = "light" | "dark" | "system";

export interface Currency {
  code: string;
  name: string;
  symbol: string;
}

export type CurrencyCode = 'USD' | 'IDR' | 'EUR' | 'GBP'; 
