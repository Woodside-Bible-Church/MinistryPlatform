"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  DollarSign,
  Search,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Edit,
  Trash2,
  Receipt,
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
import PinButton from "@/components/PinButton";
import { usePinnedItems } from "@/hooks/usePinnedItems";

interface PurchaseRequest {
  purchaseRequestId: number;
  requisitionGuid: string;
  projectId: number;
  lineItemId: number;
  lineItemName: string;
  categoryId: number;
  categoryName: string;
  amount: number;
  description: string | null;
  vendorName: string | null;
  requestedDate: string;
  approvalStatus: "Pending" | "Approved" | "Rejected";
  approvedDate: string | null;
  rejectionReason: string | null;
  requestedByContactId: number;
  requestedByName: string;
  requestedByEmail: string;
  approvedByContactId: number | null;
  approvedByName: string | null;
  transactionCount: number;
  transactionTotal: number;
  remainingAmount: number;
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

export default function PurchaseRequestsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { isPinned, pinItem, unpinItem } = usePinnedItems();
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [projectId, setProjectId] = useState<number | null>(null);
  const [projectTitle, setProjectTitle] = useState<string>("");
  const [budgetData, setBudgetData] = useState<ProjectBudget | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [viewMode, setViewMode] = useState<"my-requests" | "all-requests">("my-requests");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "Pending" | "Approved" | "Rejected">("all");
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");

  // Create Request modal state
  const [isCreateRequestOpen, setIsCreateRequestOpen] = useState(false);
  const [newRequestLineItemId, setNewRequestLineItemId] = useState("");
  const [newRequestAmount, setNewRequestAmount] = useState("");
  const [newRequestDescription, setNewRequestDescription] = useState("");
  const [newRequestVendorName, setNewRequestVendorName] = useState("");
  const [isSavingRequest, setIsSavingRequest] = useState(false);

  // Approve/Reject modal state
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [approvingRequest, setApprovingRequest] = useState<PurchaseRequest | null>(null);
  const [approvalAction, setApprovalAction] = useState<"Approved" | "Rejected" | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSavingApproval, setIsSavingApproval] = useState(false);

  // Add Transaction modal state
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [transactionRequest, setTransactionRequest] = useState<PurchaseRequest | null>(null);
  const [transactionDate, setTransactionDate] = useState("");
  const [transactionAmount, setTransactionAmount] = useState("");
  const [transactionDescription, setTransactionDescription] = useState("");
  const [transactionVendorName, setTransactionVendorName] = useState("");
  const [transactionPaymentMethodId, setTransactionPaymentMethodId] = useState("");
  const [isSavingTransaction, setIsSavingTransaction] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        setError(null);

        // First get project info to get project ID
        const projectResponse = await fetch(`/api/projects/budgets/${encodeURIComponent(slug)}`);
        if (!projectResponse.ok) {
          throw new Error("Failed to fetch project data");
        }
        const projectData = await projectResponse.json();
        setProjectId(projectData.Project_ID);
        setProjectTitle(projectData.Project_Title);
        setBudgetData(projectData);

        // Then fetch purchase requests
        const filterByMe = viewMode === "my-requests";
        const response = await fetch(
          `/api/projects/${projectData.Project_ID}/purchase-requests?filterByMe=${filterByMe}`
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch purchase requests");
        }

        const data = await response.json();
        setRequests(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [slug, viewMode]);

  async function refetchRequests() {
    if (!projectId) return;

    try {
      const filterByMe = viewMode === "my-requests";
      const response = await fetch(
        `/api/projects/${projectId}/purchase-requests?filterByMe=${filterByMe}`
      );
      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      }
    } catch (err) {
      console.error("Error refetching purchase requests:", err);
    }
  }

  async function handleCreateRequest() {
    if (!projectId) return;

    const amount = parseFloat(newRequestAmount);

    if (!newRequestLineItemId || !amount) {
      alert("Line item and amount are required");
      return;
    }

    setIsCreateRequestOpen(false);
    setIsSavingRequest(true);

    try {
      const response = await fetch(`/api/projects/${projectId}/purchase-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lineItemId: parseInt(newRequestLineItemId, 10),
          amount: amount,
          description: newRequestDescription.trim() || null,
          vendorName: newRequestVendorName.trim() || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create purchase request");
      }

      // Refetch requests
      await refetchRequests();

      // Reset form
      setNewRequestLineItemId("");
      setNewRequestAmount("");
      setNewRequestDescription("");
      setNewRequestVendorName("");
    } catch (err) {
      console.error("Error creating purchase request:", err);
      alert(err instanceof Error ? err.message : "Failed to create purchase request");
    } finally {
      setIsSavingRequest(false);
    }
  }

  async function handleApprovalAction() {
    if (!projectId || !approvingRequest || !approvalAction) return;

    if (approvalAction === "Rejected" && !rejectionReason.trim()) {
      alert("Please provide a reason for rejection");
      return;
    }

    setIsApprovalModalOpen(false);
    setIsSavingApproval(true);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/purchase-requests/${approvingRequest.purchaseRequestId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            approvalStatus: approvalAction,
            rejectionReason: approvalAction === "Rejected" ? rejectionReason.trim() : null,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update purchase request");
      }

      // Refetch requests
      await refetchRequests();

      // Reset form
      setApprovingRequest(null);
      setApprovalAction(null);
      setRejectionReason("");
    } catch (err) {
      console.error("Error updating purchase request:", err);
      alert(err instanceof Error ? err.message : "Failed to update purchase request");
    } finally {
      setIsSavingApproval(false);
    }
  }

  async function handleAddTransaction() {
    if (!projectId || !transactionRequest) return;

    const amount = parseFloat(transactionAmount);

    if (!transactionDate || !amount) {
      alert("Date and amount are required");
      return;
    }

    setIsAddTransactionOpen(false);
    setIsSavingTransaction(true);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/purchase-requests/${transactionRequest.purchaseRequestId}/transactions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: amount,
            transactionDate: transactionDate,
            description: transactionDescription.trim() || null,
            vendorName: transactionVendorName.trim() || null,
            paymentMethodId: transactionPaymentMethodId ? parseInt(transactionPaymentMethodId, 10) : null,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add transaction");
      }

      // Refetch requests to update transaction counts
      await refetchRequests();

      // Reset form
      setTransactionRequest(null);
      setTransactionDate("");
      setTransactionAmount("");
      setTransactionDescription("");
      setTransactionVendorName("");
      setTransactionPaymentMethodId("");
    } catch (err) {
      console.error("Error adding transaction:", err);
      alert(err instanceof Error ? err.message : "Failed to add transaction");
    } finally {
      setIsSavingTransaction(false);
    }
  }

  async function handleDeleteRequest(request: PurchaseRequest) {
    if (!projectId) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete this purchase request${request.description ? ` "${request.description}"` : ""}? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `/api/projects/${projectId}/purchase-requests/${request.purchaseRequestId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete purchase request");
      }

      // Refetch requests
      await refetchRequests();
    } catch (err) {
      console.error("Error deleting purchase request:", err);
      alert(err instanceof Error ? err.message : "Failed to delete purchase request");
    }
  }

  // Filter and sort requests
  const filteredRequests = requests.filter((request) => {
    // Status filter
    if (statusFilter !== "all" && request.approvalStatus !== statusFilter) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        request.requisitionGuid.toLowerCase().includes(query) ||
        request.lineItemName.toLowerCase().includes(query) ||
        request.categoryName.toLowerCase().includes(query) ||
        request.vendorName?.toLowerCase().includes(query) ||
        request.description?.toLowerCase().includes(query) ||
        request.requestedByName.toLowerCase().includes(query)
      );
    }

    return true;
  }).sort((a, b) => {
    if (sortBy === "date") {
      return new Date(b.requestedDate).getTime() - new Date(a.requestedDate).getTime();
    } else {
      return Math.abs(b.amount) - Math.abs(a.amount);
    }
  });

  // Calculate stats
  const pendingCount = requests.filter(r => r.approvalStatus === "Pending").length;
  const approvedCount = requests.filter(r => r.approvalStatus === "Approved").length;
  const totalRequested = requests.reduce((sum, r) => sum + r.amount, 0);

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

  if (error) {
    return (
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 max-w-[1600px]">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Error Loading Purchase Requests
          </h2>
          <p className="text-muted-foreground mb-6">{error}</p>
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
    <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 max-w-[1600px]">
      {/* Header */}
      <div className="mb-8">
        <BackButton
          fallbackUrl={`/budgets/${slug}`}
          label="Back"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-[#61bc47] mb-4 transition-colors"
        />

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-primary dark:text-foreground mb-2">
              purchase requests
            </h1>
            <p className="text-muted-foreground">
              Expense approval requests for {projectTitle}
            </p>
          </div>

          <button
            onClick={() => {
              setIsCreateRequestOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#61bc47] hover:bg-[#52a03c] text-white rounded-lg transition-colors"
            title="Create new purchase request"
          >
            <Plus className="w-4 h-4" />
            New Request
          </button>
        </div>
      </div>

      {/* Quick Approval Card */}
      {requests.filter(r => r.approvalStatus === "Pending").length > 0 && (
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-500" />
              <h2 className="text-xl font-semibold text-foreground">Quick Approval</h2>
              <span className="ml-2 px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-medium rounded-full">
                {requests.filter(r => r.approvalStatus === "Pending").length} pending
              </span>
            </div>
            <PinButton
              itemType="purchase-requests-approval"
              itemId={slug}
              itemData={{
                title: `${projectTitle} - Purchase Requests`,
                description: `Quick approval for ${requests.filter(r => r.approvalStatus === "Pending").length} pending request${requests.filter(r => r.approvalStatus === "Pending").length !== 1 ? 's' : ''}`,
              }}
              route={`/budgets/${slug}/purchase-requests`}
              isPinned={isPinned("purchase-requests-approval", slug)}
              onPin={pinItem}
              onUnpin={unpinItem}
            />
          </div>
          <div className="space-y-3">
            {requests
              .filter(r => r.approvalStatus === "Pending")
              .slice(0, 5)
              .map((request) => (
                <div
                  key={request.purchaseRequestId}
                  className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-4 flex items-center justify-between hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  <div className="flex-1 min-w-0 mr-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-purple-600 dark:text-purple-400 font-semibold">
                        {formatGuid(request.requisitionGuid)}
                      </span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-sm font-medium text-foreground truncate">
                        {request.lineItemName}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {request.requestedByName}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        {formatCurrency(request.amount)}
                      </span>
                      <span>•</span>
                      <span>{formatDate(request.requestedDate)}</span>
                    </div>
                    {request.description && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {request.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => {
                        setApprovingRequest(request);
                        setApprovalAction("Approved");
                        setIsApprovalModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md transition-colors"
                      title="Approve request"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        setApprovingRequest(request);
                        setApprovalAction("Rejected");
                        setIsApprovalModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md transition-colors"
                      title="Reject request"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                </div>
              ))}
          </div>
          {requests.filter(r => r.approvalStatus === "Pending").length > 5 && (
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                + {requests.filter(r => r.approvalStatus === "Pending").length - 5} more pending request{requests.filter(r => r.approvalStatus === "Pending").length - 5 !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>
      )}

      {/* View Toggle */}
      <div className="mb-6 flex justify-center">
        <button
          onClick={() => setViewMode(viewMode === "my-requests" ? "all-requests" : "my-requests")}
          className="relative inline-flex rounded-xl bg-zinc-100 dark:bg-zinc-800 p-1 shadow-inner cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
        >
          {/* Sliding background indicator */}
          <div
            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-[#61BC47] rounded-lg shadow-md transition-all duration-300 ease-in-out pointer-events-none ${
              viewMode === "my-requests" ? "left-1" : "left-[calc(50%+4px-1px)]"
            }`}
          />

          {/* Labels */}
          <div
            className={`relative z-10 px-8 py-2.5 rounded-lg font-medium transition-all duration-300 pointer-events-none ${
              viewMode === "my-requests"
                ? "text-white"
                : "text-muted-foreground"
            }`}
          >
            My Requests
          </div>
          <div
            className={`relative z-10 px-8 py-2.5 rounded-lg font-medium transition-all duration-300 pointer-events-none ${
              viewMode === "all-requests"
                ? "text-white"
                : "text-muted-foreground"
            }`}
          >
            All Requests
          </div>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Pending Requests */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Pending Approval
            </h3>
            <Clock className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="text-3xl font-bold text-foreground">
            {pendingCount}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {pendingCount} {pendingCount === 1 ? "request" : "requests"} awaiting review
          </p>
        </div>

        {/* Approved Requests */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Approved
            </h3>
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-3xl font-bold text-green-600 dark:text-green-400">
            {approvedCount}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {approvedCount} {approvedCount === 1 ? "request" : "requests"} approved
          </p>
        </div>

        {/* Total Requested */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Total Requested
            </h3>
            <DollarSign className="w-5 h-5 text-purple-500" />
          </div>
          <div className="text-3xl font-bold text-foreground">
            {formatCurrency(totalRequested)}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Across {requests.length} {requests.length === 1 ? "request" : "requests"}
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
                placeholder="Search by GUID, line item, vendor, or requester..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-zinc-100 dark:bg-zinc-800 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#61bc47] text-foreground"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-4 py-2 bg-zinc-100 dark:bg-zinc-800 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#61bc47] text-foreground"
            >
              <option value="all">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
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

      {/* Requests Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-zinc-200 dark:bg-zinc-900 border-b border-border">
                <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">
                  Requisition ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">
                  Requested By
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">
                  Line Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">
                  Vendor
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-muted-foreground">
                    No purchase requests found
                  </td>
                </tr>
              ) : (
                filteredRequests.map((request) => (
                  <tr
                    key={request.purchaseRequestId}
                    className="bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                      <span className="text-purple-600 dark:text-purple-400 font-semibold">
                        {formatGuid(request.requisitionGuid)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      <div className="font-medium">{request.requestedByName}</div>
                      <div className="text-xs text-muted-foreground">{request.requestedByEmail}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      <div className="font-medium">{request.lineItemName}</div>
                      <div className="text-xs text-muted-foreground">{request.categoryName}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {request.vendorName || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground max-w-xs truncate">
                      {request.description || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="font-semibold text-foreground">
                        {formatCurrency(request.amount)}
                      </div>
                      {request.transactionCount > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatCurrency(request.transactionTotal)} spent
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                          request.approvalStatus === "Approved"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : request.approvalStatus === "Rejected"
                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                        }`}
                      >
                        {request.approvalStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {formatDate(request.requestedDate)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {request.approvalStatus === "Pending" && (
                          <>
                            <button
                              onClick={() => {
                                setApprovingRequest(request);
                                setApprovalAction("Approved");
                                setIsApprovalModalOpen(true);
                              }}
                              className="p-1.5 hover:bg-green-100 dark:hover:bg-green-900/30 rounded transition-colors"
                              title="Approve request"
                            >
                              <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                            </button>
                            <button
                              onClick={() => {
                                setApprovingRequest(request);
                                setApprovalAction("Rejected");
                                setIsApprovalModalOpen(true);
                              }}
                              className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                              title="Reject request"
                            >
                              <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                            </button>
                          </>
                        )}
                        {request.approvalStatus === "Approved" && (
                          <button
                            onClick={() => {
                              setTransactionRequest(request);
                              setTransactionDate(new Date().toISOString().split('T')[0]);
                              setTransactionAmount(request.remainingAmount.toString());
                              setTransactionVendorName(request.vendorName || "");
                              setIsAddTransactionOpen(true);
                            }}
                            className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
                            title="Add transaction"
                          >
                            <Receipt className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </button>
                        )}
                        {request.transactionCount === 0 && (
                          <button
                            onClick={() => handleDeleteRequest(request)}
                            className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                            title="Delete request"
                          >
                            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Request Dialog */}
      <Dialog open={isCreateRequestOpen} onOpenChange={setIsCreateRequestOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Purchase Request</DialogTitle>
            <DialogDescription>
              Submit a new purchase request for approval.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label htmlFor="new-request-line-item" className="block text-sm font-medium mb-2">
                Expense Line Item *
              </label>
              <select
                id="new-request-line-item"
                value={newRequestLineItemId}
                onChange={(e) => setNewRequestLineItemId(e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#61bc47] bg-background text-foreground"
              >
                <option value="">-- Select Line Item --</option>
                {budgetData?.expenseCategories.map((category) => (
                  <optgroup key={category.categoryId} label={category.name}>
                    {category.lineItems.map((item) => (
                      <option key={item.lineItemId} value={item.lineItemId}>
                        {item.name} ({formatCurrency(item.estimated)} budgeted)
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="new-request-amount" className="block text-sm font-medium mb-2">
                Amount *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <input
                  id="new-request-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={newRequestAmount}
                  onChange={(e) => setNewRequestAmount(e.target.value)}
                  className="w-full pl-7 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#61bc47] bg-background text-foreground"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <label htmlFor="new-request-vendor" className="block text-sm font-medium mb-2">
                Vendor (optional)
              </label>
              <input
                id="new-request-vendor"
                type="text"
                value={newRequestVendorName}
                onChange={(e) => setNewRequestVendorName(e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#61bc47] bg-background text-foreground"
                placeholder="e.g., Amazon, Home Depot"
              />
            </div>
            <div>
              <label htmlFor="new-request-description" className="block text-sm font-medium mb-2">
                Description (optional)
              </label>
              <textarea
                id="new-request-description"
                value={newRequestDescription}
                onChange={(e) => setNewRequestDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#61bc47] bg-background text-foreground resize-none"
                placeholder="Brief description of what you need to purchase"
              />
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => {
                setIsCreateRequestOpen(false);
                setNewRequestLineItemId("");
                setNewRequestAmount("");
                setNewRequestDescription("");
                setNewRequestVendorName("");
              }}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateRequest}
              disabled={!newRequestLineItemId || !newRequestAmount || isSavingRequest}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[#61bc47] hover:bg-[#52a03c] text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              Create Request
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approval Modal */}
      <Dialog open={isApprovalModalOpen} onOpenChange={setIsApprovalModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {approvalAction === "Approved" ? "Approve" : "Reject"} Purchase Request
            </DialogTitle>
            <DialogDescription>
              {approvalAction === "Approved"
                ? "Are you sure you want to approve this purchase request?"
                : "Please provide a reason for rejecting this purchase request."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {approvingRequest && (
              <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-semibold">{formatCurrency(approvingRequest.amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Line Item:</span>
                  <span className="font-medium">{approvingRequest.lineItemName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Requested by:</span>
                  <span>{approvingRequest.requestedByName}</span>
                </div>
              </div>
            )}
            {approvalAction === "Rejected" && (
              <div>
                <label htmlFor="rejection-reason" className="block text-sm font-medium mb-2">
                  Rejection Reason *
                </label>
                <textarea
                  id="rejection-reason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#61bc47] bg-background text-foreground resize-none"
                  placeholder="Explain why this request is being rejected"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <button
              onClick={() => {
                setIsApprovalModalOpen(false);
                setApprovingRequest(null);
                setApprovalAction(null);
                setRejectionReason("");
              }}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApprovalAction}
              disabled={isSavingApproval || (approvalAction === "Rejected" && !rejectionReason.trim())}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                approvalAction === "Approved"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {approvalAction === "Approved" ? (
                <><CheckCircle2 className="w-4 h-4" /> Approve</>
              ) : (
                <><XCircle className="w-4 h-4" /> Reject</>
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Transaction Dialog */}
      <Dialog open={isAddTransactionOpen} onOpenChange={setIsAddTransactionOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Transaction</DialogTitle>
            <DialogDescription>
              Record an expense transaction for this approved purchase request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {transactionRequest && (
              <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-4 space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Request ID:</span>
                  <span className="font-mono font-semibold text-purple-600 dark:text-purple-400">
                    {formatGuid(transactionRequest.requisitionGuid)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Line Item:</span>
                  <span className="font-medium">{transactionRequest.lineItemName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Approved Amount:</span>
                  <span className="font-semibold">{formatCurrency(transactionRequest.amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Already Spent:</span>
                  <span>{formatCurrency(transactionRequest.transactionTotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Remaining:</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    {formatCurrency(transactionRequest.remainingAmount)}
                  </span>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="transaction-date" className="block text-sm font-medium mb-2">
                  Transaction Date *
                </label>
                <input
                  id="transaction-date"
                  type="date"
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#61bc47] bg-background text-foreground"
                />
              </div>
              <div>
                <label htmlFor="transaction-amount" className="block text-sm font-medium mb-2">
                  Amount *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                  <input
                    id="transaction-amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={transactionAmount}
                    onChange={(e) => setTransactionAmount(e.target.value)}
                    className="w-full pl-7 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#61bc47] bg-background text-foreground"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
            <div>
              <label htmlFor="transaction-vendor" className="block text-sm font-medium mb-2">
                Vendor (optional)
              </label>
              <input
                id="transaction-vendor"
                type="text"
                value={transactionVendorName}
                onChange={(e) => setTransactionVendorName(e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#61bc47] bg-background text-foreground"
                placeholder="e.g., Amazon, Home Depot"
              />
            </div>
            <div>
              <label htmlFor="transaction-description" className="block text-sm font-medium mb-2">
                Description (optional)
              </label>
              <textarea
                id="transaction-description"
                value={transactionDescription}
                onChange={(e) => setTransactionDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#61bc47] bg-background text-foreground resize-none"
                placeholder="Brief description of this transaction"
              />
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => {
                setIsAddTransactionOpen(false);
                setTransactionRequest(null);
                setTransactionDate("");
                setTransactionAmount("");
                setTransactionDescription("");
                setTransactionVendorName("");
                setTransactionPaymentMethodId("");
              }}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddTransaction}
              disabled={!transactionDate || !transactionAmount || isSavingTransaction}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[#61bc47] hover:bg-[#52a03c] text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Receipt className="w-4 h-4" />
              Add Transaction
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
