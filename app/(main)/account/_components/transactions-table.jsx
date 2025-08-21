"use client";
import React, { useState, useMemo, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { categoryColors } from "@/data/categories";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronUp,
  Clock,
  MoreHorizontal,
  RefreshCw,
  Search,
  Trash,
  X,
  Filter,
  Calendar,
  TrendingDown,
  TrendingUp,
  Archive,
  ChevronLeft, // --- PAGINATION --- New Icon
  ChevronRight, // --- PAGINATION --- New Icon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import useFetch from "@/hooks/use-fetch";
import { bulkDeleteTranssaction } from "@/actions/accounts";

import { toast } from "react-hot-toast";
import { BarLoader } from "react-spinners";

const RECURRING_INTERVALS = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
};

const TransactionTable = ({ transactions }) => {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState([]);
  const [sortConfig, setSortConfig] = useState({
    field: "date",
    direction: "desc",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [recurringFilter, setRecurringFilter] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const TRANSACTIONS_PER_PAGE = 30;

  const {
    loading: deleteLoading,
    fn: deleteFn,
    data: deleted,
  } = useFetch(bulkDeleteTranssaction);

  const handleBulkDelete = async () => {
    if (
      !window.confirm(
        `Are you sure you want to delete ${selectedIds.length} transactions?`
      )
    ) {
      return;
    }
    deleteFn(selectedIds);
  };
  
  useEffect(() => {
    if (!deleteLoading && deleted) {
        if (deleted.success) {
          toast.success("Transactions deleted successfully");
          setSelectedIds([]); // Clear selection after delete
        } else {
          toast.error(deleted.error || "Failed to delete transactions");
        }
      }
  }, [deleted, deleteLoading]);

  const filteredAndSortedTransactions = useMemo(() => {
    let result = [...transactions];

    //APPLY SEARCH FILTER
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter((transaction) =>
        transaction.description?.toLowerCase().includes(searchLower)
      );
    }

    //APPLY RECURRING FILTER
    if (recurringFilter) {
      result = result.filter((transaction) => {
        if (recurringFilter === "recurring") return transaction.isRecurring;
        return !transaction.isRecurring;
      });
    }

    // Apply type filter
    if (typeFilter && typeFilter !== "ALL") {
      result = result.filter((transaction) => transaction.type === typeFilter);
    }

    //Apply sorting
    result.sort((a, b) => {
      let comparison = 0;

      switch (sortConfig.field) {
        case "date":
          comparison = new Date(a.date) - new Date(b.date);
          break;
        case "amount":
          comparison = a.amount - b.amount;
          break;
        case "category":
          comparison = a.category.localeCompare(b.category);
          break;
        default:
          comparison = 0;
      }
      return sortConfig.direction === "asc" ? comparison : -comparison;
    });

    return result;
  }, [transactions, searchTerm, recurringFilter, typeFilter, sortConfig]);

   // --- PAGINATION --- 2. Create a new memoized value for the transactions to be displayed on the current page.
   const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * TRANSACTIONS_PER_PAGE;
    const endIndex = startIndex + TRANSACTIONS_PER_PAGE;
    return filteredAndSortedTransactions.slice(startIndex, endIndex);
  }, [filteredAndSortedTransactions, currentPage]);

  // --- PAGINATION --- 3. Calculate total pages and create navigation handlers.
  const totalPages = Math.ceil(filteredAndSortedTransactions.length / TRANSACTIONS_PER_PAGE);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  // --- PAGINATION --- 5. Reset to page 1 whenever filters or sorting change.
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, recurringFilter, sortConfig]);


  const handleSort = (field) => {
    setSortConfig((current) => ({
      field,
      direction:
        current.field == field && current.direction === "asc" ? "desc" : "asc",
    }));
  };
  
  const handleSelect = (id) => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item != id)
        : [...current, id]
    );
  };

  const handleSelectAll = () => {
    // This now correctly selects/deselects only the items on the current page
    const currentVisibleIds = paginatedTransactions.map((t) => t.id);
    const allVisibleSelected = currentVisibleIds.every(id => selectedIds.includes(id));

    if (allVisibleSelected) {
      // If all visible are selected, deselect them
      setSelectedIds(current => current.filter(id => !currentVisibleIds.includes(id)));
    } else {
      // Otherwise, select all visible ones (without removing selections from other pages)
      setSelectedIds(current => [...new Set([...current, ...currentVisibleIds])]);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setTypeFilter("ALL");
    setRecurringFilter("");
    setSelectedIds([]);
  };

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const totalIncome = filteredAndSortedTransactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpense = filteredAndSortedTransactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalTransactions: filteredAndSortedTransactions.length,
      totalIncome,
      totalExpense,
      netAmount: totalIncome - totalExpense,
    };
  }, [filteredAndSortedTransactions]);

  const hasActiveFilters = searchTerm || typeFilter !== "ALL" || recurringFilter;

  return (
    <div className="space-y-6">
      {deleteLoading && (
        <div className="w-full">
          <BarLoader className="w-full" color="#2563eb" />
        </div>
      )}

      {/* Enhanced Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Transactions</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{summaryStats.totalTransactions}</p>
            </div>
            <Archive className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 p-4 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600 dark:text-green-400">Total Income</p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">${summaryStats.totalIncome.toFixed(2)}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 p-4 rounded-lg border border-red-200 dark:border-red-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600 dark:text-red-400">Total Expense</p>
              <p className="text-2xl font-bold text-red-900 dark:text-red-100">${summaryStats.totalExpense.toFixed(2)}</p>
            </div>
            <TrendingDown className="h-8 w-8 text-red-500" />
          </div>
        </div>

        <div className={`bg-gradient-to-r p-4 rounded-lg border ${
          summaryStats.netAmount >= 0 
            ? 'from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 border-emerald-200 dark:border-emerald-800' 
            : 'from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${
                summaryStats.netAmount >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-600 dark:text-orange-400'
              }`}>Net Amount</p>
              <p className={`text-2xl font-bold ${
                summaryStats.netAmount >= 0 ? 'text-emerald-900 dark:text-emerald-100' : 'text-orange-900 dark:text-orange-100'
              }`}>
                {summaryStats.netAmount >= 0 ? '+' : '-'}${Math.abs(summaryStats.netAmount).toFixed(2)}
              </p>
            </div>
            {summaryStats.netAmount >= 0 ? 
              <TrendingUp className="h-8 w-8 text-emerald-500" /> : 
              <TrendingDown className="h-8 w-8 text-orange-500" />
            }
          </div>
        </div>
      </div>

      {/* Enhanced Filters Section */}
      <div className="bg-card border rounded-lg p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-medium text-sm">Filters & Search</h3>
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-auto">
              {[searchTerm, typeFilter !== "ALL" ? typeFilter : null, recurringFilter]
                .filter(Boolean).length} active
            </Badge>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search descriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <Select
              value={typeFilter || undefined}
              onValueChange={(value) => setTypeFilter(value)}
            >
              <SelectTrigger className="w-[140px] transition-all duration-200 hover:border-primary/50">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="INCOME">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    Income
                  </div>
                </SelectItem>
                <SelectItem value="EXPENSE">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-red-500" />
                    Expense
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={recurringFilter}
              onValueChange={(value) => setRecurringFilter(value)}
            >
              <SelectTrigger className="w-[180px] transition-all duration-200 hover:border-primary/50">
                <SelectValue placeholder="All Transactions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recurring">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Recurring Only
                  </div>
                </SelectItem>
                <SelectItem value="non-recurring">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    One-time Only
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {selectedIds.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                className="transition-all duration-200 hover:scale-105"
              >
                <Trash className="h-4 w-4 mr-2" />
                Delete ({selectedIds.length})
              </Button>
            )}
            
            {hasActiveFilters && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleClearFilters}
                    className="transition-all duration-200 hover:bg-muted"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Clear all filters</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Table */}
      <div className="rounded-lg border shadow-sm overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-muted/50 border-b-2">
              <TableHead className="w-[50px] pl-4">
                <Checkbox
                  onCheckedChange={handleSelectAll}
                  checked={
                    paginatedTransactions.length > 0 &&
                    paginatedTransactions.every(t => selectedIds.includes(t.id))
                  }
                  className="transition-all duration-200"
                />
              </TableHead>
              
              <TableHead
                className="cursor-pointer hover:bg-muted/30 transition-colors duration-200 select-none"
                onClick={() => handleSort("date")}
              >
                <div className="flex items-center gap-1 font-semibold">
                  <Calendar className="h-4 w-4" />
                  Date
                  {sortConfig.field === "date" && (
                    <div className="ml-1">
                      {sortConfig.direction === "asc" ? (
                        <ChevronUp className="h-4 w-4 text-primary" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  )}
                </div>
              </TableHead>
              
              <TableHead className="font-semibold">Description</TableHead>
              
              <TableHead
                className="cursor-pointer hover:bg-muted/30 transition-colors duration-200 select-none"
                onClick={() => handleSort("category")}
              >
                <div className="flex items-center gap-1 font-semibold">
                  Category
                  {sortConfig.field === "category" && (
                    <div className="ml-1">
                      {sortConfig.direction === "asc" ? (
                        <ChevronUp className="h-4 w-4 text-primary" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  )}
                </div>
              </TableHead>
              
              <TableHead
                className="cursor-pointer hover:bg-muted/30 transition-colors duration-200 select-none text-right"
                onClick={() => handleSort("amount")}
              >
                <div className="flex items-center justify-end gap-1 font-semibold">
                  Amount
                  {sortConfig.field === "amount" && (
                    <div className="ml-1">
                      {sortConfig.direction === "asc" ? (
                        <ChevronUp className="h-4 w-4 text-primary" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  )}
                </div>
              </TableHead>
              
              <TableHead className="font-semibold">Recurring</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTransactions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground py-12"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Search className="h-8 w-8 text-muted-foreground/50" />
                    <p className="text-lg font-medium">No transactions found</p>
                    <p className="text-sm">Try adjusting your search or filters</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedTransactions.map((transaction, index) => (
                <TableRow 
                  key={transaction.id} 
                  className={`
                    hover:bg-muted/50 transition-all duration-200 
                    ${selectedIds.includes(transaction.id) ? 'bg-primary/5 border-l-4 border-l-primary' : ''}
                    ${index % 2 === 0 ? 'bg-muted/20' : ''}
                  `}
                >
                  <TableCell className="pl-4">
                    <Checkbox
                      onCheckedChange={() => handleSelect(transaction.id)}
                      checked={selectedIds.includes(transaction.id)}
                      className="transition-all duration-200"
                    />
                  </TableCell>
                  
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      {format(new Date(transaction.date), "PP")}
                    </div>
                  </TableCell>
                  
                  <TableCell className="max-w-[200px] truncate" title={transaction.description}>
                    {transaction.description}
                  </TableCell>
                  
                  <TableCell>
                    <Badge
                      variant="secondary"
                      style={{
                        backgroundColor: categoryColors[transaction.category] + '20',
                        borderColor: categoryColors[transaction.category],
                        color: categoryColors[transaction.category],
                      }}
                      className="capitalize font-medium border transition-all duration-200 hover:scale-105"
                    >
                      {transaction.category}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-right">
                    <div className={`font-bold text-lg transition-colors duration-200 ${
                      transaction.type === "EXPENSE" 
                        ? "text-red-600 dark:text-red-400" 
                        : "text-green-600 dark:text-green-400"
                    }`}>
                      <div className="flex items-center justify-end gap-1">
                        {transaction.type === "EXPENSE" ? (
                          <TrendingDown className="h-4 w-4" />
                        ) : (
                          <TrendingUp className="h-4 w-4" />
                        )}
                        {transaction.type === "EXPENSE" ? "-" : "+"}${transaction.amount.toFixed(2)}
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {transaction.isRecurring ? (
                      <Tooltip>
                        <TooltipTrigger>
                          <Badge
                            variant="outline"
                            className="gap-2 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 transition-all duration-200"
                          >
                            <RefreshCw className="h-3 w-3 animate-spin-slow" />
                            {RECURRING_INTERVALS[transaction.recurringInterval]}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <div className="text-sm space-y-1">
                            <div className="font-medium flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Next Date:
                            </div>
                            <div className="text-muted-foreground">
                              {format(new Date(transaction.nextRecurringDate), "PP")}
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <Badge 
                        variant="outline" 
                        className="gap-2 bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400"
                      >
                        <Clock className="h-3 w-3" />
                        One-time
                      </Badge>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          className="h-8 w-8 p-0 hover:bg-muted transition-all duration-200 hover:scale-110"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(`/transaction/create?edit=${transaction.id}`)
                          }
                          className="cursor-pointer transition-colors duration-200"
                        >
                          <Search className="h-4 w-4 mr-2" />
                          Edit Transaction
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive cursor-pointer transition-colors duration-200 focus:text-destructive"
                          onClick={() => deleteFn([transaction.id])}
                        >
                          <Trash className="h-4 w-4 mr-2" />
                          Delete Transaction
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* PAGINATION CONTROLS ADDED HERE */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <div className="text-sm text-muted-foreground">
            Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );

};

export default TransactionTable;