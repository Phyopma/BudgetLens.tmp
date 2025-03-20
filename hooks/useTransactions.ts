import { useState, useEffect } from "react";
import type { Transaction } from "@prisma/client";
import { parseCSV } from "../lib/utils/data";

export const useTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = async (filters?: {
    category?: string[];
    vendor?: string[];
    transactionType?: string[];
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
      if (filters?.startDate)
        params.append(
          "startDate",
          filters.startDate.toISOString().split("T")[0]
        );
      if (filters?.endDate)
        params.append("endDate", filters.endDate.toISOString().split("T")[0]);

      // Default to including shared transactions unless explicitly set to false
      const includeShared = filters?.includeShared !== false;
      params.append("includeShared", includeShared.toString());

      const response = await fetch(`/api/transactions?${params}`);
      if (!response.ok) throw new Error("Failed to fetch transactions");

      const data = await response.json();

      // Collect IDs of transactions that need shared info
      const transactionsNeedingSharedInfo = data
        .filter(
          (tx: any) =>
            // Find transactions that are owned by the user and don't have sharedWith info
            !tx.sharedBy &&
            (!tx.sharedWith || tx.sharedWith.length === 0) &&
            tx.id
        )
        .map((tx: any) => tx.id);

      // Process the initial transaction data
      const processedData = data.map((transaction: any) => {
        // For transactions others have shared with the current user
        if (transaction.sharedBy) {
          return {
            ...transaction,
            isShared: true,
          };
        }

        // For transactions that already have sharedWith data
        if (transaction.sharedWith && transaction.sharedWith.length > 0) {
          return {
            ...transaction,
            isShared: true,
            sharedWith: Array.isArray(transaction.sharedWith)
              ? transaction.sharedWith
              : [transaction.sharedWith],
          };
        }

        // For transactions that don't have sharing info yet
        return {
          ...transaction,
          sharedWith: [],
        };
      });

      setTransactions(processedData);

      // If we have transactions that need shared info, fetch it in one batch
      if (transactionsNeedingSharedInfo.length > 0) {
        fetchSharedUsersForMultipleTransactions(transactionsNeedingSharedInfo);
      }

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // New batch method to fetch shared users for multiple transactions
  const fetchSharedUsersForMultipleTransactions = async (
    transactionIds: string[]
  ) => {
    try {
      if (!transactionIds.length) return;

      const response = await fetch("/api/transactions/shared-with/batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ transactionIds }),
      });

      if (!response.ok) {
        console.error("Failed to fetch shared users in batch");
        return;
      }

      const { sharedUsers } = await response.json();

      // Update transactions in state with sharing information
      setTransactions((prev) =>
        prev.map((transaction) => {
          const sharedWithUsers = sharedUsers[transaction.id];
          if (sharedWithUsers && sharedWithUsers.length > 0) {
            return {
              ...transaction,
              sharedWith: sharedWithUsers,
              isShared: true,
            };
          }
          return transaction;
        })
      );
    } catch (error) {
      console.error("Error fetching shared users in batch:", error);
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

  const updateTransaction = async (transaction: Transaction) => {
    try {
      const response = await fetch("/api/transactions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transaction),
      });

      if (!response.ok) throw new Error("Failed to update transaction");

      const updatedTransaction = await response.json();
      setTransactions((prev) =>
        prev.map((t) => (t.id === transaction.id ? updatedTransaction : t))
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
      // Parse CSV and validate required fields
      const parsedTransactions = parseCSV(csvContent);

      // Additional validation to ensure required fields are present
      const validTransactions = parsedTransactions.filter(
        (transaction) =>
          transaction.date &&
          transaction.vendor &&
          transaction.category &&
          transaction.transactionType
      );

      if (validTransactions.length === 0) {
        throw new Error(
          "No valid transactions found in CSV. Required fields: date, vendor, category, and transactionType"
        );
      }

      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validTransactions),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to import transactions");
      }

      await fetchTransactions(); // Refresh the transactions list
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to import transactions"
      );
      throw err;
    }
  };

  const shareTransaction = async (
    transaction: Transaction,
    userIds: string[]
  ) => {
    try {
      setLoading(true);

      // Ensure we have a transaction ID
      if (!transaction.id) {
        throw new Error("Cannot share transaction without an ID");
      }

      console.log(`Sharing transaction ${transaction.id} with users:`, userIds);

      const response = await fetch(
        `/api/transactions/${transaction.id}/share`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userIds }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to share transaction");
      }

      // Get the updated transaction with sharing information
      const updatedTransaction = await response.json();
      console.log("Transaction shared successfully:", updatedTransaction);

      // Ensure sharedWith is properly formatted in the updated transaction
      const processedTransaction = {
        ...updatedTransaction,
        isShared: true,
        sharedWith: Array.isArray(updatedTransaction.sharedWith)
          ? updatedTransaction.sharedWith
          : updatedTransaction.sharedWith
          ? [updatedTransaction.sharedWith]
          : [],
      };

      // Update the local state with the new shared transaction
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === transaction.id ? { ...t, ...processedTransaction } : t
        )
      );

      return processedTransaction;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to share transaction"
      );
      console.error("Error sharing transaction:", err);
      throw err;
    } finally {
      setLoading(false);
    }
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
    shareTransaction,
  };
};
