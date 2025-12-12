"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Receipt,
  DollarSign,
  Search,
  Plus,
  Edit,
  Trash2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Transaction {
  transactionId: number;
  date: string;
  type: "Expense" | "Income";
  amount: number;
  description: string;
  paymentMethod: string | null;
  payee: string | null;
  categoryItem: string;
  expenseLineItemId: number | null;
  incomeLineItemId: number | null;
  approvalStatus: "Approved" | "Rejected" | "Pending";
  purchaseRequestId: number | null;
  requisitionGuid: string | null;
  purchaseRequestStatus: string | null;
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

interface LineItem {
  lineItemId: string;
  name: string;
  estimated: number;
  actual: number;
}

interface BudgetCategory {
  categoryId: string;
  name: string;
  type: "expense" | "revenue";
  estimated: number;
  actual: number;
  sortOrder: number;
  lineItems: LineItem[];
}

interface ProjectBudget {
  Project_ID: number;
  expenseCategories: BudgetCategory[];
  incomeLineItemsCategories: BudgetCategory[];
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

function formatGuid(guid: string) {
  // Show first 8 characters of GUID
  return guid.substring(0, 8).toUpperCase();
}

export default function TransactionsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [data, setData] = useState<ProjectTransactions | null>(null);
  const [budgetData, setBudgetData] = useState<ProjectBudget | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "Expense" | "Income">("all");
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");

  // Add Transaction modal state
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [newTransactionDate, setNewTransactionDate] = useState("");
  const [newTransactionType, setNewTransactionType] = useState<"Expense" | "Income">("Expense");
  const [newTransactionLineItemId, setNewTransactionLineItemId] = useState<string>("");
  const [newTransactionStatus, setNewTransactionStatus] = useState<"Approved" | "Rejected" | "Pending">("Pending");
  const [newTransactionAmount, setNewTransactionAmount] = useState("");
  const [newTransactionPayee, setNewTransactionPayee] = useState("");
  const [newTransactionDescription, setNewTransactionDescription] = useState("");
  const [newTransactionPaymentMethod, setNewTransactionPaymentMethod] = useState("");
  const [newTransactionPaymentReference, setNewTransactionPaymentReference] = useState("");
  const [newTransactionNotes, setNewTransactionNotes] = useState("");
  const [isSavingTransaction, setIsSavingTransaction] = useState(false);

  // Edit Transaction modal state
  const [isEditTransactionOpen, setIsEditTransactionOpen] = useState(false);
  const [editingTransactionId, setEditingTransactionId] = useState<number | null>(null);
  const [editTransactionDate, setEditTransactionDate] = useState("");
  const [editTransactionType, setEditTransactionType] = useState<"Expense" | "Income">("Expense");
  const [editTransactionLineItemId, setEditTransactionLineItemId] = useState<string>("");
  const [editTransactionStatus, setEditTransactionStatus] = useState<"Approved" | "Rejected" | "Pending">("Pending");
  const [editTransactionAmount, setEditTransactionAmount] = useState("");
  const [editTransactionPayee, setEditTransactionPayee] = useState("");
  const [editTransactionDescription, setEditTransactionDescription] = useState("");
  const [editTransactionPaymentMethod, setEditTransactionPaymentMethod] = useState("");
  const [editTransactionPaymentReference, setEditTransactionPaymentReference] = useState("");
  const [editTransactionNotes, setEditTransactionNotes] = useState("");
  const [isSavingEditTransaction, setIsSavingEditTransaction] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch both transactions and budget data in parallel
        const [transactionsResponse, budgetResponse] = await Promise.all([
          fetch(`/api/projects/budgets/${encodeURIComponent(slug)}/transactions`),
          fetch(`/api/projects/budgets/${encodeURIComponent(slug)}`),
        ]);

        if (!transactionsResponse.ok) {
          const errorData = await transactionsResponse.json();
          throw new Error(errorData.error || "Failed to fetch transactions");
        }

        if (!budgetResponse.ok) {
          const errorData = await budgetResponse.json();
          throw new Error(errorData.error || "Failed to fetch budget data");
        }

        const [transactionsData, budgetDataResponse] = await Promise.all([
          transactionsResponse.json(),
          budgetResponse.json(),
        ]);

        setData(transactionsData);
        setBudgetData(budgetDataResponse);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [slug]);

  async function refetchTransactions() {
    try {
      const response = await fetch(`/api/projects/budgets/${encodeURIComponent(slug)}/transactions`);
      if (response.ok) {
        const transactionsData = await response.json();
        setData(transactionsData);
      }
    } catch (err) {
      console.error("Error refetching transactions:", err);
    }
  }

  async function handleAddTransaction() {
    if (!data) return;

    const amount = parseFloat(newTransactionAmount);

    if (!newTransactionDate || !amount) {
      alert("Date and amount are required");
      return;
    }

    setIsAddTransactionOpen(false);
    setIsSavingTransaction(true);

    try {
      const response = await fetch(`/api/projects/${data.Project_ID}/transactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transactionDate: newTransactionDate,
          transactionType: newTransactionType,
          amount: amount,
          lineItemId: newTransactionLineItemId ? (newTransactionType === "Expense" ? parseInt(newTransactionLineItemId, 10) : newTransactionLineItemId) : null,
          status: newTransactionStatus,
          payeeName: newTransactionPayee.trim() || null,
          description: newTransactionDescription.trim() || null,
          paymentMethodId: newTransactionPaymentMethod ? parseInt(newTransactionPaymentMethod, 10) : null,
          paymentReference: newTransactionPaymentReference.trim() || null,
          notes: newTransactionNotes.trim() || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create transaction");
      }

      // Refetch transactions to get updated data
      await refetchTransactions();

      // Reset form
      setNewTransactionDate("");
      setNewTransactionType("Expense");
      setNewTransactionLineItemId("");
      setNewTransactionStatus("Pending");
      setNewTransactionAmount("");
      setNewTransactionPayee("");
      setNewTransactionDescription("");
      setNewTransactionPaymentMethod("");
      setNewTransactionPaymentReference("");
      setNewTransactionNotes("");
    } catch (err) {
      console.error("Error creating transaction:", err);
      alert(err instanceof Error ? err.message : "Failed to create transaction");
    } finally {
      setIsSavingTransaction(false);
    }
  }

  async function handleEditTransaction() {
    if (!data || !editingTransactionId) return;

    const amount = parseFloat(editTransactionAmount);

    if (!editTransactionDate || !amount) {
      alert("Date and amount are required");
      return;
    }

    setIsEditTransactionOpen(false);
    setIsSavingEditTransaction(true);

    try {
      const response = await fetch(`/api/projects/${data.Project_ID}/transactions`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transactionId: editingTransactionId,
          transactionDate: editTransactionDate,
          transactionType: editTransactionType,
          amount: amount,
          lineItemId: editTransactionLineItemId ? (editTransactionType === "Expense" ? parseInt(editTransactionLineItemId, 10) : editTransactionLineItemId) : null,
          status: editTransactionStatus,
          payeeName: editTransactionPayee.trim() || null,
          description: editTransactionDescription.trim() || null,
          paymentMethodId: editTransactionPaymentMethod ? parseInt(editTransactionPaymentMethod, 10) : null,
          paymentReference: editTransactionPaymentReference.trim() || null,
          notes: editTransactionNotes.trim() || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update transaction");
      }

      // Refetch transactions to get updated data
      await refetchTransactions();

      // Reset form
      setEditingTransactionId(null);
      setEditTransactionDate("");
      setEditTransactionType("Expense");
      setEditTransactionLineItemId("");
      setEditTransactionStatus("Pending");
      setEditTransactionAmount("");
      setEditTransactionPayee("");
      setEditTransactionDescription("");
      setEditTransactionPaymentMethod("");
      setEditTransactionPaymentReference("");
      setEditTransactionNotes("");
    } catch (err) {
      console.error("Error updating transaction:", err);
      alert(err instanceof Error ? err.message : "Failed to update transaction");
    } finally {
      setIsSavingEditTransaction(false);
    }
  }

  async function handleDeleteTransaction(transactionId: number, description: string) {
    if (!data) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete this transaction${description ? ` "${description}"` : ""}? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `/api/projects/${data.Project_ID}/transactions?transactionId=${transactionId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete transaction");
      }

      // Refetch transactions to get updated data
      await refetchTransactions();
    } catch (err) {
      console.error("Error deleting transaction:", err);
      alert(err instanceof Error ? err.message : "Failed to delete transaction");
    }
  }

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

          <button
            onClick={() => {
              // Set default date to today
              const today = new Date().toISOString().split('T')[0];
              setNewTransactionDate(today);
              setIsAddTransactionOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#61bc47] hover:bg-[#52a03c] text-white rounded-lg transition-colors"
            title="Add new transaction"
          >
            <Plus className="w-4 h-4" />
            Add Transaction
          </button>
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
                  Purchase Request
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
                <th className="px-6 py-3 text-center text-xs font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">
                  Status
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
                  <td colSpan={10} className="px-6 py-12 text-center text-muted-foreground">
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
                    <td className="px-6 py-4 text-sm text-foreground">
                      {transaction.purchaseRequestId && transaction.requisitionGuid ? (
                        <Link
                          href={`/budgets/${slug}/purchase-requests`}
                          className="inline-flex items-center gap-1 text-purple-600 dark:text-purple-400 hover:underline font-mono text-xs"
                          title={`View Purchase Request ${transaction.requisitionGuid}`}
                        >
                          {formatGuid(transaction.requisitionGuid)}
                          <span className={`ml-1 px-1.5 py-0.5 text-xs rounded ${
                            transaction.purchaseRequestStatus === "Approved"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                          }`}>
                            {transaction.purchaseRequestStatus}
                          </span>
                        </Link>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
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
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                          transaction.approvalStatus === "Approved"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : transaction.approvalStatus === "Rejected"
                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                        }`}
                      >
                        {transaction.approvalStatus}
                      </span>
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
                          onClick={() => {
                            setEditingTransactionId(transaction.transactionId);
                            setEditTransactionDate(transaction.date.split('T')[0]);
                            setEditTransactionType(transaction.type);
                            setEditTransactionAmount(Math.abs(transaction.amount).toString());
                            setEditTransactionPayee(transaction.payee || "");
                            setEditTransactionDescription(transaction.description || "");
                            setEditTransactionPaymentMethod(transaction.paymentMethod || "");

                            // Set line item ID based on transaction type
                            if (transaction.type === "Expense" && transaction.expenseLineItemId) {
                              setEditTransactionLineItemId(transaction.expenseLineItemId.toString());
                            } else if (transaction.type === "Income" && transaction.incomeLineItemId) {
                              setEditTransactionLineItemId(`income-line-${transaction.incomeLineItemId}`);
                            } else {
                              setEditTransactionLineItemId("");
                            }

                            // Set approval status
                            setEditTransactionStatus(transaction.approvalStatus);

                            setIsEditTransactionOpen(true);
                          }}
                          className="p-1.5 hover:bg-zinc-300 dark:hover:bg-zinc-600 rounded transition-colors"
                          title="Edit transaction"
                        >
                          <Edit className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => handleDeleteTransaction(transaction.transactionId, transaction.description)}
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

      {/* Add Transaction Dialog */}
      <Dialog open={isAddTransactionOpen} onOpenChange={setIsAddTransactionOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Transaction</DialogTitle>
            <DialogDescription>
              Create a new expense or income transaction.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="new-transaction-date" className="block text-sm font-medium mb-2">
                  Date *
                </label>
                <input
                  id="new-transaction-date"
                  type="date"
                  value={newTransactionDate}
                  onChange={(e) => setNewTransactionDate(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#61bc47] bg-background text-foreground"
                />
              </div>
              <div>
                <label htmlFor="new-transaction-type" className="block text-sm font-medium mb-2">
                  Type *
                </label>
                <select
                  id="new-transaction-type"
                  value={newTransactionType}
                  onChange={(e) => setNewTransactionType(e.target.value as "Expense" | "Income")}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#61bc47] bg-background text-foreground"
                >
                  <option value="Expense">Expense</option>
                  <option value="Income">Income</option>
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="new-transaction-line-item" className="block text-sm font-medium mb-2">
                Category / Line Item (optional)
              </label>
              <select
                id="new-transaction-line-item"
                value={newTransactionLineItemId}
                onChange={(e) => setNewTransactionLineItemId(e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#61bc47] bg-background text-foreground"
              >
                <option value="">-- Select Line Item --</option>
                {newTransactionType === "Expense" && budgetData?.expenseCategories.map((category) => (
                  <optgroup key={category.categoryId} label={category.name}>
                    {category.lineItems.map((item) => (
                      <option key={item.lineItemId} value={item.lineItemId}>
                        {item.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
                {newTransactionType === "Income" && budgetData?.incomeLineItemsCategories.map((category) => (
                  category.lineItems.map((item) => (
                    <option key={item.lineItemId} value={item.lineItemId}>
                      {item.name}
                    </option>
                  ))
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="new-transaction-status" className="block text-sm font-medium mb-2">
                Approval Status
              </label>
              <select
                id="new-transaction-status"
                value={newTransactionStatus}
                onChange={(e) => setNewTransactionStatus(e.target.value as "Approved" | "Rejected" | "Pending")}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#61bc47] bg-background text-foreground"
              >
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label htmlFor="new-transaction-amount" className="block text-sm font-medium mb-2">
                Amount *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <input
                  id="new-transaction-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={newTransactionAmount}
                  onChange={(e) => setNewTransactionAmount(e.target.value)}
                  className="w-full pl-7 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#61bc47] bg-background text-foreground"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <label htmlFor="new-transaction-payee" className="block text-sm font-medium mb-2">
                Payee (optional)
              </label>
              <input
                id="new-transaction-payee"
                type="text"
                value={newTransactionPayee}
                onChange={(e) => setNewTransactionPayee(e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#61bc47] bg-background text-foreground"
                placeholder="e.g., Vendor Name"
              />
            </div>
            <div>
              <label htmlFor="new-transaction-description" className="block text-sm font-medium mb-2">
                Description (optional)
              </label>
              <textarea
                id="new-transaction-description"
                value={newTransactionDescription}
                onChange={(e) => setNewTransactionDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#61bc47] bg-background text-foreground resize-none"
                placeholder="Brief description of this transaction"
              />
            </div>
            <div>
              <label htmlFor="new-transaction-payment-reference" className="block text-sm font-medium mb-2">
                Payment Reference (optional)
              </label>
              <input
                id="new-transaction-payment-reference"
                type="text"
                value={newTransactionPaymentReference}
                onChange={(e) => setNewTransactionPaymentReference(e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#61bc47] bg-background text-foreground"
                placeholder="e.g., Check #, Invoice #"
              />
            </div>
            <div>
              <label htmlFor="new-transaction-notes" className="block text-sm font-medium mb-2">
                Notes (optional)
              </label>
              <textarea
                id="new-transaction-notes"
                value={newTransactionNotes}
                onChange={(e) => setNewTransactionNotes(e.target.value)}
                rows={2}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#61bc47] bg-background text-foreground resize-none"
                placeholder="Additional notes"
              />
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => {
                setIsAddTransactionOpen(false);
                setNewTransactionDate("");
                setNewTransactionType("Expense");
                setNewTransactionLineItemId("");
                setNewTransactionStatus("Pending");
                setNewTransactionAmount("");
                setNewTransactionPayee("");
                setNewTransactionDescription("");
                setNewTransactionPaymentMethod("");
                setNewTransactionPaymentReference("");
                setNewTransactionNotes("");
              }}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddTransaction}
              disabled={!newTransactionDate || !newTransactionAmount || isSavingTransaction}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[#61bc47] hover:bg-[#52a03c] text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              Add Transaction
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Transaction Dialog */}
      <Dialog open={isEditTransactionOpen} onOpenChange={setIsEditTransactionOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
            <DialogDescription>
              Update the details for this transaction.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="edit-transaction-date" className="block text-sm font-medium mb-2">
                  Date *
                </label>
                <input
                  id="edit-transaction-date"
                  type="date"
                  value={editTransactionDate}
                  onChange={(e) => setEditTransactionDate(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#61bc47] bg-background text-foreground"
                />
              </div>
              <div>
                <label htmlFor="edit-transaction-type" className="block text-sm font-medium mb-2">
                  Type *
                </label>
                <select
                  id="edit-transaction-type"
                  value={editTransactionType}
                  onChange={(e) => setEditTransactionType(e.target.value as "Expense" | "Income")}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#61bc47] bg-background text-foreground"
                >
                  <option value="Expense">Expense</option>
                  <option value="Income">Income</option>
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="edit-transaction-line-item" className="block text-sm font-medium mb-2">
                Category / Line Item (optional)
              </label>
              <select
                id="edit-transaction-line-item"
                value={editTransactionLineItemId}
                onChange={(e) => setEditTransactionLineItemId(e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#61bc47] bg-background text-foreground"
              >
                <option value="">-- Select Line Item --</option>
                {editTransactionType === "Expense" && budgetData?.expenseCategories.map((category) => (
                  <optgroup key={category.categoryId} label={category.name}>
                    {category.lineItems.map((item) => (
                      <option key={item.lineItemId} value={item.lineItemId}>
                        {item.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
                {editTransactionType === "Income" && budgetData?.incomeLineItemsCategories.map((category) => (
                  category.lineItems.map((item) => (
                    <option key={item.lineItemId} value={item.lineItemId}>
                      {item.name}
                    </option>
                  ))
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="edit-transaction-status" className="block text-sm font-medium mb-2">
                Approval Status
              </label>
              <select
                id="edit-transaction-status"
                value={editTransactionStatus}
                onChange={(e) => setEditTransactionStatus(e.target.value as "Approved" | "Rejected" | "Pending")}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#61bc47] bg-background text-foreground"
              >
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label htmlFor="edit-transaction-amount" className="block text-sm font-medium mb-2">
                Amount *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <input
                  id="edit-transaction-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={editTransactionAmount}
                  onChange={(e) => setEditTransactionAmount(e.target.value)}
                  className="w-full pl-7 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#61bc47] bg-background text-foreground"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <label htmlFor="edit-transaction-payee" className="block text-sm font-medium mb-2">
                Payee (optional)
              </label>
              <input
                id="edit-transaction-payee"
                type="text"
                value={editTransactionPayee}
                onChange={(e) => setEditTransactionPayee(e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#61bc47] bg-background text-foreground"
                placeholder="e.g., Vendor Name"
              />
            </div>
            <div>
              <label htmlFor="edit-transaction-description" className="block text-sm font-medium mb-2">
                Description (optional)
              </label>
              <textarea
                id="edit-transaction-description"
                value={editTransactionDescription}
                onChange={(e) => setEditTransactionDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#61bc47] bg-background text-foreground resize-none"
                placeholder="Brief description of this transaction"
              />
            </div>
            <div>
              <label htmlFor="edit-transaction-payment-reference" className="block text-sm font-medium mb-2">
                Payment Reference (optional)
              </label>
              <input
                id="edit-transaction-payment-reference"
                type="text"
                value={editTransactionPaymentReference}
                onChange={(e) => setEditTransactionPaymentReference(e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#61bc47] bg-background text-foreground"
                placeholder="e.g., Check #, Invoice #"
              />
            </div>
            <div>
              <label htmlFor="edit-transaction-notes" className="block text-sm font-medium mb-2">
                Notes (optional)
              </label>
              <textarea
                id="edit-transaction-notes"
                value={editTransactionNotes}
                onChange={(e) => setEditTransactionNotes(e.target.value)}
                rows={2}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#61bc47] bg-background text-foreground resize-none"
                placeholder="Additional notes"
              />
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => {
                setIsEditTransactionOpen(false);
                setEditingTransactionId(null);
                setEditTransactionDate("");
                setEditTransactionType("Expense");
                setEditTransactionLineItemId("");
                setEditTransactionStatus("Pending");
                setEditTransactionAmount("");
                setEditTransactionPayee("");
                setEditTransactionDescription("");
                setEditTransactionPaymentMethod("");
                setEditTransactionPaymentReference("");
                setEditTransactionNotes("");
              }}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleEditTransaction}
              disabled={!editTransactionDate || !editTransactionAmount || isSavingEditTransaction}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[#61bc47] hover:bg-[#52a03c] text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Changes
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
