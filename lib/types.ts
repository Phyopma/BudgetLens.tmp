export interface User {
  id: string;
  name: string;
  email: string;
  isConnected?: boolean;
}

export interface SharedUser {
  id: string;
  name?: string;
  email: string;
}

export interface Transaction {
  id: string;
  date: string;
  vendor: string;
  amount: number;
  category: string;
  transactionType: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  user?: {
    id: string;
    name?: string;
    email: string;
  };
  isShared?: boolean;
  sharedBy?: {
    id: string;
    name: string;
  };
  sharedWith?: SharedUser[];
}

export interface Invitation {
  id?: string;
  email: string;
  status: "pending" | "accepted" | "rejected";
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
