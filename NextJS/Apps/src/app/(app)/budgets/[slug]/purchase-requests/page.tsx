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
  Copy,
  Check,
  AlertTriangle,
  ChevronDown,
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
import { useBudgetPermissions } from "@/hooks/useBudgetPermissions";

interface Transaction {
  transactionId: number;
  transactionDate: string;
  amount: number;
  description: string | null;
  vendorName: string | null;
  paymentMethod: string | null;
  paymentMethodId: number | null;
}

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
  transactions?: Transaction[]; // Optional - fetched separately for approved requests

  // Budget context fields (from stored proc)
  lineItemBudgeted: number;
  lineItemActualSpent: number;
  lineItemRemaining: number;
  approvedPurchaseRequestsTotal: number;
  projectedSpentAfterApproval: number;
  wouldBeOverBudget: boolean;
  overBudgetAmount: number;
}

interface QuickApprovalRequest {
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
  requestedByContactId: number;
  requestedByName: string;
  requestedByEmail: string;

  // Budget context
  lineItemBudgeted: number;
  lineItemActualSpent: number;
  lineItemRemaining: number;
  approvedPurchaseRequestsTotal: number;
  projectedSpentAfterApproval: number;
  wouldBeOverBudget: boolean;
  overBudgetAmount: number;
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

function formatCompactCurrency(amount: number) {
  const absAmount = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  if (absAmount >= 1000000) {
    // Millions: $12.3M
    return `${sign}$${(absAmount / 1000000).toFixed(1)}M`;
  } else if (absAmount >= 10000) {
    // Ten thousands and up: $120K
    return `${sign}$${Math.round(absAmount / 1000)}K`;
  } else {
    // Below 10k: show full amount
    return formatCurrency(amount);
  }
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
  const permissions = useBudgetPermissions();
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [quickApprovalRequests, setQuickApprovalRequests] = useState<QuickApprovalRequest[]>([]);
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
  const [transactionFiles, setTransactionFiles] = useState<File[]>([]);
  const [isSavingTransaction, setIsSavingTransaction] = useState(false);

  // Copy and status editing state
  const [copiedGuid, setCopiedGuid] = useState<string | null>(null);
  const [editingStatusId, setEditingStatusId] = useState<number | null>(null);

  // Transactions state - map of requestId to transactions array
  const [requestTransactions, setRequestTransactions] = useState<Record<number, Transaction[]>>({});

  // Edit Request modal state
  const [isEditRequestOpen, setIsEditRequestOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<PurchaseRequest | null>(null);
  const [editRequestLineItemId, setEditRequestLineItemId] = useState("");
  const [editRequestAmount, setEditRequestAmount] = useState("");
  const [editRequestDescription, setEditRequestDescription] = useState("");
  const [editRequestVendorName, setEditRequestVendorName] = useState("");
  const [isSavingEditRequest, setIsSavingEditRequest] = useState(false);

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

        // Fetch both regular requests and quick approval requests in parallel
        const [requestsResponse, quickApprovalResponse] = await Promise.all([
          fetch(`/api/projects/${projectData.Project_ID}/purchase-requests?filterByMe=${viewMode === "my-requests"}`),
          fetch(`/api/projects/${projectData.Project_ID}/purchase-requests/pending-approval`)
        ]);

        if (!requestsResponse.ok) {
          const errorData = await requestsResponse.json();
          throw new Error(errorData.error || "Failed to fetch purchase requests");
        }

        const requestsData = await requestsResponse.json();
        setRequests(requestsData);

        // Quick approval might fail if no pending requests, that's ok
        if (quickApprovalResponse.ok) {
          const quickApprovalData = await quickApprovalResponse.json();
          setQuickApprovalRequests(quickApprovalData.pendingRequests || []);
        } else {
          setQuickApprovalRequests([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [slug, viewMode]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (editingStatusId) {
        setEditingStatusId(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [editingStatusId]);

  // Fetch transactions for approved purchase requests
  useEffect(() => {
    requests.forEach((request) => {
      if (request.approvalStatus === "Approved" && request.transactionCount > 0 && !requestTransactions[request.purchaseRequestId]) {
        fetchTransactionsForRequest(request.purchaseRequestId);
      }
    });
  }, [requests, projectId]);

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

  async function fetchTransactionsForRequest(purchaseRequestId: number) {
    if (!projectId) return;

    try {
      const response = await fetch(
        `/api/projects/${projectId}/purchase-requests/${purchaseRequestId}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.transactions) {
          setRequestTransactions(prev => ({
            ...prev,
            [purchaseRequestId]: data.transactions
          }));
        }
      }
    } catch (err) {
      console.error("Error fetching transactions:", err);
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

  async function handleEditRequest() {
    if (!projectId || !editingRequest) return;

    const amount = parseFloat(editRequestAmount);

    if (!editRequestLineItemId || !amount) {
      alert("Line item and amount are required");
      return;
    }

    setIsEditRequestOpen(false);
    setIsSavingEditRequest(true);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/purchase-requests/${editingRequest.purchaseRequestId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            lineItemId: parseInt(editRequestLineItemId, 10),
            amount: amount,
            description: editRequestDescription.trim() || null,
            vendorName: editRequestVendorName.trim() || null,
            // If the request was approved, set it back to pending when edited
            ...(editingRequest.approvalStatus === "Approved" && {
              approvalStatus: "Pending",
              rejectionReason: null,
            }),
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
      setEditingRequest(null);
      setEditRequestLineItemId("");
      setEditRequestAmount("");
      setEditRequestDescription("");
      setEditRequestVendorName("");
    } catch (err) {
      console.error("Error updating purchase request:", err);
      alert(err instanceof Error ? err.message : "Failed to update purchase request");
    } finally {
      setIsSavingEditRequest(false);
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

    // Save files before closing modal
    const savedFiles = [...transactionFiles];

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

      const createdTransaction = await response.json();

      // Upload files if any were selected
      if (savedFiles.length > 0 && createdTransaction.transactionId) {
        try {
          const formData = new FormData();
          savedFiles.forEach((file) => {
            formData.append('files', file);
          });

          const uploadResponse = await fetch(`/api/projects/${projectId}/transactions/${createdTransaction.transactionId}/files`, {
            method: 'POST',
            body: formData,
          });

          if (!uploadResponse.ok) {
            console.error('Failed to upload files, but transaction was created');
          }
        } catch (uploadError) {
          console.error('Error uploading files:', uploadError);
        }
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
      setTransactionFiles([]);
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

  async function handleCopyGuid(guid: string) {
    try {
      await navigator.clipboard.writeText(guid);
      setCopiedGuid(guid);
      setTimeout(() => setCopiedGuid(null), 2000);
    } catch (err) {
      console.error("Failed to copy GUID:", err);
    }
  }

  async function handleStatusChange(request: PurchaseRequest, newStatus: "Pending" | "Approved" | "Rejected") {
    if (newStatus === request.approvalStatus) {
      setEditingStatusId(null);
      return;
    }

    if (newStatus === "Rejected") {
      // Open rejection modal
      setApprovingRequest(request);
      setApprovalAction("Rejected");
      setIsApprovalModalOpen(true);
      setEditingStatusId(null);
    } else if (newStatus === "Approved") {
      // Open approval modal
      setApprovingRequest(request);
      setApprovalAction("Approved");
      setIsApprovalModalOpen(true);
      setEditingStatusId(null);
    } else {
      // For Pending, directly update
      if (!projectId) return;

      try {
        const response = await fetch(
          `/api/projects/${projectId}/purchase-requests/${request.purchaseRequestId}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              approvalStatus: newStatus,
              rejectionReason: null,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to update purchase request");
        }

        await refetchRequests();
      } catch (err) {
        console.error("Error updating purchase request:", err);
        alert(err instanceof Error ? err.message : "Failed to update purchase request");
      } finally {
        setEditingStatusId(null);
      }
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
      <div className="mb-6 md:mb-8">
        <div className="flex justify-between items-center mb-4">
          <BackButton
            fallbackUrl={`/budgets/${slug}`}
            label="Back"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-[#61bc47] transition-colors"
          />

          {permissions.canManagePurchaseRequests && (
            <button
              onClick={() => {
                setIsCreateRequestOpen(true);
              }}
              className="inline-flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 bg-[#61bc47] hover:bg-[#52a03c] text-white rounded-lg transition-colors text-sm"
              title="Create new purchase request"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Request</span>
              <span className="sm:hidden">New</span>
            </button>
          )}
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary dark:text-foreground mb-2">
            purchase requests
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Expense approval requests for {projectTitle}
          </p>
        </div>
      </div>

      {/* Quick Approval Card - Only for users with approval permission */}
      {permissions.canApprovePurchaseRequests && quickApprovalRequests.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-4 md:p-6 mb-10 md:mb-12 relative">
          {/* Pin button in top right corner */}
          <div className="absolute top-4 right-4 z-10" data-no-navigate>
            <PinButton
              itemType="purchase-requests-approval"
              itemId={slug}
              itemData={{
                title: `${projectTitle} - Purchase Requests`,
                description: `Quick approval for ${quickApprovalRequests.length} pending request${quickApprovalRequests.length !== 1 ? 's' : ''}`,
              }}
              route={`/budgets/${slug}/purchase-requests`}
              isPinned={isPinned("purchase-requests-approval", slug)}
              onPin={pinItem}
              onUnpin={unpinItem}
              iconOnly={true}
            />
          </div>

          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-yellow-500" />
            <h2 className="text-lg md:text-xl font-semibold text-foreground">Quick Approval</h2>
            <span className="ml-2 px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-medium rounded-full">
              {quickApprovalRequests.length} pending
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
            {quickApprovalRequests.slice(0, 5).map((request) => (
              <Link
                key={request.purchaseRequestId}
                href={`/budgets/${slug}/purchase-requests/${request.purchaseRequestId}`}
                className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-4 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors sm:flex-1 sm:min-w-[280px] sm:max-w-md w-full relative block"
              >
                {/* GUID - Top right corner like a reference number */}
                <div className="absolute top-2 right-2 flex items-center gap-1 text-[9px] text-muted-foreground/40">
                  <span className="font-mono">
                    {request.requisitionGuid.toUpperCase()}
                  </span>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleCopyGuid(request.requisitionGuid);
                    }}
                    className="p-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition-colors opacity-60 hover:opacity-100"
                    title="Copy GUID"
                  >
                    {copiedGuid === request.requisitionGuid ? (
                      <Check className="w-2.5 h-2.5 text-green-600 dark:text-green-400" />
                    ) : (
                      <Copy className="w-2.5 h-2.5 text-muted-foreground" />
                    )}
                  </button>
                </div>

                <div className="flex flex-col gap-3 pt-4">
                  {/* Labels Row */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">
                      {request.lineItemName}
                    </div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">
                      Amount
                    </div>
                  </div>

                  {/* Main Row: Description and amount */}
                  <div className="flex items-start justify-between gap-4 -mt-2">
                    <h3 className="flex-1 text-xl font-bold text-foreground">
                      {request.description || 'Purchase Request'}
                    </h3>
                    <div className="text-xl font-bold text-foreground whitespace-nowrap flex-shrink-0">
                      {formatCompactCurrency(request.amount)}
                    </div>
                  </div>

                  {/* Date and Requester */}
                  <div className="flex flex-wrap gap-x-6 gap-y-3">
                    {/* Date */}
                    <div className="flex flex-col gap-0.5">
                      <div className="text-xs text-muted-foreground uppercase tracking-wide">
                        Date
                      </div>
                      <div className="text-sm text-foreground">
                        {formatDate(request.requestedDate)}
                      </div>
                    </div>

                    {/* Requester */}
                    <div className="flex flex-col gap-0.5">
                      <div className="text-xs text-muted-foreground uppercase tracking-wide">
                        Requested By
                      </div>
                      <div className="text-sm text-foreground">
                        {request.requestedByName}
                      </div>
                    </div>
                  </div>

                  {/* Budget Context */}
                  <div>
                    {/* Budget Bar Chart */}
                    <div className="mb-2">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium text-muted-foreground">
                          Budget Usage
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatCurrency(request.lineItemActualSpent)} / {formatCurrency(request.lineItemBudgeted)}
                        </span>
                      </div>
                      <div className="h-2 bg-zinc-300 dark:bg-zinc-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            request.wouldBeOverBudget
                              ? 'bg-red-500'
                              : request.lineItemActualSpent / request.lineItemBudgeted > 0.9
                              ? 'bg-yellow-500'
                              : 'bg-[#61bc47]'
                          }`}
                          style={{
                            width: `${Math.min(
                              (request.lineItemActualSpent / request.lineItemBudgeted) * 100,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Impact Preview */}
                    <div className="flex items-center justify-center gap-2">
                      {request.wouldBeOverBudget && (
                        <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                      )}
                      <p className={`text-xs ${
                        request.wouldBeOverBudget
                          ? 'text-red-600 dark:text-red-400 font-medium'
                          : 'text-muted-foreground'
                      }`}>
                        {request.wouldBeOverBudget ? (
                          <>
                            Approving will exceed budget by {formatCurrency(request.overBudgetAmount)}
                          </>
                        ) : (
                          <>
                            After approval: {formatCurrency(request.lineItemBudgeted - request.projectedSpentAfterApproval)} remaining
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        // Find the full request object from the regular requests array
                        const fullRequest = requests.find(r => r.purchaseRequestId === request.purchaseRequestId);
                        if (fullRequest) {
                          setApprovingRequest(fullRequest);
                          setApprovalAction("Approved");
                          setIsApprovalModalOpen(true);
                        }
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        // Find the full request object from the regular requests array
                        const fullRequest = requests.find(r => r.purchaseRequestId === request.purchaseRequestId);
                        if (fullRequest) {
                          setApprovingRequest(fullRequest);
                          setApprovalAction("Rejected");
                          setIsApprovalModalOpen(true);
                        }
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          {quickApprovalRequests.length > 5 && (
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                + {quickApprovalRequests.length - 5} more pending request{quickApprovalRequests.length - 5 !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>
      )}

      {/* View Toggle */}
      <div className="mb-6 md:mb-6">
        <button
          onClick={() => setViewMode(viewMode === "my-requests" ? "all-requests" : "my-requests")}
          className="relative w-full md:w-auto md:mx-auto flex rounded-xl bg-zinc-100 dark:bg-zinc-800 p-1 shadow-inner cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
        >
          {/* Sliding background indicator */}
          <div
            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-[#61BC47] rounded-lg shadow-md transition-all duration-300 ease-in-out pointer-events-none ${
              viewMode === "my-requests" ? "left-1" : "left-[calc(50%+2px)]"
            }`}
          />

          {/* Labels */}
          <div
            className={`relative z-10 flex-1 px-4 sm:px-8 py-2.5 rounded-lg font-medium transition-all duration-300 pointer-events-none text-center whitespace-nowrap ${
              viewMode === "my-requests"
                ? "text-white"
                : "text-muted-foreground"
            }`}
          >
            My Requests
          </div>
          <div
            className={`relative z-10 flex-1 px-4 sm:px-8 py-2.5 rounded-lg font-medium transition-all duration-300 pointer-events-none text-center whitespace-nowrap ${
              viewMode === "all-requests"
                ? "text-white"
                : "text-muted-foreground"
            }`}
          >
            All Requests
          </div>
        </button>
      </div>

      {/* Stats Cards - Carousel on mobile, grid on desktop */}
      <div className="mb-6 md:mb-8">
        {/* Mobile: Horizontal scroll carousel */}
        <div className="md:hidden overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4">
          <div className="flex gap-4 pb-2">
            {/* Pending Requests */}
            <div className="bg-card border border-border rounded-lg p-6 min-w-[85vw] snap-center">
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
            <div className="bg-card border border-border rounded-lg p-6 min-w-[85vw] snap-center">
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
            <div className="bg-card border border-border rounded-lg p-6 min-w-[85vw] snap-center">
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
        </div>

        {/* Desktop: Grid layout */}
        <div className="hidden md:grid md:grid-cols-3 gap-6">
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
                placeholder="Search by GUID, line item, vendor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-zinc-100 dark:bg-zinc-800 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#61bc47] text-foreground"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs md:text-sm font-medium text-muted-foreground mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 md:px-4 py-2 text-sm bg-zinc-100 dark:bg-zinc-800 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#61bc47] text-foreground"
            >
              <option value="all">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
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

      {/* Requests Cards */}
      <div className="space-y-6 md:space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-12 text-center">
            <p className="text-muted-foreground">No purchase requests found</p>
          </div>
        ) : (
          filteredRequests.map((request) => (
            <Link
              key={request.purchaseRequestId}
              href={`/budgets/${slug}/purchase-requests/${request.purchaseRequestId}`}
              prefetch={true}
              className="block bg-card border border-border rounded-lg p-4 md:p-6 hover:shadow-lg hover:border-[#61bc47]/30 transition-all relative"
            >
              {/* GUID - Top right corner */}
              <div className="absolute top-3 md:top-4 right-4 md:right-6 flex items-center gap-1 text-[8px] sm:text-[9px] text-muted-foreground/40">
                <span className="font-mono">
                  {request.requisitionGuid.toUpperCase()}
                </span>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleCopyGuid(request.requisitionGuid);
                  }}
                  className="p-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition-colors opacity-60 hover:opacity-100"
                  title="Copy GUID"
                >
                  {copiedGuid === request.requisitionGuid ? (
                    <Check className="w-2.5 h-2.5 text-green-600 dark:text-green-400" />
                  ) : (
                    <Copy className="w-2.5 h-2.5 text-muted-foreground" />
                  )}
                </button>
              </div>

              <div className="flex flex-col gap-3 md:gap-4 pt-3 md:pt-4">
                {/* Status Badge and Actions Row - AT TOP */}
                <div className="flex items-center justify-between gap-2">
                  {/* Status Badge - Left side with Dropdown (if user has permission) */}
                  <div className="relative">
                    {permissions.canApprovePurchaseRequests ? (
                      <>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setEditingStatusId(
                              editingStatusId === request.purchaseRequestId ? null : request.purchaseRequestId
                            );
                          }}
                          className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-bold rounded-md transition-colors ${
                            request.approvalStatus === "Pending"
                              ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-900/50"
                              : request.approvalStatus === "Approved"
                              ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50"
                              : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50"
                          }`}
                        >
                          {request.approvalStatus === "Pending" && (
                            <>
                              <Clock className="w-4 h-4" />
                              PENDING
                            </>
                          )}
                          {request.approvalStatus === "Approved" && (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              APPROVED
                            </>
                          )}
                          {request.approvalStatus === "Rejected" && (
                            <>
                              <XCircle className="w-4 h-4" />
                              REJECTED
                            </>
                          )}
                          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${
                            editingStatusId === request.purchaseRequestId ? "rotate-180" : ""
                          }`} />
                        </button>

                        {/* Dropdown Menu */}
                        {editingStatusId === request.purchaseRequestId && (
                          <div
                            className="absolute left-0 top-full mt-1 bg-white dark:bg-zinc-800 border border-border rounded-lg shadow-lg py-1 z-10 min-w-[140px]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setEditingStatusId(null);
                                setApprovingRequest(request);
                                setApprovalAction("Approved");
                                setIsApprovalModalOpen(true);
                              }}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-green-50 dark:hover:bg-green-900/20 flex items-center gap-2"
                            >
                              <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setEditingStatusId(null);
                                setApprovingRequest(request);
                                setApprovalAction("Rejected");
                                setIsApprovalModalOpen(true);
                              }}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                            >
                              <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                              <span>Reject</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleStatusChange(request, "Pending");
                              }}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-yellow-50 dark:hover:bg-yellow-900/20 flex items-center gap-2"
                            >
                              <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                              <span>Pending</span>
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      // Users without permission see non-clickable status badge
                      <div
                        className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-bold rounded-md ${
                          request.approvalStatus === "Pending"
                            ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300"
                            : request.approvalStatus === "Approved"
                            ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                            : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                        }`}
                      >
                        {request.approvalStatus === "Pending" && (
                          <>
                            <Clock className="w-4 h-4" />
                            PENDING
                          </>
                        )}
                        {request.approvalStatus === "Approved" && (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            APPROVED
                          </>
                        )}
                        {request.approvalStatus === "Rejected" && (
                          <>
                            <XCircle className="w-4 h-4" />
                            REJECTED
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Icons - Right side (Edit and Delete only) */}
                  <div className="flex items-center gap-1 -mr-2">
                    {/* Edit Button */}
                    {permissions.canManagePurchaseRequests && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setEditingRequest(request);
                          setEditRequestLineItemId(request.lineItemId.toString());
                          setEditRequestAmount(request.amount.toString());
                          setEditRequestDescription(request.description || "");
                          setEditRequestVendorName(request.vendorName || "");
                          setIsEditRequestOpen(true);
                        }}
                        className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition-colors"
                        title="Edit request"
                      >
                        <Edit className="w-5 h-5 text-muted-foreground" />
                      </button>
                    )}

                    {/* Delete Button */}
                    {request.transactionCount === 0 && permissions.canManagePurchaseRequests && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDeleteRequest(request);
                        }}
                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                        title="Delete request"
                      >
                        <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Labels Row */}
                <div className="flex items-center justify-between gap-4">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">
                    {request.lineItemName}
                  </div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">
                    Amount
                  </div>
                </div>

                {/* Main Row: Description and amount */}
                <div className="flex items-start justify-between gap-4 -mt-2">
                  <h3 className="flex-1 text-xl font-bold text-foreground">
                    {request.description || request.lineItemName}
                  </h3>
                  <div className="text-xl font-bold text-foreground whitespace-nowrap flex-shrink-0">
                    {formatCompactCurrency(request.amount)}
                  </div>
                </div>

                {/* Date and Requester */}
                <div className="flex flex-wrap gap-x-6 gap-y-2 -mt-1">
                  {/* Date */}
                  <div className="flex flex-col gap-0.5">
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">
                      Date
                    </div>
                    <div className="text-sm text-foreground">
                      {formatDate(request.requestedDate)}
                    </div>
                  </div>

                  {/* Requester */}
                  <div className="flex flex-col gap-0.5">
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">
                      Requested By
                    </div>
                    <div className="text-sm text-foreground">
                      {request.requestedByName}
                    </div>
                  </div>

                  {/* Vendor if exists */}
                  {request.vendorName && (
                    <div className="flex flex-col gap-0.5">
                      <div className="text-xs text-muted-foreground uppercase tracking-wide">
                        Vendor
                      </div>
                      <div className="text-sm text-foreground">
                        {request.vendorName}
                      </div>
                    </div>
                  )}
                </div>

                {/* Budget/Transaction Progress */}
                {(() => {
                  if (request.approvalStatus === "Approved" && request.transactionCount > 0) {
                    // Show transaction progress for approved requests with transactions
                    return (
                      <div className="-mt-1">
                        <div className="mb-1.5">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-muted-foreground">
                              Transaction Progress
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatCurrency(request.transactionTotal)} / {formatCurrency(request.amount)}
                            </span>
                          </div>
                          <div className="h-2 bg-zinc-300 dark:bg-zinc-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                request.transactionTotal > request.amount
                                  ? 'bg-red-500'
                                  : request.transactionTotal / request.amount > 0.9
                                  ? 'bg-yellow-500'
                                  : 'bg-[#61bc47]'
                              }`}
                              style={{
                                width: `${Math.min(
                                  (request.transactionTotal / request.amount) * 100,
                                  100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-center">
                          <p className={`text-xs ${
                            (request.remainingAmount ?? (request.amount - request.transactionTotal)) < 0
                              ? 'text-red-600 dark:text-red-400 font-medium'
                              : (request.remainingAmount ?? (request.amount - request.transactionTotal)) === 0
                              ? 'text-green-600 dark:text-green-400 font-medium'
                              : 'text-muted-foreground'
                          }`}>
                            {(() => {
                              const remaining = request.remainingAmount ?? (request.amount - request.transactionTotal);
                              if (remaining < 0) {
                                return (
                                  <>
                                    Over budget by {formatCurrency(Math.abs(remaining))} • {request.transactionCount} {request.transactionCount === 1 ? 'transaction' : 'transactions'}
                                  </>
                                );
                              } else if (remaining === 0) {
                                return (
                                  <>
                                    Fully spent • {request.transactionCount} {request.transactionCount === 1 ? 'transaction' : 'transactions'}
                                  </>
                                );
                              } else {
                                return (
                                  <>
                                    {formatCurrency(remaining)} remaining • {request.transactionCount} {request.transactionCount === 1 ? 'transaction' : 'transactions'}
                                  </>
                                );
                              }
                            })()}
                          </p>
                        </div>
                      </div>
                    );
                  } else if (request.approvalStatus === "Rejected" && request.rejectionReason) {
                    // Show rejection reason for rejected requests
                    return (
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 -mt-1">
                        <div className="flex items-start gap-2">
                          <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-medium text-red-900 dark:text-red-200 mb-1">
                              Rejection Reason
                            </p>
                            <p className="text-xs text-red-800 dark:text-red-300">
                              {request.rejectionReason}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  } else if (request.approvalStatus === "Pending" && request.lineItemBudgeted) {
                    // Show line item budget usage for pending requests using stored proc data
                    const budgetUsagePercent = (request.lineItemActualSpent / request.lineItemBudgeted) * 100;

                    return (
                      <div className="-mt-1">
                        {/* Budget Bar Chart */}
                        <div className="mb-1.5">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-muted-foreground">
                              Budget Usage
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatCurrency(request.lineItemActualSpent)} / {formatCurrency(request.lineItemBudgeted)}
                            </span>
                          </div>
                          <div className="h-2 bg-zinc-300 dark:bg-zinc-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                request.wouldBeOverBudget
                                  ? 'bg-red-500'
                                  : budgetUsagePercent > 90
                                  ? 'bg-yellow-500'
                                  : 'bg-[#61bc47]'
                              }`}
                              style={{
                                width: `${Math.min(budgetUsagePercent, 100)}%`,
                              }}
                            />
                          </div>
                        </div>

                        {/* Impact Preview */}
                        <div className="flex items-center justify-center">
                          {request.wouldBeOverBudget && (
                            <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mr-1.5" />
                          )}
                          <p className={`text-xs ${
                            request.wouldBeOverBudget
                              ? 'text-red-600 dark:text-red-400 font-medium'
                              : 'text-muted-foreground'
                          }`}>
                            {request.wouldBeOverBudget ? (
                              <>
                                Approving will exceed budget by {formatCurrency(request.overBudgetAmount)}
                              </>
                            ) : (
                              <>
                                After approval: {formatCurrency(request.lineItemBudgeted - request.projectedSpentAfterApproval)} remaining
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              {/* Transaction List and Add Button (for approved requests) */}
              {request.approvalStatus === "Approved" && (
                <>
                  {/* Transaction List */}
                  {requestTransactions[request.purchaseRequestId] && requestTransactions[request.purchaseRequestId].length > 0 && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Transactions ({requestTransactions[request.purchaseRequestId].length})
                        </h4>
                        {requestTransactions[request.purchaseRequestId].length > 3 && (
                          <span className="text-xs font-medium text-[#61bc47] hover:text-[#52a03c] transition-colors cursor-pointer">
                            View All
                          </span>
                        )}
                      </div>
                      <div className="space-y-2">
                        {requestTransactions[request.purchaseRequestId].slice(0, 3).map((transaction) => (
                          <Link
                            key={transaction.transactionId}
                            href={`/budgets/${slug}/transactions/${transaction.transactionId}`}
                            className="flex items-center justify-between px-4 py-2.5 bg-zinc-100/50 dark:bg-zinc-800/30 hover:bg-zinc-100 dark:hover:bg-zinc-700/50 rounded-lg transition-colors border border-zinc-200/50 dark:border-zinc-700/50 hover:border-[#61bc47]/30 group"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="text-sm font-bold text-foreground whitespace-nowrap">
                                {formatCurrency(transaction.amount)}
                              </span>
                              <span className="text-sm text-muted-foreground">•</span>
                              <span className="text-sm text-muted-foreground whitespace-nowrap">
                                {formatDate(transaction.transactionDate)}
                              </span>
                              {(transaction.description || transaction.vendorName) && (
                                <>
                                  <span className="text-sm text-muted-foreground">•</span>
                                  <span className="text-sm text-foreground truncate">
                                    {transaction.description || transaction.vendorName}
                                  </span>
                                </>
                              )}
                            </div>
                            <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-[#61bc47] rotate-[-90deg] flex-shrink-0 ml-2 transition-colors" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add Transaction Button */}
                  {permissions.canManageTransactions && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setTransactionRequest(request);
                        setTransactionDate(new Date().toISOString().split('T')[0]);
                        setTransactionAmount((request.remainingAmount ?? (request.amount - request.transactionTotal)).toString());
                        setTransactionVendorName(request.vendorName || "");
                        setIsAddTransactionOpen(true);
                      }}
                      className="w-full mt-4 py-3 border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-[#61bc47] dark:hover:border-[#61bc47] rounded-lg text-muted-foreground hover:text-[#61bc47] transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      ADD TRANSACTION
                    </button>
                  )}
                </>
              )}
            </Link>
          ))
        )}
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
                    {category.lineItems?.map((item) => (
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

      {/* Edit Request Dialog */}
      <Dialog open={isEditRequestOpen} onOpenChange={setIsEditRequestOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Purchase Request</DialogTitle>
            <DialogDescription>
              Update the details for this purchase request.
              {editingRequest?.approvalStatus === "Approved" && (
                <span className="block mt-2 text-yellow-600 dark:text-yellow-400 font-medium">
                  Note: Editing an approved request will reset its status to Pending.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label htmlFor="edit-request-line-item" className="block text-sm font-medium mb-2">
                Expense Line Item *
              </label>
              <select
                id="edit-request-line-item"
                value={editRequestLineItemId}
                onChange={(e) => setEditRequestLineItemId(e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#61bc47] bg-background text-foreground"
              >
                <option value="">-- Select Line Item --</option>
                {budgetData?.expenseCategories.map((category) => (
                  <optgroup key={category.categoryId} label={category.name}>
                    {category.lineItems?.map((item) => (
                      <option key={item.lineItemId} value={item.lineItemId}>
                        {item.name} ({formatCurrency(item.estimated)} budgeted)
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="edit-request-amount" className="block text-sm font-medium mb-2">
                Amount *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <input
                  id="edit-request-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={editRequestAmount}
                  onChange={(e) => setEditRequestAmount(e.target.value)}
                  className="w-full pl-7 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#61bc47] bg-background text-foreground"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <label htmlFor="edit-request-vendor" className="block text-sm font-medium mb-2">
                Vendor (optional)
              </label>
              <input
                id="edit-request-vendor"
                type="text"
                value={editRequestVendorName}
                onChange={(e) => setEditRequestVendorName(e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#61bc47] bg-background text-foreground"
                placeholder="e.g., Amazon, Home Depot"
              />
            </div>
            <div>
              <label htmlFor="edit-request-description" className="block text-sm font-medium mb-2">
                Description (optional)
              </label>
              <textarea
                id="edit-request-description"
                value={editRequestDescription}
                onChange={(e) => setEditRequestDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#61bc47] bg-background text-foreground resize-none"
                placeholder="Brief description of what you need to purchase"
              />
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => {
                setIsEditRequestOpen(false);
                setEditingRequest(null);
                setEditRequestLineItemId("");
                setEditRequestAmount("");
                setEditRequestDescription("");
                setEditRequestVendorName("");
              }}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleEditRequest}
              disabled={!editRequestLineItemId || !editRequestAmount || isSavingEditRequest}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[#61bc47] hover:bg-[#52a03c] text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Changes
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

            {/* File Attachments */}
            <div>
              <label htmlFor="transaction-files" className="block text-sm font-medium mb-2">
                Attach Files <span className="text-xs text-muted-foreground">(optional)</span>
              </label>
              <input
                id="transaction-files"
                type="file"
                multiple
                onChange={(e) => setTransactionFiles(Array.from(e.target.files || []))}
                className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-[#61bc47] file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#61bc47] file:text-white hover:file:bg-[#52a038]"
              />
              {transactionFiles.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {transactionFiles.length} file{transactionFiles.length > 1 ? 's' : ''} selected
                </p>
              )}
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
                setTransactionFiles([]);
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
