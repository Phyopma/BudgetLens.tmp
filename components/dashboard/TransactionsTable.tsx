"use client";

import { Transaction } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlusCircle, Pencil, Trash2, Copy, X, Share2 } from "lucide-react";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface User {
  id: string;
  name: string;
  email: string;
}

interface TransactionsTableProps {
  transactions: Transaction[];
  onAddTransaction?: (transaction: Transaction) => void;
  onUpdateTransaction?: (
    oldTransaction: Transaction,
    newTransaction: Transaction
  ) => void;
  onDeleteTransaction?: (transaction: Transaction) => void;
  onShareTransaction?: (transaction: Transaction, userIds: string[]) => void;
}

export function TransactionsTable({
  transactions,
  onAddTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
  onShareTransaction,
}: TransactionsTableProps) {
  const [search, setSearch] = useState("");
  const [isAddingTransaction, setIsAddingTransaction] = useState(false);
  const [isEditingTransaction, setIsEditingTransaction] = useState(false);
  const [isDeletingTransaction, setIsDeletingTransaction] = useState(false);
  const [isSharingTransaction, setIsSharingTransaction] = useState(false);
  const [transactionToDelete, setTransactionToDelete] =
    useState<Transaction | null>(null);
  const [transactionToShare, setTransactionToShare] =
    useState<Transaction | null>(null);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [newTransaction, setNewTransaction] = useState<Partial<Transaction>>({
    date: new Date().toISOString().split("T")[0],
    amount: 0,
    vendor: "",
    category: "",
    transactionType: "",
  });
  const [openCategory, setOpenCategory] = useState(false);
  const [openType, setOpenType] = useState(false);
  const [openVendor, setOpenVendor] = useState(false);
  const [sortColumn, setSortColumn] = useState<keyof Transaction | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const [isNewCategoryDialogOpen, setIsNewCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const [isNewTypeDialogOpen, setIsNewTypeDialogOpen] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");

  const [isNewVendorDialogOpen, setIsNewVendorDialogOpen] = useState(false);
  const [newVendorName, setNewVendorName] = useState("");

  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  const handleSort = (column: keyof Transaction) => {
    if (sortColumn === column) {
      // If clicking the same column, toggle direction
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      // If clicking a new column, set it as the sort column with ascending order
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const uniqueCategories = Array.from(
    new Set(transactions.map((t) => t.category))
  ).sort();
  const uniqueTypes = Array.from(
    new Set(transactions.map((t) => t.transactionType))
  ).sort();
  const uniqueVendors = Array.from(
    new Set(transactions.map((t) => t.vendor))
  ).sort();

  const handleAddTransaction = () => {
    if (
      newTransaction.date &&
      newTransaction.amount &&
      newTransaction.vendor &&
      newTransaction.category &&
      newTransaction.transactionType
    ) {
      onAddTransaction?.({
        date: newTransaction.date,
        amount: parseFloat(newTransaction.amount as unknown as string),
        vendor: newTransaction.vendor,
        category: newTransaction.category,
        transactionType: newTransaction.transactionType,
      } as Transaction);
      setIsAddingTransaction(false);
      setNewTransaction({
        date: new Date().toISOString().split("T")[0],
        amount: 0,
        vendor: "",
        category: "",
        transactionType: "",
      });
    }
  };

  const handleUpdateTransaction = () => {
    if (
      editingTransaction &&
      newTransaction.date &&
      newTransaction.amount &&
      newTransaction.vendor &&
      newTransaction.category &&
      newTransaction.transactionType
    ) {
      onUpdateTransaction?.(editingTransaction, {
        date: newTransaction.date,
        amount: parseFloat(newTransaction.amount as unknown as string),
        vendor: newTransaction.vendor,
        category: newTransaction.category,
        transactionType: newTransaction.transactionType,
      } as Transaction);
      setIsEditingTransaction(false);
      setEditingTransaction(null);
      setNewTransaction({
        date: new Date().toISOString().split("T")[0],
        amount: 0,
        vendor: "",
        category: "",
        transactionType: "",
      });
    }
  };

  const handleDeleteConfirm = () => {
    if (transactionToDelete && onDeleteTransaction) {
      onDeleteTransaction(transactionToDelete);
      setTransactionToDelete(null);
      setIsDeletingTransaction(false);
    }
  };

  const startEditing = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setNewTransaction({
      date: transaction.date,
      amount: transaction.amount,
      vendor: transaction.vendor,
      category: transaction.category,
      transactionType: transaction.transactionType,
    });
    setIsEditingTransaction(true);
  };

  const handleAddNewCategory = () => {
    if (newCategoryName.trim()) {
      // Add the new category to the list of unique categories
      const updatedCategories = [
        ...new Set([...uniqueCategories, newCategoryName.trim()]),
      ];

      // Update the categories
      // setCategories(updatedCategories);

      // Set the new transaction's category to the newly added category
      setNewTransaction((prev) => ({
        ...prev,
        category: newCategoryName.trim(),
      }));

      // Reset and close the dialog
      setNewCategoryName("");
      setIsNewCategoryDialogOpen(false);
    }
  };

  const handleAddNewType = () => {
    if (newTypeName.trim()) {
      // Add the new type to the list of unique types
      const updatedTypes = [...new Set([...uniqueTypes, newTypeName.trim()])];

      // Update the transaction types
      // setTransactionTypes(updatedTypes);

      // Set the new transaction's type to the newly added type
      setNewTransaction((prev) => ({
        ...prev,
        transactionType: newTypeName.trim(),
      }));

      // Reset and close the dialog
      setNewTypeName("");
      setIsNewTypeDialogOpen(false);
    }
  };

  const handleAddNewVendor = (vendor: string) => {
    if (vendor && !uniqueVendors.includes(vendor)) {
      setNewTransaction((prev) => ({ ...prev, vendor }));
      setOpenVendor(false);
    }
  };

  const handleCopyTransaction = (transaction: Transaction) => {
    setNewTransaction({
      date: new Date().toISOString().split("T")[0],
      amount: transaction.amount,
      vendor: transaction.vendor,
      category: transaction.category,
      transactionType: transaction.transactionType,
    });
    setIsAddingTransaction(true);
  };

  // Diagnostic function to help troubleshoot
  const diagnoseShareIssue = () => {
    console.log("Transaction sharing diagnosis:");
    console.log("- Transaction to share:", transactionToShare);
    console.log("- Selected user IDs:", selectedUserIds);
    console.log("- onShareTransaction prop available:", !!onShareTransaction);

    // Check if the ID exists on the transaction
    if (transactionToShare) {
      console.log("- Transaction ID exists:", !!transactionToShare.id);
    }

    return {
      hasTransaction: !!transactionToShare,
      hasTransactionId: transactionToShare?.id ? true : false,
      selectedUserCount: selectedUserIds.length,
      hasShareFunction: !!onShareTransaction,
    };
  };

  const handleShareTransaction = () => {
    // Run diagnostics
    const diagnosis = diagnoseShareIssue();
    console.log("Sharing diagnosis:", diagnosis);

    if (
      transactionToShare &&
      transactionToShare.id && // Ensure transaction has ID
      selectedUserIds.length > 0 &&
      onShareTransaction
    ) {
      console.log(
        "All conditions met, sharing transaction:",
        transactionToShare.id
      );

      try {
        onShareTransaction(transactionToShare, selectedUserIds);
      } catch (error) {
        console.error("Error in handleShareTransaction:", error);
      } finally {
        // Always clean up the UI state
        setIsSharingTransaction(false);
        setTransactionToShare(null);
        setSelectedUserIds([]);
      }
    } else {
      // Show detailed warning about what's missing
      console.warn("Share transaction requirements not met:", diagnosis);

      // If there's no share function, that's the main issue to highlight
      if (!onShareTransaction) {
        console.error(
          "onShareTransaction function is not provided to the component"
        );
        alert(
          "Sharing functionality is not available. onShareTransaction function is missing."
        );
      }
    }
  };

  // Make sure share icon handler properly sets the transaction
  const handleOpenShareDialog = (transaction: Transaction) => {
    console.log("Opening share dialog for transaction:", transaction);
    if (!transaction.id) {
      console.error("Transaction is missing ID:", transaction);
      alert("Cannot share transaction: Missing ID");
      return;
    }

    // Reset selected users when opening for a new transaction
    setSelectedUserIds([]);
    setTransactionToShare(transaction);
    setIsSharingTransaction(true);
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const filteredTransactions = transactions.filter((t) => {
    const searchTerm = search.toLowerCase();
    return (
      (t.vendor?.toLowerCase() || "").includes(searchTerm) ||
      (t.category?.toLowerCase() || "").includes(searchTerm) ||
      (t.transactionType?.toLowerCase() || "").includes(searchTerm) ||
      (t.amount?.toString() || "").includes(searchTerm) ||
      (t.date?.toLowerCase() || "").includes(searchTerm)
    );
  });

  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    if (!sortColumn) return 0;

    const aValue = a[sortColumn];
    const bValue = b[sortColumn];

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
    }

    return 0;
  });

  useEffect(() => {
    if (isSharingTransaction) {
      fetchConnectedUsers();
    }
  }, [isSharingTransaction]);

  const fetchConnectedUsers = async () => {
    setIsLoadingUsers(true);
    try {
      console.log("Fetching connected users...");

      // Try App Router API endpoint first
      const response = await fetch("/api/connections/accepted", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Connected users response:", data);

        // Check for different response formats
        if (Array.isArray(data)) {
          console.log("Setting users from array data");
          setUsers(data);
        } else if (data.connections && Array.isArray(data.connections)) {
          console.log("Setting users from data.connections");
          setUsers(data.connections);
        } else if (data.users && Array.isArray(data.users)) {
          console.log("Setting users from data.users");
          setUsers(data.users);
        } else if (data.data && Array.isArray(data.data)) {
          console.log("Setting users from data.data");
          setUsers(data.data);
        } else {
          console.warn("No recognized user data structure found:", data);
          // As a fallback, try to extract users from any array property in the response
          const firstArrayProperty = Object.keys(data).find(
            (key) => Array.isArray(data[key]) && data[key].length > 0
          );

          if (firstArrayProperty) {
            console.log(`Using data from '${firstArrayProperty}' property`);
            setUsers(data[firstArrayProperty]);
          } else {
            console.error("Could not find any user data in response");
            setUsers([]);
          }
        }
      } else {
        console.error(
          "Failed to fetch connected users:",
          await response.text()
        );
        throw new Error("Failed to load connected users");
      }
    } catch (error) {
      console.error("Failed to fetch connected users:", error);
      setUsers([]); // Set empty array on error to avoid showing loading state forever
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Add a useEffect to check if onShareTransaction is defined
  useEffect(() => {
    console.log("onShareTransaction available:", !!onShareTransaction);
  }, [onShareTransaction]);

  const renderSharingDialog = () => (
    <Dialog
      open={isSharingTransaction}
      onOpenChange={(open) => {
        if (!open) {
          // Clean up when dialog is closed
          setTransactionToShare(null);
          setSelectedUserIds([]);
        }
        setIsSharingTransaction(open);
      }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Transaction</DialogTitle>
          <DialogDescription>
            Share this transaction with users who have accepted your connection
            invitation.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {isLoadingUsers ? (
            <div className="flex justify-center py-4">
              Loading connected users...
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              <p>No connected users found.</p>
              <p className="text-sm mt-1">
                Send invitations to connect with other users.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent">
                  <input
                    type="checkbox"
                    id={`user-${user.id}`}
                    checked={selectedUserIds.includes(user.id)}
                    onChange={() => toggleUserSelection(user.id)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <label
                    htmlFor={`user-${user.id}`}
                    className="flex-1 cursor-pointer">
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {user.email}
                    </div>
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setIsSharingTransaction(false);
              setTransactionToShare(null);
              setSelectedUserIds([]);
            }}>
            Cancel
          </Button>
          <Button
            onClick={handleShareTransaction}
            disabled={selectedUserIds.length === 0 || isLoadingUsers}>
            Share Transaction
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Search transactions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Dialog
          open={isAddingTransaction}
          onOpenChange={setIsAddingTransaction}>
          <DialogTrigger asChild>
            <Button size="sm">
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Transaction
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Transaction</DialogTitle>
              <DialogDescription>
                Enter the details for your new transaction.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="date" className="text-right text-sm">
                  Date
                </label>
                <Input
                  id="date"
                  type="date"
                  value={newTransaction.date}
                  onChange={(e) =>
                    setNewTransaction((prev) => ({
                      ...prev,
                      date: e.target.value,
                    }))
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="amount" className="text-right text-sm">
                  Amount
                </label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newTransaction.amount}
                  onChange={(e) =>
                    setNewTransaction((prev) => ({
                      ...prev,
                      amount: parseFloat(e.target.value),
                    }))
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="vendor" className="text-right text-sm">
                  Vendor
                </label>
                <div className="col-span-3">
                  <Popover open={openVendor} onOpenChange={setOpenVendor}>
                    <PopoverTrigger asChild>
                      <Button
                        id="vendor"
                        variant="outline"
                        role="combobox"
                        aria-expanded={openVendor}
                        aria-label="Select vendor"
                        className="w-[300px] justify-between">
                        {newTransaction.vendor || "Select vendor..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
                      <Command className="max-h-[300px]">
                        <CommandInput placeholder="Search or add new vendor..." />
                        <CommandList className="overflow-y-auto max-h-[200px]">
                          <CommandEmpty>
                            <div className="p-2 text-sm">
                              Press enter to add &quot;{newTransaction.vendor}
                              &quot; as a new vendor
                            </div>
                          </CommandEmpty>
                          <CommandGroup heading="Vendors">
                            {uniqueVendors.map((vendor) => (
                              <CommandItem
                                key={vendor}
                                value={vendor}
                                onSelect={() => {
                                  setNewTransaction((prev) => ({
                                    ...prev,
                                    vendor,
                                  }));
                                  setOpenVendor(false);
                                }}>
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    newTransaction.vendor === vendor
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {vendor}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                        <CommandSeparator />
                        <CommandGroup>
                          <CommandItem
                            onSelect={() => {
                              setIsNewVendorDialogOpen(true);
                            }}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add new vendor
                          </CommandItem>
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="category" className="text-right text-sm">
                  Category
                </label>
                <div className="col-span-3">
                  <Popover open={openCategory} onOpenChange={setOpenCategory}>
                    <PopoverTrigger asChild>
                      <Button
                        id="category"
                        variant="outline"
                        role="combobox"
                        aria-expanded={openCategory}
                        aria-label="Select category"
                        className="w-[300px] justify-between">
                        {newTransaction.category || "Select category..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
                      <Command className="max-h-[300px]">
                        <CommandInput placeholder="Search or add new category..." />
                        <CommandList className="overflow-y-auto max-h-[200px]">
                          <CommandEmpty>
                            <div className="p-2 text-sm">
                              Press enter to add &quot;{newTransaction.category}
                              &quot; as a new category
                            </div>
                          </CommandEmpty>
                          <CommandGroup heading="Categories">
                            {uniqueCategories.map((category) => (
                              <CommandItem
                                key={category}
                                value={category}
                                onSelect={() => {
                                  setNewTransaction((prev) => ({
                                    ...prev,
                                    category,
                                  }));
                                  setOpenCategory(false);
                                }}>
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    newTransaction.category === category
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {category}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                        <CommandSeparator />
                        <CommandGroup>
                          <CommandItem
                            onSelect={() => {
                              setIsNewCategoryDialogOpen(true);
                            }}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add new category
                          </CommandItem>
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="type" className="text-right text-sm">
                  Type
                </label>
                <div className="col-span-3">
                  <Popover open={openType} onOpenChange={setOpenType}>
                    <PopoverTrigger asChild>
                      <Button
                        id="type"
                        variant="outline"
                        role="combobox"
                        aria-expanded={openType}
                        aria-label="Select type"
                        className="w-[300px] justify-between">
                        {newTransaction.transactionType || "Select type..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
                      <Command className="max-h-[300px]">
                        <CommandInput placeholder="Search or add new type..." />
                        <CommandList className="overflow-y-auto max-h-[200px]">
                          <CommandEmpty>
                            <div className="p-2 text-sm">
                              Press enter to add &quot;
                              {newTransaction.transactionType}&quot; as a new
                              type
                            </div>
                          </CommandEmpty>
                          <CommandGroup heading="Types">
                            {uniqueTypes.map((type) => (
                              <CommandItem
                                key={type}
                                value={type}
                                onSelect={() => {
                                  setNewTransaction((prev) => ({
                                    ...prev,
                                    transactionType: type,
                                  }));
                                  setOpenType(false);
                                }}>
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    newTransaction.transactionType === type
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {type}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                        <CommandSeparator />
                        <CommandGroup>
                          <CommandItem
                            onSelect={() => {
                              setIsNewTypeDialogOpen(true);
                            }}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add new type
                          </CommandItem>
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddingTransaction(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddTransaction}>Add Transaction</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={isNewCategoryDialogOpen}
          onOpenChange={setIsNewCategoryDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Category</DialogTitle>
              <DialogDescription>
                Enter the name of the new category.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label
                  htmlFor="new-category-name"
                  className="text-right text-sm">
                  Category Name
                </label>
                <Input
                  id="new-category-name"
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsNewCategoryDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddNewCategory}>Add Category</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={isNewTypeDialogOpen}
          onOpenChange={setIsNewTypeDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Type</DialogTitle>
              <DialogDescription>
                Enter the name of the new type.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="new-type-name" className="text-right text-sm">
                  Type Name
                </label>
                <Input
                  id="new-type-name"
                  type="text"
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsNewTypeDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddNewType}>Add Type</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={isNewVendorDialogOpen}
          onOpenChange={setIsNewVendorDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Vendor</DialogTitle>
              <DialogDescription>
                Enter the name of the new vendor.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="new-vendor-name" className="text-right text-sm">
                  Vendor Name
                </label>
                <Input
                  id="new-vendor-name"
                  type="text"
                  value={newVendorName}
                  onChange={(e) => setNewVendorName(e.target.value)}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsNewVendorDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => handleAddNewVendor(newVendorName)}>
                Add Vendor
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("date")}>
                Date{" "}
                {sortColumn === "date" && (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("vendor")}>
                Vendor{" "}
                {sortColumn === "vendor" &&
                  (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("amount")}>
                Amount{" "}
                {sortColumn === "amount" &&
                  (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("category")}>
                Category{" "}
                {sortColumn === "category" &&
                  (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("transactionType")}>
                Type{" "}
                {sortColumn === "transactionType" &&
                  (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead>Shared</TableHead>
              <TableHead className="flex justify-end px-6 items-center">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTransactions.map((transaction, i) => (
              <TableRow key={i}>
                <TableCell>{transaction.date}</TableCell>
                <TableCell>{transaction.vendor}</TableCell>
                <TableCell>${transaction.amount.toFixed(2)}</TableCell>
                <TableCell>{transaction.category}</TableCell>
                <TableCell>{transaction.transactionType}</TableCell>
                <TableCell>
                  {transaction.isShared && transaction.sharedBy ? (
                    // Transaction shared by others to current user
                    <Badge variant="secondary">
                      Shared by: {transaction.sharedBy.name}
                    </Badge>
                  ) : transaction.isShared ||
                    (transaction.sharedWith &&
                      transaction.sharedWith.length > 0) ? (
                    // Transaction shared by current user to others
                    <div>
                      <Badge variant="outline" className="mb-1">
                        Shared with {transaction.sharedWith?.length || 0} user
                        {(transaction.sharedWith?.length || 0) > 1 ? "s" : ""}
                      </Badge>
                      <div className="text-xs text-muted-foreground max-h-16 overflow-y-auto">
                        {transaction.sharedWith?.map(
                          (user: any, index: number) => (
                            <div key={user.id || index} className="truncate">
                              {user.name || user.email || "Unknown user"}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  ) : null}
                </TableCell>
                <TableCell className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenShareDialog(transaction)}
                    className="h-8 w-8 p-0"
                    title="Share transaction">
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditingTransaction(transaction);
                      setNewTransaction({
                        date: transaction.date,
                        amount: transaction.amount,
                        vendor: transaction.vendor,
                        category: transaction.category,
                        transactionType: transaction.transactionType,
                      });
                      setIsEditingTransaction(true);
                    }}
                    className="h-8 w-8 p-0">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopyTransaction(transaction)}
                    className="h-8 w-8 p-0">
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setTransactionToDelete(transaction);
                      setIsDeletingTransaction(true);
                    }}
                    className="h-8 w-8 p-0 text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={isEditingTransaction}
        onOpenChange={setIsEditingTransaction}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
            <DialogDescription>
              Update the details for this transaction.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="date" className="text-right text-sm">
                Date
              </label>
              <Input
                id="date"
                type="date"
                value={newTransaction.date}
                onChange={(e) =>
                  setNewTransaction((prev) => ({
                    ...prev,
                    date: e.target.value,
                  }))
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="amount" className="text-right text-sm">
                Amount
              </label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={newTransaction.amount}
                onChange={(e) =>
                  setNewTransaction((prev) => ({
                    ...prev,
                    amount: parseFloat(e.target.value),
                  }))
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="vendor" className="text-right text-sm">
                Vendor
              </label>
              <div className="col-span-3">
                <Popover open={openVendor} onOpenChange={setOpenVendor}>
                  <PopoverTrigger asChild>
                    <Button
                      id="vendor"
                      variant="outline"
                      role="combobox"
                      aria-expanded={openVendor}
                      aria-label="Select vendor"
                      className="w-[300px] justify-between">
                      {newTransaction.vendor || "Select vendor..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0">
                    <Command className="max-h-[300px]">
                      <CommandInput placeholder="Search or add new vendor..." />
                      <CommandList className="overflow-y-auto max-h-[200px]">
                        <CommandEmpty>
                          <div className="p-2 text-sm">
                            Press enter to add &quot;{newTransaction.vendor}
                            &quot; as a new vendor
                          </div>
                        </CommandEmpty>
                        <CommandGroup heading="Vendors">
                          {uniqueVendors.map((vendor) => (
                            <CommandItem
                              key={vendor}
                              value={vendor}
                              onSelect={() => {
                                setNewTransaction((prev) => ({
                                  ...prev,
                                  vendor,
                                }));
                                setOpenVendor(false);
                              }}>
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  newTransaction.vendor === vendor
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {vendor}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                      <CommandSeparator />
                      <CommandGroup>
                        <CommandItem
                          onSelect={() => {
                            setIsNewVendorDialogOpen(true);
                          }}>
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Add new vendor
                        </CommandItem>
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="category" className="text-right text-sm">
                Category
              </label>
              <div className="col-span-3">
                <Popover open={openCategory} onOpenChange={setOpenCategory}>
                  <PopoverTrigger asChild>
                    <Button
                      id="category"
                      variant="outline"
                      role="combobox"
                      aria-expanded={openCategory}
                      aria-label="Select category"
                      className="w-[300px] justify-between">
                      {newTransaction.category || "Select category..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0">
                    <Command className="max-h-[300px]">
                      <CommandInput placeholder="Search or add new category..." />
                      <CommandList className="overflow-y-auto max-h-[200px]">
                        <CommandEmpty>
                          <div className="p-2 text-sm">
                            Press enter to add &quot;{newTransaction.category}
                            &quot; as a new category
                          </div>
                        </CommandEmpty>
                        <CommandGroup heading="Categories">
                          {uniqueCategories.map((category) => (
                            <CommandItem
                              key={category}
                              value={category}
                              onSelect={() => {
                                setNewTransaction((prev) => ({
                                  ...prev,
                                  category,
                                }));
                                setOpenCategory(false);
                              }}>
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  newTransaction.category === category
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {category}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                      <CommandSeparator />
                      <CommandGroup>
                        <CommandItem
                          onSelect={() => {
                            setIsNewCategoryDialogOpen(true);
                          }}>
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Add new category
                        </CommandItem>
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="type" className="text-right text-sm">
                Type
              </label>
              <div className="col-span-3">
                <Popover open={openType} onOpenChange={setOpenType}>
                  <PopoverTrigger asChild>
                    <Button
                      id="type"
                      variant="outline"
                      role="combobox"
                      aria-expanded={openType}
                      aria-label="Select type"
                      className="w-[300px] justify-between">
                      {newTransaction.transactionType || "Select type..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0">
                    <Command className="max-h-[300px]">
                      <CommandInput placeholder="Search or add new type..." />
                      <CommandList className="overflow-y-auto max-h-[200px]">
                        <CommandEmpty>
                          <div className="p-2 text-sm">
                            Press enter to add &quot;
                            {newTransaction.transactionType}&quot; as a new type
                          </div>
                        </CommandEmpty>
                        <CommandGroup heading="Types">
                          {uniqueTypes.map((type) => (
                            <CommandItem
                              key={type}
                              value={type}
                              onSelect={() => {
                                setNewTransaction((prev) => ({
                                  ...prev,
                                  transactionType: type,
                                }));
                                setOpenType(false);
                              }}>
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  newTransaction.transactionType === type
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {type}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                      <CommandSeparator />
                      <CommandGroup>
                        <CommandItem
                          onSelect={() => {
                            setIsNewTypeDialogOpen(true);
                          }}>
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Add new type
                        </CommandItem>
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditingTransaction(false);
                setEditingTransaction(null);
                setNewTransaction({
                  date: new Date().toISOString().split("T")[0],
                  amount: 0,
                  vendor: "",
                  category: "",
                  transactionType: "",
                });
              }}>
              Cancel
            </Button>
            <Button onClick={handleUpdateTransaction}>
              Update Transaction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isDeletingTransaction}
        onOpenChange={setIsDeletingTransaction}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Transaction</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this transaction? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeletingTransaction(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {renderSharingDialog()}
    </div>
  );
}
