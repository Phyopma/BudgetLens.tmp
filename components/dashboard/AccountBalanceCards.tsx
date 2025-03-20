"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Edit,
  Plus,
  CreditCard,
  DollarSignIcon,
  MoreVertical,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAccountBalances, AccountType } from "@/hooks/useAccountBalances";
import { useBankAccounts, NewBankAccount } from "@/hooks/useBankAccounts";
import { format } from "date-fns";

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
    deleteBankAccount,
  } = useBankAccounts();

  const [balanceDialogOpen, setBalanceDialogOpen] = useState(false);
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingBalance, setEditingBalance] = useState<{
    id: string;
    accountId: string;
    balance: number;
  } | null>(null);
  const [balanceFormData, setBalanceFormData] = useState<{
    accountId: string;
    balance: string;
  }>({
    accountId: "",
    balance: "",
  });
  const [accountFormData, setAccountFormData] = useState<NewBankAccount>({
    name: "",
    accountType: "Checking",
    bankName: "",
    accountNumber: "",
    routingNumber: "",
    notes: "",
  });

  const [isEditMode, setIsEditMode] = useState(false);
  const [editingAccount, setEditingAccount] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null);

  const latestBalances = getLatestBalances();
  const summary = getAccountBalanceSummary();

  const handleOpenBalanceDialog = (
    mode: "add" | "edit",
    accountId?: string,
    id?: string,
    currentBalance?: number
  ) => {
    setEditMode(mode === "edit");
    if (
      mode === "edit" &&
      accountId &&
      id !== undefined &&
      currentBalance !== undefined
    ) {
      setEditingBalance({
        id,
        accountId: accountId,
        balance: currentBalance,
      });
      setBalanceFormData({
        accountId: accountId,
        balance: currentBalance.toString(),
      });
    } else {
      setEditingBalance(null);
      // Use first account as default if available
      const defaultAccount = bankAccounts.length > 0 ? bankAccounts[0].id : "";
      setBalanceFormData({ accountId: defaultAccount, balance: "" });
    }
    setBalanceDialogOpen(true);
  };

  const handleOpenAccountDialog = (isEdit = false, accountId?: string) => {
    setIsEditMode(isEdit);

    if (isEdit && accountId) {
      const accountToEdit = bankAccounts.find((acc) => acc.id === accountId);
      if (accountToEdit) {
        setEditingAccount(accountId);
        setAccountFormData({
          name: accountToEdit.name,
          accountType: accountToEdit.accountType,
          bankName: accountToEdit.bankName || "",
          accountNumber: accountToEdit.accountNumber || "",
          routingNumber: accountToEdit.routingNumber || "",
          notes: accountToEdit.notes || "",
        });
      }
    } else {
      // Reset form with default values explicitly set
      setEditingAccount(null);
      setAccountFormData({
        name: "",
        accountType: "Checking",
        bankName: "",
        accountNumber: "",
        routingNumber: "",
        notes: "",
      });
    }

    setAccountDialogOpen(true);
  };

  const handleAccountSubmit = async () => {
    try {
      if (isEditMode && editingAccount) {
        await updateBankAccount(editingAccount, accountFormData);
      } else {
        // When creating a new account, if the user provided an initial balance
        const newAccount = await addBankAccount(accountFormData);

        // If we successfully created the account, immediately add a balance of 0
        // This ensures the latestBalance property will be available
        if (newAccount && newAccount.id) {
          try {
            await addAccountBalance(newAccount.id, 0);
          } catch (err) {
            console.error(
              "Failed to set initial balance for new account:",
              err
            );
          }
        }
      }
      setAccountDialogOpen(false);
      fetchBankAccounts();
    } catch (err) {
      console.error(
        `Error ${isEditMode ? "updating" : "creating"} bank account:`,
        err
      );
    }
  };

  const handleDeleteAccount = (accountId: string) => {
    setAccountToDelete(accountId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteAccount = async () => {
    if (accountToDelete) {
      try {
        await deleteBankAccount(accountToDelete);
        setDeleteDialogOpen(false);
        fetchBankAccounts();
      } catch (err) {
        console.error("Error deleting bank account:", err);
      }
    }
  };

  const handleAccountFormChange = (
    field: keyof NewBankAccount,
    value: string
  ) => {
    setAccountFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleBalanceFormChange = (
    field: keyof typeof balanceFormData,
    value: string
  ) => {
    setBalanceFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleBalanceSubmit = async () => {
    try {
      const balance = parseFloat(balanceFormData.balance);
      if (isNaN(balance)) {
        throw new Error("Please enter a valid number for balance");
      }

      if (editMode && editingBalance) {
        await updateAccountBalance(
          editingBalance.id,
          editingBalance.accountId,
          balance
        );
      } else {
        await addAccountBalance(balanceFormData.accountId, balance);
      }
      setBalanceDialogOpen(false);
      // Refresh both account balances and bank accounts to update UI
      fetchAccountBalances();
      fetchBankAccounts();
    } catch (err) {
      console.error("Error updating balance:", err);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getLastUpdated = (timestamp?: Date) => {
    if (!timestamp) return "Not updated yet";
    return `Updated ${format(new Date(timestamp), "h aaa")}`;
  };

  return (
    <div className={className}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Your Accounts</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleOpenAccountDialog()}>
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
                <div className="flex items-center space-x-1">
                  {account.accountType.toLowerCase().includes("credit") ? (
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() =>
                          handleOpenAccountDialog(true, account.id)
                        }>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => handleDeleteAccount(account.id)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(account.balances[0].balance)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {account.bankName}{" "}
                  {account.accountNumber
                    ? `(...${account.accountNumber.slice(-4)})`
                    : ""}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {account.accountType}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleOpenBalanceDialog("add", account.id)}>
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
            <p className="text-sm text-muted-foreground mb-4">
              Add your first bank account to start tracking your balances
            </p>
            <Button onClick={handleOpenAccountDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Account
            </Button>
          </div>
        </Card>
      )}

      {/* Balance Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 mb-8">
        {/* Total Balance Card */}
        <Card className="bg-green-100/90 hover:bg-green-200 dark:bg-green-900/90 dark:hover:bg-green-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Current Balance
            </CardTitle>
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
              <p
                className={`text-xs ${
                  summary.monthlyDifference > 0
                    ? "text-green-500"
                    : summary.monthlyDifference < 0
                    ? "text-red-500"
                    : "text-muted-foreground"
                }`}>
                {formatCurrency(summary.monthlyDifference)} (
                {summary.monthlyDifferencePercentage.toFixed(2)}%) from last
                month
              </p>
            </div>
            <div className="mt-2 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => handleOpenBalanceDialog("add")}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Last Month's Balance Card */}
        <Card className="bg-blue-100/90 hover:bg-blue-200 dark:bg-blue-900/90 dark:hover:bg-blue-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Last Month's Balance
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary.totalBalance - summary.monthlyDifference)}
            </div>
            <div className="flex items-center">
              <p className="text-xs text-muted-foreground">
                As of{" "}
                {format(
                  new Date(new Date().setMonth(new Date().getMonth() - 1)),
                  "MMMM yyyy"
                )}
              </p>
            </div>
            <div className="mt-9">
              {/* Empty div to match the height of the button in the other card */}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Bank Account Dialog */}
      <Dialog open={accountDialogOpen} onOpenChange={setAccountDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? "Edit Bank Account" : "Add New Bank Account"}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? "Update your bank account details."
                : "Create a new bank account to track your balances."}
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
                onChange={(e) =>
                  handleAccountFormChange("name", e.target.value)
                }
                className="col-span-3"
                placeholder="e.g. My Checking Account"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="accountType" className="text-right">
                Account Type
              </Label>
              <Select
                defaultValue="Checking"
                value={accountFormData.accountType || "Checking"}
                onValueChange={(value) => {
                  handleAccountFormChange("accountType", value);
                }}>
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
                onChange={(e) =>
                  handleAccountFormChange("bankName", e.target.value)
                }
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
                value={accountFormData.accountNumber || ""}
                onChange={(e) =>
                  handleAccountFormChange("accountNumber", e.target.value)
                }
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
                value={accountFormData.routingNumber || ""}
                onChange={(e) =>
                  handleAccountFormChange("routingNumber", e.target.value)
                }
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
                value={accountFormData.notes || ""}
                onChange={(e) =>
                  handleAccountFormChange("notes", e.target.value)
                }
                className="col-span-3"
                placeholder="Optional notes about this account"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAccountSubmit}>
              {isEditMode ? "Save Changes" : "Create Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Balance Dialog */}
      <Dialog open={balanceDialogOpen} onOpenChange={setBalanceDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editMode ? "Update Balance" : "Add New Balance"}
            </DialogTitle>
            <DialogDescription>
              {editMode
                ? "Update your account balance."
                : "Record a new balance for your account."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="balanceAccount" className="text-right">
                Account
              </Label>
              <Select
                value={balanceFormData.accountId}
                disabled={editMode}
                onValueChange={(value) => {
                  handleBalanceFormChange("accountId", value);
                }}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="balance" className="text-right">
                Balance
              </Label>
              <div className="relative col-span-3">
                <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="balance"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="pl-8"
                  value={balanceFormData.balance}
                  onChange={(e) =>
                    handleBalanceFormChange("balance", e.target.value)
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleBalanceSubmit}>
              {editMode ? "Update" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this bank account and all associated
              balance records. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteAccount}
              className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
