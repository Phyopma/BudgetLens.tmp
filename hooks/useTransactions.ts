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

      // Enhance transaction data with shared information
      const processedData = data.map((transaction: any) => {
        // For transactions others have shared with the current user
        if (transaction.sharedBy) {
          return {
            ...transaction,
            isShared: true,
          };
        }

        // For the user's own transactions, fetch the users they've shared with
        if (!transaction.sharedWith) {
          // If transaction doesn't have sharedWith info, try to get it if transaction id exists
          if (transaction.id) {
            // We want to modify this in a separate fetch to avoid blocking the UI
            fetchSharedWithUsers(transaction.id)
              .then((users) => {
                if (users && users.length > 0) {
                  setTransactions((prev) =>
                    prev.map((t) =>
                      t.id === transaction.id
                        ? { ...t, sharedWith: users, isShared: true }
                        : t
                    )
                  );
                }
              })
              .catch((err) => {
                console.error(
                  "Error fetching shared users for transaction:",
                  err
                );
              });
          }
          return {
            ...transaction,
            sharedWith: [],
          };
        }

        // If transaction already has sharedWith data, make sure it's an array
        return {
          ...transaction,
          isShared: transaction.sharedWith?.length > 0,
          sharedWith: Array.isArray(transaction.sharedWith)
            ? transaction.sharedWith
            : transaction.sharedWith
            ? [transaction.sharedWith]
            : [],
        };
      });

      setTransactions(processedData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to fetch users a transaction is shared with
  const fetchSharedWithUsers = async (transactionId: string) => {
    try {
      const response = await fetch(
        `/api/transactions/${transactionId}/shared-with`
      );
      if (!response.ok) throw new Error("Failed to fetch shared users");
      const data = await response.json();
      return data.users || [];
    } catch (error) {
      console.error("Error fetching shared users:", error);
      return [];
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
