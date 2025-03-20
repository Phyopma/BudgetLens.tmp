"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from "@/components/ui/select";
import { Transaction } from "@/lib/types";
import { RESET_FILTER_VALUE } from "@/lib/utils/constants";
import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface FilterBarProps {
  transactions: Transaction[];
  onCategoryFilter: (categories: string[]) => void;
  onVendorFilter: (vendors: string[]) => void;
  onTransactionTypeFilter: (types: string[]) => void;
  onDateFilter: (
    startDate: Date | undefined,
    endDate: Date | undefined
  ) => void;
}

interface SelectionStates {
  [key: string]: number; // 0: unselected, 1: selected
}

export function FilterBar({
  transactions,
  onCategoryFilter,
  onVendorFilter,
  onTransactionTypeFilter,
  onDateFilter,
}: FilterBarProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [dateRange, setDateRange] = useState<{ min: Date; max: Date }>(() => {
    if (!transactions.length) {
      return {
        min: new Date(2020, 0, 1),
        max: new Date(),
      };
    }
    const dates = transactions.map((t) => new Date(t.date));
    return {
      min: new Date(Math.min(...dates.map((d) => d.getTime()))),
      max: new Date(Math.max(...dates.map((d) => d.getTime()))),
    };
  });

  // Set initial date range on component mount
  useEffect(() => {
    if (
      transactions.length > 0 &&
      !startDate &&
      !endDate &&
      typeof onDateFilter === "function"
    ) {
      const newStartDate = dateRange.min;
      const newEndDate = dateRange.max;
      setStartDate(newStartDate);
      setEndDate(newEndDate);
      onDateFilter(newStartDate, newEndDate);
    }
  }, [
    dateRange.max,
    dateRange.min,
    endDate,
    onDateFilter,
    startDate,
    transactions.length,
  ]); // Only run when transactions change

  const categories = Array.from(new Set(transactions.map((t) => t.category)));
  const vendors = Array.from(new Set(transactions.map((t) => t.vendor)));
  const transactionTypes = Array.from(
    new Set(transactions.map((t) => t.transactionType))
  );

  const handleStartDateSelect = (date: Date | undefined) => {
    setStartDate(date);
    if (typeof onDateFilter === "function") {
      if (date && endDate && date > endDate) {
        setEndDate(undefined);
        onDateFilter(date, undefined);
      } else {
        onDateFilter(date, endDate);
      }
    }
  };

  const handleEndDateSelect = (date: Date | undefined) => {
    setEndDate(date);
    if (typeof onDateFilter === "function") {
      onDateFilter(startDate, date);
    }
  };

  const getDisplayValue = (
    selected: string[],
    defaultLabel: string
  ): string => {
    if (selected.length === 0) return "all"; // Use "all" when nothing is selected
    return selected[0]; // Otherwise use the first selected item
  };

  const handleCategoryChange = (value: string) => {
    if (value === "all") {
      // Clear the filter
      setSelectedCategories([]);
      onCategoryFilter([]);
    } else if (value === "reset") {
      // Clear the filter
      setSelectedCategories([]);
      onCategoryFilter([]);
    } else {
      // Apply the filter
      setSelectedCategories([value]);
      onCategoryFilter([value]);
    }
  };

  const handleVendorChange = (value: string) => {
    if (value === "all") {
      // Clear the filter
      setSelectedVendors([]);
      onVendorFilter([]);
    } else if (value === "reset") {
      // Clear the filter
      setSelectedVendors([]);
      onVendorFilter([]);
    } else {
      // Apply the filter
      setSelectedVendors([value]);
      onVendorFilter([value]);
    }
  };

  const handleTypeChange = (value: string) => {
    if (value === "all") {
      // Clear the filter
      setSelectedTypes([]);
      onTransactionTypeFilter([]);
    } else if (value === "reset") {
      // Clear the filter
      setSelectedTypes([]);
      onTransactionTypeFilter([]);
    } else {
      // Apply the filter
      setSelectedTypes([value]);
      onTransactionTypeFilter([value]);
    }
  };

  return (
    <div className="flex gap-4 mb-6 flex-wrap">
      {/* Date Range Filter */}
      <div className="flex gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[180px] justify-start text-left font-normal",
                !startDate && "text-muted-foreground"
              )}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {startDate ? format(startDate, "PPP") : <span>Start Date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={handleStartDateSelect}
              initialFocus
              fromDate={dateRange.min}
              toDate={dateRange.max}
            />
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[180px] justify-start text-left font-normal",
                !endDate && "text-muted-foreground"
              )}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {endDate ? format(endDate, "PPP") : <span>End Date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={endDate}
              onSelect={handleEndDateSelect}
              initialFocus
              fromDate={startDate || dateRange.min}
              toDate={dateRange.max}
              disabled={(date) => (startDate ? date < startDate : false)}
            />
          </PopoverContent>
        </Popover>

        {(startDate || endDate) && (
          <Button
            variant="ghost"
            className="h-9 px-2"
            onClick={() => {
              setStartDate(undefined);
              setEndDate(undefined);
              onDateFilter(undefined, undefined);
            }}>
            Reset
          </Button>
        )}
      </div>

      <Select
        value={getDisplayValue(selectedCategories, "category")}
        onValueChange={handleCategoryChange}>
        <SelectTrigger className="w-[180px]" aria-label="Filter by Category">
          <SelectValue>
            {selectedCategories.length > 0
              ? selectedCategories[0]
              : "All Categories"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          <SelectSeparator />
          {categories.map((category) => (
            <SelectItem key={category} value={category}>
              {category}
            </SelectItem>
          ))}
          {selectedCategories.length > 0 && (
            <>
              <SelectSeparator />
              <SelectItem value="reset">Clear Filter</SelectItem>
            </>
          )}
        </SelectContent>
      </Select>

      <Select
        value={getDisplayValue(selectedVendors, "vendor")}
        onValueChange={handleVendorChange}>
        <SelectTrigger className="w-[180px]" aria-label="Filter by Vendor">
          <SelectValue>
            {selectedVendors.length > 0 ? selectedVendors[0] : "All Vendors"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Vendors</SelectItem>
          <SelectSeparator />
          {vendors.map((vendor) => (
            <SelectItem key={vendor} value={vendor}>
              {vendor}
            </SelectItem>
          ))}
          {selectedVendors.length > 0 && (
            <>
              <SelectSeparator />
              <SelectItem value="reset">Clear Filter</SelectItem>
            </>
          )}
        </SelectContent>
      </Select>

      <Select
        value={getDisplayValue(selectedTypes, "type")}
        onValueChange={handleTypeChange}>
        <SelectTrigger className="w-[180px]" aria-label="Filter by Type">
          <SelectValue>
            {selectedTypes.length > 0 ? selectedTypes[0] : "All Types"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectSeparator />
          {transactionTypes.map((type) => (
            <SelectItem key={type} value={type}>
              {type}
            </SelectItem>
          ))}
          {selectedTypes.length > 0 && (
            <>
              <SelectSeparator />
              <SelectItem value="reset">Clear Filter</SelectItem>
            </>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
