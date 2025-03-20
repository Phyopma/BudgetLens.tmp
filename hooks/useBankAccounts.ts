import { useState, useEffect } from "react";

export interface BankAccount {
  id: string;
  name: string;
  accountType: string;
  bankName: string | null;
  accountNumber: string | null;
  routingNumber: string | null;
  notes: string | null;
  latestBalance?: number; // Make it optional since it's a virtual property
  balances?: { balance: number; timestamp: Date }[];
}

export type NewBankAccount = Omit<
  BankAccount,
  "id" | "latestBalance" | "balances"
>;

export const useBankAccounts = () => {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBankAccounts = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/bank-accounts");

      if (!response.ok) {
        throw new Error("Failed to fetch bank accounts");
      }

      const data = await response.json();

      // Ensure each account has a latestBalance property (even if it's 0)
      const processedAccounts = data.map((account: BankAccount) => ({
        ...account,
        latestBalance: account.latestBalance ?? 0,
      }));

      setBankAccounts(processedAccounts);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching bank accounts:", err);
    } finally {
      setLoading(false);
    }
  };

  const addBankAccount = async (accountData: NewBankAccount) => {
    try {
      const response = await fetch("/api/bank-accounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(accountData),
      });

      if (!response.ok) {
        throw new Error("Failed to add bank account");
      }

      const newAccount = await response.json();
      setBankAccounts((prev) => [...prev, { ...newAccount, latestBalance: 0 }]);
      return newAccount;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to add bank account"
      );
      console.error("Error adding bank account:", err);
      throw err;
    }
  };

  const updateBankAccount = async (
    id: string,
    bankAccount: Partial<NewBankAccount>
  ) => {
    try {
      const response = await fetch("/api/bank-accounts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...bankAccount }),
      });

      if (!response.ok) throw new Error("Failed to update bank account");

      const updatedBankAccount = await response.json();
      setBankAccounts((prev) =>
        prev.map((ba) => (ba.id === id ? { ...ba, ...updatedBankAccount } : ba))
      );
      return updatedBankAccount;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update bank account"
      );
      throw err;
    }
  };

  const deleteBankAccount = async (id: string) => {
    try {
      const response = await fetch(`/api/bank-accounts?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete bank account");

      setBankAccounts((prev) => prev.filter((ba) => ba.id !== id));
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete bank account"
      );
      throw err;
    }
  };

  useEffect(() => {
    fetchBankAccounts();
  }, []);

  return {
    bankAccounts,
    loading,
    error,
    fetchBankAccounts,
    addBankAccount,
    updateBankAccount,
    deleteBankAccount,
  };
};
