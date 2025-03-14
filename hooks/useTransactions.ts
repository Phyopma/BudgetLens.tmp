import { useState, useEffect } from "react";
import type { Transaction } from "@prisma/client";

export const useTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = async (filters?: {
    category?: string[];
    vendor?: string[];
    transactionType?: string[];
    tags?: string[];
    startDate?: Date;
    endDate?: Date;
    includeShared?: boolean;
  }) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (filters?.category?.length)
        params.append("category", filters.category.join(","));
      if (filters?.vendor?.length)
        params.append("vendor", filters.vendor.join(","));
      if (filters?.transactionType?.length)
        params.append("transactionType", filters.transactionType.join(","));
      if (filters?.tags?.length) params.append("tags", filters.tags.join(","));
      if (filters?.startDate)
        params.append(
          "startDate",
          filters.startDate.toISOString().split("T")[0]
        );
      if (filters?.endDate)
        params.append("endDate", filters.endDate.toISOString().split("T")[0]);
      if (filters?.includeShared !== undefined)
        params.append("includeShared", filters.includeShared.toString());

      const response = await fetch(`/api/transactions?${params}`);
      if (!response.ok) throw new Error("Failed to fetch transactions");

      const data = await response.json();
      setTransactions(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const addTransaction = async (
    transaction: Omit<Transaction, "id" | "createdAt" | "updatedAt">
  ) => {
    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transaction),
      });

      if (!response.ok) throw new Error("Failed to add transaction");

      const newTransaction = await response.json();

      setTransactions((prev) => [newTransaction, ...prev]);

      return newTransaction;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to add transaction"
      );
      throw err;
    }
  };

  const updateTransaction = async (
    oldTransaction: Transaction,
    newTransaction: Partial<Transaction>
  ) => {
    try {
      const response = await fetch("/api/transactions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: oldTransaction.id, ...newTransaction }),
      });

      if (!response.ok) throw new Error("Failed to update transaction");

      const updatedTransaction = await response.json();
      setTransactions((prev) =>
        prev.map((t) => (t.id === oldTransaction.id ? updatedTransaction : t))
      );
      return updatedTransaction;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update transaction"
      );
      throw err;
    }
  };

  const deleteTransaction = async (transaction: Transaction) => {
    try {
      const response = await fetch(`/api/transactions?id=${transaction.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete transaction");

      setTransactions((prev) => prev.filter((t) => t.id !== transaction.id));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete transaction"
      );
      throw err;
    }
  };

  const importTransactions = async (csvContent: string) => {
    try {
      const lines = csvContent.trim().split("\n");
      const transactions = lines.slice(1).map((line) => {
        const [date, vendor, amount, category, transactionType, tagsStr] = line
          .split(",")
          .map((item) => item.trim().replace(/^"|"$/g, ""));
        const tags = tagsStr
          ? tagsStr
              .split(";")
              .map((tag) => tag.trim())
              .filter(Boolean)
          : [];

        return {
          date,
          vendor,
          amount: amount ? parseFloat(amount.replace(/[^\d.-]/g, "")) : 0,
          category,
          transactionType,
          tags,
        };
      });

      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transactions),
      });

      if (!response.ok) throw new Error("Failed to import transactions");

      await fetchTransactions(); // Refresh the transactions list
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to import transactions"
      );
      throw err;
    }
  };

  // Get all available tags from transactions
  const getAvailableTags = () => {
    const allTags = transactions
      .flatMap((transaction) => transaction.tags || [])
      .filter(Boolean);

    return [...new Set(allTags)].sort();
  };

  // Filter transactions by tag
  const filterTransactionsByTags = (tagFilters: string[]) => {
    if (!tagFilters.length) return transactions;

    return transactions.filter((transaction) =>
      transaction.tags?.some((tag) => tagFilters.includes(tag))
    );
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  return {
    transactions,
    loading,
    error,
    fetchTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    importTransactions,
    getAvailableTags,
    filterTransactionsByTags,
  };
};
