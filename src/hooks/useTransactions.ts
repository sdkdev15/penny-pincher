"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Transaction } from "@/lib/types";

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch all transactions from the API
  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/process/transactions", {
        credentials: "include", 
      });

      if (!response.ok) {
        throw new Error("Failed to fetch transactions.");
      }

      const data: Transaction[] = await response.json();
      setTransactions(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Add a new transaction via the API
  const addTransaction = useCallback(
    async (transactionData: Omit<Transaction, "id" | "createdAt">) => {
      try {
        const response = await fetch("/api/process/transactions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", 
          body: JSON.stringify(transactionData),
        });

        if (!response.ok) {
          throw new Error("Failed to add transaction.");
        }

        const newTransaction: Transaction = await response.json();
        setTransactions((prev) => [newTransaction, ...prev]);
      } catch (error) {
        console.error(error);
      }
    },
    []
  );

  // Update an existing transaction via the API
  const updateTransaction = useCallback(
    async (id: string, updates: Partial<Omit<Transaction, "id" | "createdAt">>) => {
      try {
        const response = await fetch(`/api/process/transactions/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // Include cookies in the request
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          throw new Error("Failed to update transaction.");
        }

        const updatedTransaction: Transaction = await response.json();
        setTransactions((prev) =>
          prev.map((t) => (t.id === id ? updatedTransaction : t))
        );
      } catch (error) {
        console.error(error);
      }
    },
    []
  );

  // Delete a transaction via the API
  const deleteTransaction = useCallback(
    async (id: string) => {
      try {
        const response = await fetch(`/api/process/transactions/${id}`, {
          method: "DELETE",
          credentials: "include", // Include cookies in the request
        });

        if (!response.ok) {
          throw new Error("Failed to delete transaction.");
        }

        setTransactions((prev) => prev.filter((t) => t.id !== id));
      } catch (error) {
        console.error(error);
      }
    },
    []
  );

  // Get a transaction by ID
  const getTransactionById = useCallback(
    (id: string) => {
      return transactions.find((t) => t.id === id);
    },
    [transactions]
  );

  // Get transactions by category
  const getTransactionsByCategory = useCallback(
    (categoryId: string) => {
      return transactions.filter((t) => t.categoryId === categoryId);
    },
    [transactions]
  );

  // Calculate total income
  const totalIncome = useMemo(() => {
    return transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  // Calculate total expenses
  const totalExpenses = useMemo(() => {
    return transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  // Calculate current balance
  const currentBalance = useMemo(() => {
    return totalIncome - totalExpenses;
  }, [totalIncome, totalExpenses]);

  // Get recent transactions
  const recentTransactions = useMemo(() => {
    return transactions.slice(0, 5);
  }, [transactions]);

  // Check if a category has transactions
  const hasTransactionsForCategory = useCallback(
    (categoryId: string) => {
      return transactions.some((t) => t.categoryId === categoryId);
    },
    [transactions]
  );

  // Fetch transactions on component mount
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return {
    transactions,
    isLoading,
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