"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Receipt,
  DollarSign,
  Download,
  Search,
  Plus,
  Edit,
  Trash2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Transaction {
  transactionId: number;
  date: string;
  type: "Expense" | "Income";
  amount: number;
  description: string;
  paymentMethod: string | null;
  payee: string | null;
  categoryItem: string;
}

interface ProjectTransactions {
  Project_ID: number;
  Project_Title: string;
  Slug: string;
  Total_Transactions: number;
  Total_Expenses: number;
  Total_Income: number;
  Expense_Transaction_Count: number;
  Income_Transaction_Count: number;
  transactions: Transaction[];
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function TransactionsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [data, setData] = useState<ProjectTransactions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "Expense" | "Income">("all");
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");

  useEffect(() => {
    async function fetchTransactions() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/projects/budgets/${encodeURIComponent(slug)}/transactions`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch transactions");
        }

        const transactionsData = await response.json();
        setData(transactionsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    }

    fetchTransactions();
  }, [slug]);

  // Filter and sort transactions
  const filteredTransactions = data?.transactions.filter((transaction) => {
    // Type filter
    if (typeFilter !== "all" && transaction.type !== typeFilter) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        transaction.description?.toLowerCase().includes(query) ||
        transaction.payee?.toLowerCase().includes(query) ||
        transaction.categoryItem?.toLowerCase().includes(query)
      );
    }

    return true;
  }).sort((a, b) => {
    if (sortBy === "date") {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    } else {
      return Math.abs(b.amount) - Math.abs(a.amount);
    }
  }) || [];

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 max-w-[1600px]">
        <Skeleton className="h-8 w-64 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 max-w-[1600px]">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {error ? "Error Loading Transactions" : "Transactions Not Found"}
          </h2>
          <p className="text-muted-foreground mb-6">
            {error || "The transactions you're looking for don't exist."}
          </p>
          <Link
            href={`/budgets/${slug}`}
            className="inline-flex items-center gap-2 text-[#61bc47] hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Budget
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 max-w-[1600px]">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/budgets/${slug}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-[#61bc47] mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {data.Project_Title}
        </Link>

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-primary dark:text-foreground mb-2">
              transactions
            </h1>
            <p className="text-muted-foreground">
              All expenses and income for {data.Project_Title}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#61bc47] hover:bg-[#52a03c] text-white rounded-lg transition-colors"
              title="Add new transaction"
            >
              <Plus className="w-4 h-4" />
              Add Transaction
            </button>
            <button
              onClick={() => {
                // Export functionality can be added later
                alert("Export functionality coming soon!");
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 dark:bg-zinc-700 text-white rounded-lg hover:bg-zinc-700 dark:hover:bg-zinc-600 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Transactions */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Total Transactions
            </h3>
            <Receipt className="w-5 h-5 text-purple-500" />
          </div>
          <div className="text-3xl font-bold text-foreground">
            {data.Total_Transactions}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {data.Total_Transactions} total
          </p>
        </div>

        {/* Total Expenses */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Total Expenses
            </h3>
            <DollarSign className="w-5 h-5 text-red-500" />
          </div>
          <div className="text-3xl font-bold text-red-600 dark:text-red-400">
            {formatCurrency(data.Total_Expenses)}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {data.Expense_Transaction_Count} transactions
          </p>
        </div>

        {/* Total Income */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Total Income
            </h3>
            <DollarSign className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-3xl font-bold text-green-600 dark:text-green-400">
            {formatCurrency(data.Total_Income)}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {data.Income_Transaction_Count} transactions
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-zinc-100 dark:bg-zinc-800 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#61bc47] text-foreground"
              />
            </div>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="w-full px-4 py-2 bg-zinc-100 dark:bg-zinc-800 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#61bc47] text-foreground"
            >
              <option value="all">All Types</option>
              <option value="Expense">Expense</option>
              <option value="Income">Income</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-4 py-2 bg-zinc-100 dark:bg-zinc-800 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#61bc47] text-foreground"
            >
              <option value="date">Date</option>
              <option value="amount">Amount</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-zinc-200 dark:bg-zinc-900 border-b border-border">
                <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">
                  Category / Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">
                  Payee
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">
                  Payment Method
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">
                    No transactions found
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((transaction) => (
                  <tr
                    key={transaction.transactionId}
                    className="bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {formatDate(transaction.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                          transaction.type === "Expense"
                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        }`}
                      >
                        {transaction.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      <div className="font-medium">{transaction.categoryItem}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {transaction.payee || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground max-w-xs truncate">
                      {transaction.description || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {transaction.paymentMethod ? (
                        <span className="inline-block px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 rounded">
                          {transaction.paymentMethod}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span
                        className={`font-semibold ${
                          transaction.type === "Expense"
                            ? "text-red-600 dark:text-red-400"
                            : "text-green-600 dark:text-green-400"
                        }`}
                      >
                        {transaction.type === "Expense" ? "-" : "+"}
                        {formatCurrency(Math.abs(transaction.amount))}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          className="p-1.5 hover:bg-zinc-300 dark:hover:bg-zinc-600 rounded transition-colors"
                          title="Edit transaction"
                        >
                          <Edit className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <button
                          className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                          title="Delete transaction"
                        >
                          <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
