import { useState, useEffect } from 'react';
import type { AccountBalance } from '@prisma/client';

export type AccountType = 'AdvPlusBanking' | 'AdvantageSavings' | 'ChaseCollege';

export interface AccountBalanceSummary {
  totalBalance: number;
  previousMonthTotal: number;
  monthlyDifference: number;
  monthlyDifferencePercentage: number;
}

export const useAccountBalances = () => {
  const [accountBalances, setAccountBalances] = useState<AccountBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccountBalances = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/account-balances');
      if (!response.ok) throw new Error('Failed to fetch account balances');

      const data = await response.json();
      setAccountBalances(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const addAccountBalance = async (accountBalance: {
    accountType: AccountType;
    balance: number;
  }) => {
    try {
      const response = await fetch('/api/account-balances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(accountBalance),
      });

      if (!response.ok) throw new Error('Failed to add account balance');

      const newAccountBalance = await response.json();
      setAccountBalances((prev) => [newAccountBalance, ...prev]);

      return newAccountBalance;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to add account balance'
      );
      throw err;
    }
  };

  const updateAccountBalance = async (
    id: string,
    accountBalance: Partial<AccountBalance>
  ) => {
    try {
      const response = await fetch('/api/account-balances', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...accountBalance }),
      });

      if (!response.ok) throw new Error('Failed to update account balance');

      const updatedAccountBalance = await response.json();
      setAccountBalances((prev) =>
        prev.map((ab) => (ab.id === id ? updatedAccountBalance : ab))
      );
      return updatedAccountBalance;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update account balance'
      );
      throw err;
    }
  };

  const getLatestBalances = () => {
    const latestBalances: Record<AccountType, AccountBalance | undefined> = {
      AdvPlusBanking: undefined,
      AdvantageSavings: undefined,
      ChaseCollege: undefined,
    };

    // Group by account type
    const balancesByType = accountBalances.reduce<Record<string, AccountBalance[]>>(
      (acc, balance) => {
        if (!acc[balance.accountType]) {
          acc[balance.accountType] = [];
        }
        acc[balance.accountType].push(balance);
        return acc;
      },
      {}
    );

    // Get the latest balance for each account type
    Object.entries(balancesByType).forEach(([type, balances]) => {
      if (balances.length > 0) {
        // Sort by timestamp in descending order
        const sorted = [...balances].sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        latestBalances[type as AccountType] = sorted[0];
      }
    });

    return latestBalances;
  };

  const getAccountBalanceSummary = (): AccountBalanceSummary => {
    const latestBalances = getLatestBalances();
    const totalBalance = Object.values(latestBalances).reduce(
      (sum, balance) => sum + (balance?.balance || 0),
      0
    );

    // Calculate previous month's total
    const currentDate = new Date();
    const previousMonthDate = new Date(currentDate);
    previousMonthDate.setMonth(previousMonthDate.getMonth() - 1);

    // Filter balances from previous month
    const previousMonthBalances = accountBalances.filter(balance => {
      const balanceDate = new Date(balance.timestamp);
      return (
        balanceDate.getMonth() === previousMonthDate.getMonth() &&
        balanceDate.getFullYear() === previousMonthDate.getFullYear()
      );
    });

    // Group by account type and get the latest for each type in the previous month
    const prevMonthLatestByType: Record<string, AccountBalance> = {};
    previousMonthBalances.forEach(balance => {
      const existing = prevMonthLatestByType[balance.accountType];
      if (!existing || new Date(balance.timestamp) > new Date(existing.timestamp)) {
        prevMonthLatestByType[balance.accountType] = balance;
      }
    });

    const previousMonthTotal = Object.values(prevMonthLatestByType).reduce(
      (sum, balance) => sum + (balance?.balance || 0),
      0
    );

    const monthlyDifference = totalBalance - previousMonthTotal;
    const monthlyDifferencePercentage = previousMonthTotal !== 0 
      ? (monthlyDifference / previousMonthTotal) * 100 
      : 0;

    return {
      totalBalance,
      previousMonthTotal,
      monthlyDifference,
      monthlyDifferencePercentage,
    };
  };

  useEffect(() => {
    fetchAccountBalances();
  }, []);

  return {
    accountBalances,
    loading,
    error,
    fetchAccountBalances,
    addAccountBalance,
    updateAccountBalance,
    getLatestBalances,
    getAccountBalanceSummary,
  };
};