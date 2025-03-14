export interface Transaction {
  id?: string;
  date: string;
  vendor: string;
  amount: number;
  category: string;
  transactionType: string;
  tags: string[];
  userId?: string;
  sharedWith?: SharedUser[];
}

export interface SharedUser {
  id: string;
  name?: string;
  email: string;
}

export interface Invitation {
  id?: string;
  email: string;
  status: 'pending' | 'accepted' | 'rejected';
  senderId?: string;
  recipientId?: string;
  sender?: SharedUser;
  recipient?: SharedUser;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CategoryTotal {
  category: string;
  total: number;
  percentage: number;
}

export interface MonthlySpending {
  month: string;
  total: number;
}

export type MetricType = "expenses" | "income" | "savings";
