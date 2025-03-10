import { Transaction, CategoryTotal, MonthlySpending } from '../types';

export const parseCSV = (csvContent: string): Transaction[] => {
  const lines = csvContent.trim().split('\n');
  const transactions = lines.slice(1).map(line => {
    const fields = [];
    let currentField = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        fields.push(currentField.trim().replace(/^"|"$/g, ''));
        currentField = '';
      } else {
        currentField += char;
      }
    }
    fields.push(currentField.trim().replace(/^"|"$/g, ''));


    const [date, vendor, amount, category, transactionType, accountName, labels, notes] = fields;
    // Convert date from MM-DD-YYYY to YYYY-MM-DD format
    const [month, day, year] = date.split('/');
    const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    return {
      date: formattedDate,
      vendor,
      amount: amount ? parseFloat(amount.replace(/[^\d.-]/g, '')) : 0,
      category,
      transactionType,
      tags: ["Me"]
    };
  });
  return filterDuplicateTransfers(transactions);
};


export const filterDuplicateTransfers = (transactions) => {
  // Separate transactions by category.
  const nonTransfers = transactions.filter(tx => tx.category.toLowerCase() !== 'transfer');
  const transfers = transactions.filter(tx => tx.category.toLowerCase() === 'transfer');

  // We'll mark transfer transactions that have a complementary match for removal.
  const removedIndices = new Set();

  // Compare each transfer with every other to find complementary pairs.
  for (let i = 0; i < transfers.length; i++) {
    if (removedIndices.has(i)) continue;
    for (let j = i + 1; j < transfers.length; j++) {
      if (removedIndices.has(j)) continue;

      // Check if transactions have the same date and amount,
      // and that one is a credit and the other a debit.
      if (
        transfers[i].amount === transfers[j].amount &&
        ((transfers[i].transactionType === 'credit' && transfers[j].transactionType === 'debit') ||
         (transfers[i].transactionType === 'debit' && transfers[j].transactionType === 'credit'))
      ) {
        // Mark both transactions for removal.
        removedIndices.add(i);
        removedIndices.add(j);
        break; // Once paired, move to the next transaction.
      }
    }
  }

  // Retain only transfer transactions that weren't flagged for removal.
  const filteredTransfers = transfers.filter((_, idx) => !removedIndices.has(idx));

  // Return the combination of non-transfer transactions and filtered transfer transactions.
  return [...nonTransfers, ...filteredTransfers];
};

export const calculateCategoryTotals = (transactions: Transaction[]): CategoryTotal[] => {
  const categoryMap = new Map<string, number>();
  const total = transactions.reduce((sum, t) => sum + t.amount, 0);

  transactions.forEach(t => {
    categoryMap.set(t.category, (categoryMap.get(t.category) || 0) + t.amount);
  });

  return Array.from(categoryMap.entries()).map(([category, amount]) => ({
    category,
    total: amount,
    percentage: (amount / total) * 100
  }));
};

export const calculateMonthlySpending = (transactions: Transaction[]): MonthlySpending[] => {
  const monthlyMap = new Map<string, number>();

  transactions.forEach(t => {
    const month = t.date.substring(0, 2);
    const year = t.date.substring(6, 10);
    const key = `${year}-${month}`;
    monthlyMap.set(key, (monthlyMap.get(key) || 0) + t.amount);
  });

  return Array.from(monthlyMap.entries())
    .map(([month, total]) => ({ month, total }))
    .sort((a, b) => a.month.localeCompare(b.month));
};