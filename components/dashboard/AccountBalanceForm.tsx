"use client";

import React from "react";
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
import { DollarSign } from "lucide-react";
import type { BankAccount } from "@prisma/client";

interface AccountBalanceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bankAccounts: BankAccount[];
  onSubmit: (accountId: string, balance: number) => Promise<void>;
  initialData?: {
    accountId: string;
    balance: number;
  };
}

export function AccountBalanceForm({
  mode,
  open,
  onOpenChange,
  bankAccounts,
  onSubmit,
  initialData,
}: AccountBalanceFormProps) {
  const [error, setError] = React.useState<string | null>(null);

  const [formData, setFormData] = React.useState<{
    accountId: string;
    balance: string;
  }>({
    accountId: initialData?.accountId || "",
    balance: initialData?.balance?.toString() || "",
  });

  React.useEffect(() => {
    if (initialData) {
      setFormData({
        accountId: initialData.accountId,
        balance: initialData.balance.toString(),
      });
    }
  }, [initialData]);

  const handleFormChange = (
    field: keyof typeof formData,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      const balance = parseFloat(formData.balance);
      if (isNaN(balance)) {
        throw new Error("Please enter a valid number for balance");
      }
      await onSubmit(formData.accountId, balance);
      onOpenChange(false);
      // Reset form
      setFormData({ accountId: "", balance: "" });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      console.error("Error submitting balance:", errorMessage);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) {
          // Reset form and error when dialog is closed
          setFormData({ accountId: "", balance: "" });
          setError(null);
        }
        onOpenChange(open);
      }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Record Balance</DialogTitle>
          <DialogDescription>
            Record a new balance for your account. If an entry exists for this month,
            it will be updated.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
            {error}
          </div>
        )}
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="balanceAccount" className="text-right">
              Account
            </Label>
            <Select
              value={formData.accountId}
              onValueChange={(value) => {
                handleFormChange("accountId", value);
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
                value={formData.balance}
                onChange={(e) =>
                  handleFormChange("balance", e.target.value)
                }
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}