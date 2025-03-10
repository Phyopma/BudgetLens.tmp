import { useState, useEffect } from 'react';
import type { BankAccount } from '@prisma/client';

interface BankAccountWithLatestBalance extends BankAccount {
  balances?: {
    id: string;
    balance: number;
    timestamp: Date;
  }[];
  latestBalance?: number;
}

export interface NewBankAccount {
  name: string;
  accountType: string;
  bankName: string;
  accountNumber?: string;
  routingNumber?: string;
  notes?: string;
}

export const useBankAccounts = () => {
  const [bankAccounts, setBankAccounts] = useState<BankAccountWithLatestBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBankAccounts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/bank-accounts');
      if (!response.ok) throw new Error('Failed to fetch bank accounts');

      const data = await response.json();
      
      // Process accounts to extract latest balance
      const processedAccounts = data.map((account: BankAccountWithLatestBalance) => ({
        ...account,
        latestBalance: account.balances && account.balances.length > 0 
          ? account.balances[0].balance 
          : 0
      }));
      
      setBankAccounts(processedAccounts);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const addBankAccount = async (bankAccount: NewBankAccount) => {
    try {
      const response = await fetch('/api/bank-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bankAccount),
      });

      if (!response.ok) throw new Error('Failed to add bank account');

      const newBankAccount = await response.json();
      setBankAccounts((prev) => [newBankAccount, ...prev]);

      return newBankAccount;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to add bank account'
      );
      throw err;
    }
  };

  const updateBankAccount = async (
    id: string,
    bankAccount: Partial<NewBankAccount>
  ) => {
    try {
      const response = await fetch('/api/bank-accounts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...bankAccount }),
      });

      if (!response.ok) throw new Error('Failed to update bank account');

      const updatedBankAccount = await response.json();
      setBankAccounts((prev) =>
        prev.map((ba) => (ba.id === id ? { ...ba, ...updatedBankAccount } : ba))
      );
      return updatedBankAccount;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update bank account'
      );
      throw err;
    }
  };

  const deleteBankAccount = async (id: string) => {
    try {
      const response = await fetch(`/api/bank-accounts?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete bank account');

      setBankAccounts((prev) => prev.filter((ba) => ba.id !== id));
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to delete bank account'
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