
"use client";

import { useCallback, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import type { Transaction, TransactionType } from "@/lib/types";
import { useLocalStorage } from "./useLocalStorage";
import { format } from "date-fns";

const TRANSACTIONS_STORAGE_KEY = "pennyPincherTransactions";

export function useTransactions() {
  const initialTransactionsValue = useMemo<Transaction[]>(() => [], []);
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>(TRANSACTIONS_STORAGE_KEY, initialTransactionsValue);

  const addTransaction = useCallback((transactionData: Omit<Transaction, "id" | "createdAt">) => {
    const newTransaction: Transaction = {
      ...transactionData,
      id: uuidv4(),
      amount: Number(transactionData.amount), // Ensure amount is a number
      date: format(new Date(transactionData.date), "yyyy-MM-dd"), // Store date as YYYY-MM-DD
      createdAt: new Date().toISOString(),
    };
    setTransactions(prev => [newTransaction, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  }, [setTransactions]);

  const updateTransaction = useCallback((id: string, updates: Partial<Omit<Transaction, "id" | "createdAt">>) => {
    setTransactions(prev =>
      prev.map(t =>
        t.id === id ? { ...t, ...updates, amount: Number(updates.amount ?? t.amount), date: updates.date ? format(new Date(updates.date), "yyyy-MM-dd") : t.date } : t
      ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    );
  }, [setTransactions]);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  }, [setTransactions]);

  const getTransactionById = useCallback((id: string) => {
    return transactions.find(t => t.id === id);
  }, [transactions]);

  const getTransactionsByCategory = useCallback((categoryId: string) => {
    return transactions.filter(t => t.categoryId === categoryId);
  }, [transactions]);

  const totalIncome = useMemo(() => {
    return transactions
      .filter(t => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const totalExpenses = useMemo(() => {
    return transactions
      .filter(t => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const currentBalance = useMemo(() => {
    return totalIncome - totalExpenses;
  }, [totalIncome, totalExpenses]);

  const recentTransactions = useMemo(() => {
    return transactions.slice(0, 5);
  }, [transactions]);

  const hasTransactionsForCategory = useCallback((categoryId: string) => {
    return transactions.some(t => t.categoryId === categoryId);
  }, [transactions]);

  return {
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getTransactionById,
    getTransactionsByCategory,
    totalIncome,
    totalExpenses,
    currentBalance,
    recentTransactions,
    hasTransactionsForCategory,
  };
}

