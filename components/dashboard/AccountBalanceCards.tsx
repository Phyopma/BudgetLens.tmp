"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, TrendingUp, TrendingDown, Edit, Plus, CreditCard, DollarSignIcon } from "lucide-react";
import { useAccountBalances, AccountType } from "@/hooks/useAccountBalances";
import { useBankAccounts, NewBankAccount } from "@/hooks/useBankAccounts";
import { format } from 'date-fns';

interface AccountBalanceCardsProps {
  className?: string;
}

export function AccountBalanceCards({ className }: AccountBalanceCardsProps) {
  const {
    accountBalances,
    loading: balancesLoading,
    error: balancesError,
    fetchAccountBalances,
    addAccountBalance,
    updateAccountBalance,
    getLatestBalances,
    getAccountBalanceSummary,
  } = useAccountBalances();

  const {
    bankAccounts,
    loading: accountsLoading,
    error: accountsError,
    fetchBankAccounts,
    addBankAccount,
    updateBankAccount,
    deleteBankAccount
  } = useBankAccounts();

  const [balanceDialogOpen, setBalanceDialogOpen] = useState(false);
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingBalance, setEditingBalance] = useState<{ id: string, accountType: AccountType, balance: number } | null>(null);
  const [balanceFormData, setBalanceFormData] = useState<{ accountType: AccountType, balance: string }>({ 
    accountType: 'AdvPlusBanking', 
    balance: '' 
  });
  const [accountFormData, setAccountFormData] = useState<NewBankAccount>({
    name: '',
    accountType: 'Checking',
    bankName: '',
    accountNumber: '',
    routingNumber: '',
    notes: ''
  });

  const latestBalances = getLatestBalances();
  const summary = getAccountBalanceSummary();

  const handleOpenBalanceDialog = (mode: 'add' | 'edit', accountType?: AccountType, id?: string, currentBalance?: number) => {
    setEditMode(mode === 'edit');
    if (mode === 'edit' && accountType && id !== undefined && currentBalance !== undefined) {
      setEditingBalance({ id, accountType, balance: currentBalance });
      setBalanceFormData({ accountType, balance: currentBalance.toString() });
    } else {
      setEditingBalance(null);
      setBalanceFormData({ accountType: 'AdvPlusBanking', balance: '' });
    }
    setBalanceDialogOpen(true);
  };

  const handleOpenAccountDialog = () => {
    setAccountFormData({
      name: '',
      accountType: 'Checking',
      bankName: '',
      accountNumber: '',
      routingNumber: '',
      notes: ''
    });
    setAccountDialogOpen(true);
  };

  const handleBalanceSubmit = async () => {
    try {
      const balanceValue = parseFloat(balanceFormData.balance);
      
      if (editMode && editingBalance) {
        await updateAccountBalance(editingBalance.id, { balance: balanceValue });
      } else {
        await addAccountBalance({
          accountType: balanceFormData.accountType,
          balance: balanceValue,
        });
      }

      setBalanceDialogOpen(false);
      fetchAccountBalances();
    } catch (err) {
      console.error('Error saving account balance:', err);
    }
  };

  const handleAccountSubmit = async () => {
    try {
      await addBankAccount(accountFormData);
      setAccountDialogOpen(false);
      fetchBankAccounts();
    } catch (err) {
      console.error('Error creating bank account:', err);
    }
  };
  
  const handleAccountFormChange = (field: keyof NewBankAccount, value: string) => {
    setAccountFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getAccountIcon = (accountType: AccountType) => {
    switch (accountType) {
      case 'AdvPlusBanking':
        return <DollarSign className="h-4 w-4 text-muted-foreground" />;
      case 'AdvantageSavings':
        return <TrendingUp className="h-4 w-4 text-muted-foreground" />;
      case 'ChaseCollege':
        return <TrendingDown className="h-4 w-4 text-muted-foreground" />;
      default:
        return <DollarSign className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getAccountName = (accountType: AccountType) => {
    switch (accountType) {
      case 'AdvPlusBanking':
        return 'Adv Plus Banking';
      case 'AdvantageSavings':
        return 'Advantage Savings';
      case 'ChaseCollege':
        return 'CHASE COLLEGE';
      default:
        return accountType;
    }
  };

  const getAccountDetails = (accountType: AccountType) => {
    switch (accountType) {
      case 'AdvPlusBanking':
        return 'Bank of America (...1629)';
      case 'AdvantageSavings':
        return 'Bank of America (...4749)';
      case 'ChaseCollege':
        return 'Chase (...2966)';
      default:
        return '';
    }
  };

  const getLastUpdated = (timestamp?: Date) => {
    if (!timestamp) return 'Not updated yet';
    return `Updated ${format(new Date(timestamp), 'h aaa')}`;
  };

  return (
    <div className={className}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Your Accounts</h2>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleOpenAccountDialog}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Account
        </Button>
      </div>

      {/* Bank Accounts */}
      {bankAccounts.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {bankAccounts.map((account) => (
            <Card key={account.id} className="bg-background hover:bg-accent/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {account.name}
                </CardTitle>
                {account.accountType.toLowerCase().includes('credit') ? 
                  <CreditCard className="h-4 w-4 text-muted-foreground" /> : 
                  <DollarSignIcon className="h-4 w-4 text-muted-foreground" />}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(account.latestBalance || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {account.bankName} {account.accountNumber ? `(...${account.accountNumber.slice(-4)})` : ''}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {account.accountType}
                  </p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0"
                    onClick={() => handleOpenBalanceDialog('add')}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="mb-8 p-6">
          <div className="text-center">
            <DollarSignIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No accounts yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Add your first bank account to start tracking your balances</p>
            <Button onClick={handleOpenAccountDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Account
            </Button>
          </div>
        </Card>
      )}

      <h2 className="text-xl font-semibold mb-4">Account Balances</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Account Balance Cards */}
        {Object.entries(latestBalances).map(([accountType, balance]) => (
          <Card key={accountType} className="bg-background hover:bg-accent/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {getAccountName(accountType as AccountType)}
              </CardTitle>
              {getAccountIcon(accountType as AccountType)}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {balance ? formatCurrency(balance.balance) : '$0.00'}
              </div>
              <p className="text-xs text-muted-foreground">
                {getAccountDetails(accountType as AccountType)}
              </p>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {balance ? getLastUpdated(balance.timestamp) : 'Not updated yet'}
                </p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0"
                  onClick={() => balance && handleOpenBalanceDialog('edit', accountType as AccountType, balance.id, balance.balance)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Total Balance Card */}
        <Card className="bg-green-100/90 hover:bg-green-200 dark:bg-green-900/90 dark:hover:bg-green-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary.totalBalance)}
            </div>
            <div className="flex items-center">
              {summary.monthlyDifference > 0 ? (
                <TrendingUp className="mr-1 h-4 w-4 text-green-500" />
              ) : summary.monthlyDifference < 0 ? (
                <TrendingDown className="mr-1 h-4 w-4 text-red-500" />
              ) : null}
              <p className={`text-xs ${summary.monthlyDifference > 0 ? 'text-green-500' : summary.monthlyDifference < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                {formatCurrency(summary.monthlyDifference)} ({summary.monthlyDifferencePercentage.toFixed(2)}%) from last month
              </p>
            </div>
            <div className="mt-2 flex justify-end">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0"
                onClick={() => handleOpenBalanceDialog('add')}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Balance Dialog */}
      <Dialog open={balanceDialogOpen} onOpenChange={setBalanceDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editMode ? 'Edit Account Balance' : 'Add New Account Balance'}</DialogTitle>
            <DialogDescription>
              {editMode ? 'Update the balance for this account.' : 'Add a new balance entry for tracking.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="accountType" className="text-right">
                Account
              </Label>
              <Select
                value={balanceFormData.accountType}
                onValueChange={(value: AccountType) => setBalanceFormData(prev => ({
                  ...prev,
                  accountType: value
                }))}
                disabled={editMode}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AdvPlusBanking">Adv Plus Banking</SelectItem>
                  <SelectItem value="AdvantageSavings">Advantage Savings</SelectItem>
                  <SelectItem value="ChaseCollege">CHASE COLLEGE</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="balance" className="text-right">
                Balance
              </Label>
              <Input
                id="balance"
                type="number"
                step="0.01"
                value={balanceFormData.balance}
                onChange={(e) => setBalanceFormData({ ...balanceFormData, balance: e.target.value })}
                className="col-span-3"
                placeholder="Enter balance"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="timestamp" className="text-right">
                Date
              </Label>
              <div className="col-span-3 text-sm text-muted-foreground">
                {new Date().toLocaleString()}
                <p className="text-xs">Current timestamp will be used</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleBalanceSubmit}>{editMode ? 'Update' : 'Add'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Bank Account Dialog */}
      <Dialog open={accountDialogOpen} onOpenChange={setAccountDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Bank Account</DialogTitle>
            <DialogDescription>
              Create a new bank account to track your balances.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Account Name
              </Label>
              <Input
                id="name"
                value={accountFormData.name}
                onChange={(e) => handleAccountFormChange('name', e.target.value)}
                className="col-span-3"
                placeholder="e.g. My Checking Account"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="accountType" className="text-right">
                Account Type
              </Label>
              <Select
                value={accountFormData.accountType}
                onValueChange={(value) => handleAccountFormChange('accountType', value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Checking">Checking</SelectItem>
                  <SelectItem value="Savings">Savings</SelectItem>
                  <SelectItem value="Credit Card">Credit Card</SelectItem>
                  <SelectItem value="Investment">Investment</SelectItem>
                  <SelectItem value="Loan">Loan</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="bankName" className="text-right">
                Bank Name
              </Label>
              <Input
                id="bankName"
                value={accountFormData.bankName}
                onChange={(e) => handleAccountFormChange('bankName', e.target.value)}
                className="col-span-3"
                placeholder="e.g. Chase, Bank of America"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="accountNumber" className="text-right">
                Account Number
              </Label>
              <Input
                id="accountNumber"
                value={accountFormData.accountNumber || ''}
                onChange={(e) => handleAccountFormChange('accountNumber', e.target.value)}
                className="col-span-3"
                placeholder="Last 4 digits (optional)"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="routingNumber" className="text-right">
                Routing Number
              </Label>
              <Input
                id="routingNumber"
                value={accountFormData.routingNumber || ''}
                onChange={(e) => handleAccountFormChange('routingNumber', e.target.value)}
                className="col-span-3"
                placeholder="Optional"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Notes
              </Label>
              <Input
                id="notes"
                value={accountFormData.notes || ''}
                onChange={(e) => handleAccountFormChange('notes', e.target.value)}
                className="col-span-3"
                placeholder="Optional notes about this account"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAccountSubmit}>Create Account</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}