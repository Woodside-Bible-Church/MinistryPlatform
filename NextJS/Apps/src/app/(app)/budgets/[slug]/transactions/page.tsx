"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Receipt,
  DollarSign,
  Search,
  Plus,
  Edit,
  Trash2,
  Copy,
  Check,
} from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface Transaction {
  transactionId: number;
  date: string;
  type: "Expense" | "Income";
  amount: number;
  description: string;
  paymentMethod: string | null;
  payee: string | null;
  categoryItem: string | null;
  lineItemId: number | null;
  submittedByContactId: number | null;
  submittedByName: string | null;
  purchaseRequestId: number | null;
  requisitionGuid: string | null;
  purchaseRequestStatus: string | null;
  purchaseRequestDescription: string | null;
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

interface PurchaseRequest {
  requestId: number;
  requisitionGuid: string;
  requestDate: string;
  status: string;
  lineItemName: string;
  lineItemId: number;
  totalAmount: number;
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
  const router = useRouter();
  const [data, setData] = useState<ProjectTransactions | null>(null);
  const [budgetData, setBudgetData] = useState<ProjectBudget | null>(null);
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedGuid, setCopiedGuid] = useState<string | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "Expense" | "Income">("all");
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");

  // Add Transaction modal state
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [newTransactionDate, setNewTransactionDate] = useState("");
  const [newTransactionType, setNewTransactionType] = useState<"Expense" | "Income">("Expense");
  const [newTransactionPurchaseRequestId, setNewTransactionPurchaseRequestId] = useState<string>("");
  const [newTransactionLineItemId, setNewTransactionLineItemId] = useState<string>("");
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

        // First fetch budget data to get project ID
        const budgetResponse = await fetch(`/api/projects/budgets/${encodeURIComponent(slug)}`);
        if (!budgetResponse.ok) {
          const errorData = await budgetResponse.json();
          throw new Error(errorData.error || "Failed to fetch budget data");
        }
        const budgetDataResponse = await budgetResponse.json();
        setBudgetData(budgetDataResponse);

        // Now fetch transactions and purchase requests in parallel using project ID
        const [transactionsResponse, purchaseRequestsResponse] = await Promise.all([
          fetch(`/api/projects/budgets/${encodeURIComponent(slug)}/transactions`),
          fetch(`/api/projects/${budgetDataResponse.Project_ID}/purchase-requests`),
        ]);

        if (!transactionsResponse.ok) {
          const errorData = await transactionsResponse.json();
          throw new Error(errorData.error || "Failed to fetch transactions");
        }

        const transactionsData = await transactionsResponse.json();
        setData(transactionsData);

        // Purchase requests may not be available for all projects
        if (purchaseRequestsResponse.ok) {
          const purchaseRequestsData = await purchaseRequestsResponse.json();
          setPurchaseRequests(purchaseRequestsData.purchaseRequests || []);
        }
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

  async function handleCopyGuid(guid: string) {
    try {
      await navigator.clipboard.writeText(guid);
      setCopiedGuid(guid);
      setTimeout(() => setCopiedGuid(null), 2000);
    } catch (err) {
      console.error("Failed to copy GUID:", err);
    }
  }

  async function handleAddTransaction() {
    if (!data) return;

    const amount = parseFloat(newTransactionAmount);

    if (!newTransactionDate || !amount || !newTransactionLineItemId) {
      toast.error("Date, amount, and line item are required");
      return;
    }

    // For expense transactions, purchase request is required
    if (newTransactionType === "Expense" && !newTransactionPurchaseRequestId) {
      toast.error("Purchase request is required for expense transactions");
      return;
    }

    // Close modal and show optimistic update
    setIsAddTransactionOpen(false);
    setIsSavingTransaction(true);

    // Show loading toast
    const toastId = toast.loading("Creating transaction...");

    // Store original data for rollback
    const originalData = data;

    try {
      // Find line item name for display
      let categoryItemName = "Uncategorized";
      if (newTransactionLineItemId && budgetData) {
        if (newTransactionType === "Expense") {
          for (const category of budgetData.expenseCategories) {
            const item = category.lineItems.find(item => item.lineItemId === newTransactionLineItemId);
            if (item) {
              categoryItemName = `${category.name} | ${item.name}`;
              break;
            }
          }
        } else {
          for (const category of budgetData.incomeLineItemsCategories) {
            const item = category.lineItems.find(item => item.lineItemId === newTransactionLineItemId);
            if (item) {
              categoryItemName = item.name;
              break;
            }
          }
        }
      }

      // Create optimistic transaction
      const optimisticTransaction: Transaction = {
        transactionId: Date.now(), // Temporary ID
        date: newTransactionDate,
        type: newTransactionType,
        amount: newTransactionType === "Expense" ? -Math.abs(amount) : Math.abs(amount),
        description: newTransactionDescription.trim() || "",
        paymentMethod: newTransactionPaymentMethod || null,
        payee: newTransactionPayee.trim() || null,
        categoryItem: categoryItemName,
        lineItemId: newTransactionLineItemId ? parseInt(newTransactionLineItemId, 10) : null,
        purchaseRequestId: null,
        requisitionGuid: null,
        purchaseRequestStatus: null,
      };

      // Optimistic UI update
      setData({
        ...data,
        transactions: [optimisticTransaction, ...data.transactions],
        Total_Transactions: data.Total_Transactions + 1,
        Total_Expenses: newTransactionType === "Expense" ? data.Total_Expenses + amount : data.Total_Expenses,
        Total_Income: newTransactionType === "Income" ? data.Total_Income + amount : data.Total_Income,
        Expense_Transaction_Count: newTransactionType === "Expense" ? data.Expense_Transaction_Count + 1 : data.Expense_Transaction_Count,
        Income_Transaction_Count: newTransactionType === "Income" ? data.Income_Transaction_Count + 1 : data.Income_Transaction_Count,
      });

      const response = await fetch(`/api/projects/${data.Project_ID}/transactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transactionDate: newTransactionDate,
          transactionType: newTransactionType,
          amount: amount,
          lineItemId: parseInt(newTransactionLineItemId, 10),
          purchaseRequestId: newTransactionPurchaseRequestId ? parseInt(newTransactionPurchaseRequestId, 10) : null,
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

      // Refetch to get accurate server data with real IDs
      await refetchTransactions();

      // Reset form
      setNewTransactionDate("");
      setNewTransactionType("Expense");
      setNewTransactionPurchaseRequestId("");
      setNewTransactionLineItemId("");
      setNewTransactionAmount("");
      setNewTransactionPayee("");
      setNewTransactionDescription("");
      setNewTransactionPaymentMethod("");
      setNewTransactionPaymentReference("");
      setNewTransactionNotes("");

      toast.success("Transaction created successfully", { id: toastId });
    } catch (err) {
      console.error("Error creating transaction:", err);
      // Rollback optimistic update
      setData(originalData);
      toast.error(err instanceof Error ? err.message : "Failed to create transaction", { id: toastId });
    } finally {
      setIsSavingTransaction(false);
    }
  }

  async function handleEditTransaction() {
    if (!data || !editingTransactionId) return;

    const amount = parseFloat(editTransactionAmount);

    if (!editTransactionDate || !amount) {
      toast.error("Date and amount are required");
      return;
    }

    // Close modal and show optimistic update
    setIsEditTransactionOpen(false);
    setIsSavingEditTransaction(true);

    // Show loading toast
    const toastId = toast.loading("Updating transaction...");

    // Store original data for rollback
    const originalData = data;

    try {
      // Optimistic UI update
      const updatedTransactions = data.transactions.map((t) =>
        t.transactionId === editingTransactionId
          ? {
              ...t,
              date: editTransactionDate,
              type: editTransactionType,
              amount: editTransactionType === "Expense" ? -Math.abs(amount) : Math.abs(amount),
              payee: editTransactionPayee.trim() || null,
              description: editTransactionDescription.trim() || "",
              paymentMethod: editTransactionPaymentMethod || null,
            }
          : t
      );

      setData({
        ...data,
        transactions: updatedTransactions,
      });

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
          lineItemId: editTransactionLineItemId ? parseInt(editTransactionLineItemId, 10) : null,
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

      // Refetch to get accurate server data
      await refetchTransactions();

      // Reset form
      setEditingTransactionId(null);
      setEditTransactionDate("");
      setEditTransactionType("Expense");
      setEditTransactionLineItemId("");
      setEditTransactionAmount("");
      setEditTransactionPayee("");
      setEditTransactionDescription("");
      setEditTransactionPaymentMethod("");
      setEditTransactionPaymentReference("");
      setEditTransactionNotes("");

      toast.success("Transaction updated successfully", { id: toastId });
    } catch (err) {
      console.error("Error updating transaction:", err);
      // Rollback optimistic update
      setData(originalData);
      toast.error(err instanceof Error ? err.message : "Failed to update transaction", { id: toastId });
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

    // Show loading toast
    const toastId = toast.loading("Deleting transaction...");

    // Store original data for rollback
    const originalData = data;

    // Find the transaction being deleted to update totals
    const transactionToDelete = data.transactions.find(t => t.transactionId === transactionId);

    if (!transactionToDelete) {
      toast.error("Transaction not found", { id: toastId });
      return;
    }

    try {
      // Optimistic UI update - remove transaction from list
      const updatedTransactions = data.transactions.filter(t => t.transactionId !== transactionId);
      const transactionAmount = Math.abs(transactionToDelete.amount);

      setData({
        ...data,
        transactions: updatedTransactions,
        Total_Transactions: data.Total_Transactions - 1,
        Total_Expenses: transactionToDelete.type === "Expense" ? data.Total_Expenses - transactionAmount : data.Total_Expenses,
        Total_Income: transactionToDelete.type === "Income" ? data.Total_Income - transactionAmount : data.Total_Income,
        Expense_Transaction_Count: transactionToDelete.type === "Expense" ? data.Expense_Transaction_Count - 1 : data.Expense_Transaction_Count,
        Income_Transaction_Count: transactionToDelete.type === "Income" ? data.Income_Transaction_Count - 1 : data.Income_Transaction_Count,
      });

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

      // Refetch to get accurate server data
      await refetchTransactions();

      toast.success("Transaction deleted successfully", { id: toastId });
    } catch (err) {
      console.error("Error deleting transaction:", err);
      // Rollback optimistic update
      setData(originalData);
      toast.error(err instanceof Error ? err.message : "Failed to delete transaction", { id: toastId });
    }
  }

  // Filter and sort transactions
  const filteredTransactions = (data?.transactions || []).filter((transaction) => {
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
        transaction.categoryItem?.toLowerCase().includes(query) ||
        transaction.requisitionGuid?.toLowerCase().includes(query)
      );
    }

    return true;
  }).sort((a, b) => {
    if (sortBy === "date") {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    } else {
      return Math.abs(b.amount) - Math.abs(a.amount);
    }
  });

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
          <BackButton
            fallbackUrl={`/budgets/${slug}`}
            label="Back"
            className="inline-flex items-center gap-2 text-[#61bc47] hover:underline"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-8 max-w-[1600px]">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <div className="flex justify-between items-center mb-4">
          <BackButton
            fallbackUrl={`/budgets/${slug}`}
            label="Back"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-[#61bc47] transition-colors"
          />

          <button
            onClick={() => {
              // Set default date to today
              const today = new Date().toISOString().split('T')[0];
              setNewTransactionDate(today);
              setIsAddTransactionOpen(true);
            }}
            className="inline-flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 bg-[#61bc47] hover:bg-[#52a03c] text-white rounded-lg transition-colors text-sm"
            title="Add new transaction"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Transaction</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary dark:text-foreground mb-2">
            transactions
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            All expenses and income for {data.Project_Title}
          </p>
        </div>
      </div>

      {/* Stats Cards - Carousel on mobile, grid on desktop */}
      <div className="mb-6 md:mb-8">
        {/* Mobile: Horizontal scroll carousel */}
        <div className="md:hidden overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4">
          <div className="flex gap-4 pb-2">
            {/* Total Transactions */}
            <div className="bg-card border border-border rounded-lg p-6 min-w-[85vw] snap-center">
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
            <div className="bg-card border border-border rounded-lg p-6 min-w-[85vw] snap-center">
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
            <div className="bg-card border border-border rounded-lg p-6 min-w-[85vw] snap-center">
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
        </div>

        {/* Desktop: Grid layout */}
        <div className="hidden md:grid md:grid-cols-3 gap-6">
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
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-lg p-4 md:p-6 mb-6 md:mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="sm:col-span-2">
            <label className="block text-xs md:text-sm font-medium text-muted-foreground mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-zinc-100 dark:bg-zinc-800 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#61bc47] text-foreground"
              />
            </div>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-xs md:text-sm font-medium text-muted-foreground mb-2">
              Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="w-full px-3 md:px-4 py-2 text-sm bg-zinc-100 dark:bg-zinc-800 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#61bc47] text-foreground"
            >
              <option value="all">All Types</option>
              <option value="Expense">Expense</option>
              <option value="Income">Income</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-xs md:text-sm font-medium text-muted-foreground mb-2">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 md:px-4 py-2 text-sm bg-zinc-100 dark:bg-zinc-800 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#61bc47] text-foreground"
            >
              <option value="date">Date</option>
              <option value="amount">Amount</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-6 md:space-y-4">
        {filteredTransactions.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-12 text-center">
            <p className="text-muted-foreground">No transactions found</p>
          </div>
        ) : (
          filteredTransactions.map((transaction) => (
            <Link
              key={transaction.transactionId}
              href={`/budgets/${slug}/transactions/${transaction.transactionId}`}
              prefetch={true}
              className="block bg-card border border-border rounded-lg p-4 md:p-6 hover:shadow-lg hover:border-[#61bc47]/30 transition-all relative"
            >
              {/* Type Badge and Action Icons Row - AT TOP */}
              <div className="flex items-center justify-between gap-2 mb-3 md:mb-4">
                {/* Type Badge - Left side */}
                <div
                  className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-bold rounded-md ${
                    transaction.type === "Expense"
                      ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                      : "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                  {transaction.type === "Expense" ? "EXPENSE" : "INCOME"}
                </div>

                {/* Action Icons - Right side */}
                <div className="flex items-center gap-1 -mr-2">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setEditingTransactionId(transaction.transactionId);
                      setEditTransactionDate(transaction.date.split('T')[0]);
                      setEditTransactionType(transaction.type);
                      setEditTransactionAmount(Math.abs(transaction.amount).toString());
                      setEditTransactionPayee(transaction.payee || "");
                      setEditTransactionDescription(transaction.description || "");
                      setEditTransactionPaymentMethod(transaction.paymentMethod || "");

                      if (transaction.lineItemId) {
                        setEditTransactionLineItemId(transaction.lineItemId.toString());
                      } else {
                        setEditTransactionLineItemId("");
                      }

                      setIsEditTransactionOpen(true);
                    }}
                    className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition-colors"
                    title="Edit transaction"
                  >
                    <Edit className="w-5 h-5 text-muted-foreground" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDeleteTransaction(transaction.transactionId, transaction.description);
                    }}
                    className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                    title="Delete transaction"
                  >
                    <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </button>
                </div>
              </div>

              {/* Line Item - Small uppercase muted text */}
              <div className="text-xs text-muted-foreground uppercase tracking-wide leading-tight mb-1">
                {/* Line Item Name - always on first line, bolder */}
                <div className="font-semibold">
                  {transaction.categoryItem?.includes(" | ")
                    ? transaction.categoryItem.split(" | ")[1]
                    : transaction.categoryItem || "Uncategorized"
                  }
                </div>

                {/* Purchase Request Description + GUID - on desktop inline, on mobile new line */}
                {(transaction.purchaseRequestDescription || (transaction.purchaseRequestId && transaction.requisitionGuid)) && (
                  <div className="flex flex-wrap items-center gap-x-2 mt-0.5 md:inline md:mt-0 opacity-75">
                    {/* Purchase Request Description */}
                    {transaction.purchaseRequestDescription && (
                      <span>{transaction.purchaseRequestDescription.toUpperCase()}</span>
                    )}

                    {/* Purchase Request GUID in parentheses - more subtle */}
                    {transaction.purchaseRequestId && transaction.requisitionGuid && (
                      <span className="inline-flex items-center gap-1 opacity-80">
                        <span>(</span>
                        <span
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            router.push(`/budgets/${slug}/purchase-requests/${transaction.purchaseRequestId}`);
                          }}
                          className="font-mono text-[0.65rem] hover:text-[#61bc47] hover:opacity-100 transition-all cursor-pointer truncate max-w-[120px] md:max-w-none"
                          title={`View purchase request: ${transaction.requisitionGuid.toUpperCase()}`}
                        >
                          {transaction.requisitionGuid.toUpperCase()}
                        </span>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleCopyGuid(transaction.requisitionGuid!);
                          }}
                          className="p-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition-colors hover:opacity-100"
                          title="Copy GUID"
                        >
                          {copiedGuid === transaction.requisitionGuid ? (
                            <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                        <span>)</span>
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Description (MAIN FOCUS) */}
              <h3 className="text-2xl md:text-3xl font-bold text-foreground leading-tight mb-3">
                {transaction.description || transaction.categoryItem?.split(" | ")[1] || transaction.categoryItem || "Transaction"}
              </h3>

              {/* Submitter, Payee, Payment Method row */}
              {(transaction.submittedByName || transaction.payee || transaction.paymentMethod) && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground mb-3">
                  {/* Submitted By */}
                  {transaction.submittedByName && (
                    <span>{transaction.submittedByName}</span>
                  )}

                  {/* Payee if exists */}
                  {transaction.payee && (
                    <>
                      {transaction.submittedByName && <span>•</span>}
                      <span>{transaction.payee}</span>
                    </>
                  )}

                  {/* Payment Method if exists */}
                  {transaction.paymentMethod && (
                    <>
                      {(transaction.submittedByName || transaction.payee) && <span>•</span>}
                      <span className="inline-block px-2 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-xs font-medium text-foreground">
                        {transaction.paymentMethod}
                      </span>
                    </>
                  )}
                </div>
              )}

              {/* Bottom Row: Date (left) and Amount (right) */}
              <div className="flex items-end justify-between gap-4">
                {/* Date - bottom left */}
                <div className="text-sm text-muted-foreground">
                  {formatDate(transaction.date)}
                </div>

                {/* Amount - bottom right */}
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-xs md:text-sm font-medium text-muted-foreground">
                    Amount
                  </span>
                  <div
                    className={`text-xl md:text-2xl lg:text-3xl font-bold whitespace-nowrap ${
                      transaction.type === "Expense"
                        ? "text-red-600 dark:text-red-400"
                        : "text-green-600 dark:text-green-400"
                    }`}
                  >
                    {transaction.type === "Expense" ? "-" : "+"}
                    {formatCurrency(Math.abs(transaction.amount))}
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
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
                Category / Line Item *
              </label>
              <select
                id="new-transaction-line-item"
                value={newTransactionLineItemId}
                onChange={(e) => {
                  setNewTransactionLineItemId(e.target.value);
                  // Reset purchase request when line item changes
                  setNewTransactionPurchaseRequestId("");
                }}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#61bc47] bg-background text-foreground"
              >
                <option value="">-- Select Line Item --</option>
                {newTransactionType === "Expense" && budgetData?.expenseCategories
                  .filter((category) => category.lineItems && category.lineItems.length > 0)
                  .map((category) => (
                  <optgroup key={category.categoryId} label={category.name}>
                    {category.lineItems.map((item) => (
                      <option key={item.lineItemId} value={item.lineItemId}>
                        {item.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
                {newTransactionType === "Income" && budgetData?.incomeLineItemsCategories
                  ?.filter((category) => category.lineItems && category.lineItems.length > 0)
                  .map((category) => (
                  <optgroup key={category.categoryId} label={category.name}>
                    {category.lineItems.map((item) => (
                      <option key={item.lineItemId} value={item.lineItemId}>
                        {item.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            {newTransactionType === "Expense" && newTransactionLineItemId && (
              <div>
                <label htmlFor="new-transaction-purchase-request" className="block text-sm font-medium mb-2">
                  Purchase Request *
                </label>
                <select
                  id="new-transaction-purchase-request"
                  value={newTransactionPurchaseRequestId}
                  onChange={(e) => {
                    if (e.target.value === "__CREATE_NEW__") {
                      // Open purchase request creation in new tab
                      window.open(`/budgets/${slug}/line-items/${newTransactionLineItemId}`, '_blank');
                      e.target.value = ""; // Reset dropdown
                    } else {
                      setNewTransactionPurchaseRequestId(e.target.value);
                    }
                  }}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#61bc47] bg-background text-foreground"
                >
                  <option value="">-- Select Purchase Request --</option>
                  {purchaseRequests
                    .filter((pr) => pr.lineItemId === parseInt(newTransactionLineItemId, 10))
                    .map((pr) => (
                      <option key={pr.requestId} value={pr.requestId}>
                        {pr.requisitionGuid.toUpperCase()} - {formatCurrency(pr.totalAmount)} ({pr.status})
                      </option>
                    ))}
                  <option value="__CREATE_NEW__" className="font-semibold text-[#61bc47]">
                    + Create New Purchase Request...
                  </option>
                </select>
                {purchaseRequests.filter((pr) => pr.lineItemId === parseInt(newTransactionLineItemId, 10)).length === 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    No purchase requests found for this line item. Create one to continue.
                  </p>
                )}
              </div>
            )}
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
                Payee
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
                Description
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
                Payment Reference
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
                Notes
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
                setNewTransactionPurchaseRequestId("");
                setNewTransactionLineItemId("");
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
              disabled={
                !newTransactionDate ||
                !newTransactionAmount ||
                !newTransactionLineItemId ||
                (newTransactionType === "Expense" && !newTransactionPurchaseRequestId) ||
                isSavingTransaction
              }
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
                Category / Line Item *
              </label>
              <select
                id="edit-transaction-line-item"
                value={editTransactionLineItemId}
                onChange={(e) => setEditTransactionLineItemId(e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#61bc47] bg-background text-foreground"
              >
                <option value="">-- Select Line Item --</option>
                {editTransactionType === "Expense" && budgetData?.expenseCategories
                  .filter((category) => category.lineItems && category.lineItems.length > 0)
                  .map((category) => (
                  <optgroup key={category.categoryId} label={category.name}>
                    {category.lineItems.map((item) => (
                      <option key={item.lineItemId} value={item.lineItemId}>
                        {item.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
                {editTransactionType === "Income" && budgetData?.incomeLineItemsCategories
                  ?.filter((category) => category.lineItems && category.lineItems.length > 0)
                  .map((category) => (
                  <optgroup key={category.categoryId} label={category.name}>
                    {category.lineItems.map((item) => (
                      <option key={item.lineItemId} value={item.lineItemId}>
                        {item.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
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
                Payee
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
                Description
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
                Payment Reference
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
                Notes
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
