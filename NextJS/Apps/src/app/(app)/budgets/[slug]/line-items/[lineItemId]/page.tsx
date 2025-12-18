"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  Plus,
  Trash2,
  Edit,
  ShoppingCart,
} from "lucide-react";
import { FileAttachments } from "@/components/FileAttachments";
import { BackButton } from "@/components/BackButton";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface LineItemDetails {
  lineItemId: number;
  lineItemName: string;
  lineItemDescription: string | null;
  vendorName: string | null;
  estimatedAmount: number;
  actualAmount: number;
  variance: number;
  categoryId: number;
  categoryName: string;
  categoryType: "expense" | "revenue";
  projectId: number;
  projectName: string;
  projectSlug: string;
  purchaseRequests: PurchaseRequest[];
  purchaseRequestCount: number;
  pendingRequestCount: number;
  approvedRequestCount: number;
  transactions: Transaction[];
  transactionCount: number;
  files: FileAttachment[];
}

interface PurchaseRequest {
  id: number;
  amount: number;
  description: string;
  vendorName: string;
  approvalStatus: "Pending" | "Approved" | "Rejected";
  requestedDate: string;
  approvedDate: string | null;
  transactionCount: number;
  transactionTotal: number;
  remainingAmount: number;
}

interface Transaction {
  id: number;
  amount: number;
  description: string;
  transactionDate: string;
  paymentMethod: string;
}

interface FileAttachment {
  FileId: number;
  FileName: string;
  FileSize: number;
  FileExtension: string;
  ImageWidth: number | null;
  ImageHeight: number | null;
  UniqueFileId: string;
  Description: string | null;
  LastUpdated: string;
  publicUrl: string;
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

export default function LineItemDetailsPage({
  params,
}: {
  params: Promise<{ slug: string; lineItemId: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [lineItem, setLineItem] = useState<LineItemDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    lineItemName: "",
    lineItemDescription: "",
    vendorName: "",
    estimatedAmount: "",
  });

  // Create Purchase Request modal state
  const [isCreatePurchaseRequestOpen, setIsCreatePurchaseRequestOpen] = useState(false);
  const [createPRAmount, setCreatePRAmount] = useState<string>("");
  const [createPRDescription, setCreatePRDescription] = useState<string>("");
  const [createPRVendorName, setCreatePRVendorName] = useState<string>("");
  const [isSavingPurchaseRequest, setIsSavingPurchaseRequest] = useState(false);

  // Edit Purchase Request modal state
  const [isEditPurchaseRequestOpen, setIsEditPurchaseRequestOpen] = useState(false);
  const [editingPurchaseRequest, setEditingPurchaseRequest] = useState<PurchaseRequest | null>(null);
  const [editPRAmount, setEditPRAmount] = useState<string>("");
  const [editPRDescription, setEditPRDescription] = useState<string>("");
  const [editPRVendorName, setEditPRVendorName] = useState<string>("");

  // Add Transaction modal state
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [transactionPurchaseRequest, setTransactionPurchaseRequest] = useState<PurchaseRequest | null>(null);
  const [transactionAmount, setTransactionAmount] = useState<string>("");
  const [transactionDescription, setTransactionDescription] = useState<string>("");
  const [transactionDate, setTransactionDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [transactionPaymentMethod, setTransactionPaymentMethod] = useState<string>("");

  // Status dropdown state
  const [statusDropdownOpen, setStatusDropdownOpen] = useState<number | null>(null);

  useEffect(() => {
    fetchLineItemDetails();
  }, [resolvedParams.lineItemId]);

  const fetchLineItemDetails = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/line-items/${resolvedParams.lineItemId}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch line item details");
      }

      const data = await response.json();
      setLineItem(data);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const openEditDialog = () => {
    if (!lineItem) return;
    setEditForm({
      lineItemName: lineItem.lineItemName,
      lineItemDescription: lineItem.lineItemDescription || "",
      vendorName: lineItem.vendorName || "",
      estimatedAmount: lineItem.estimatedAmount.toString(),
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!lineItem) return;

    // Save form data and previous state before closing modal
    const savedFormData = {
      Line_Item_Name: editForm.lineItemName,
      Line_Item_Description: editForm.lineItemDescription || null,
      Vendor_Name: editForm.vendorName || null,
      Estimated_Amount: parseFloat(editForm.estimatedAmount),
    };

    const previousLineItem = { ...lineItem };

    // Close modal immediately
    setIsEditDialogOpen(false);

    // Update UI optimistically
    setLineItem({
      ...lineItem,
      lineItemName: editForm.lineItemName,
      lineItemDescription: editForm.lineItemDescription || null,
      vendorName: editForm.vendorName || null,
      estimatedAmount: parseFloat(editForm.estimatedAmount),
      variance: lineItem.actualAmount - parseFloat(editForm.estimatedAmount),
    });

    // Show processing toast
    const toastId = toast.loading("Saving changes...");

    // Make API call in background
    try {
      const response = await fetch(`/api/line-items/${lineItem.lineItemId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(savedFormData),
      });

      if (!response.ok) {
        throw new Error("Failed to update line item");
      }

      // Show success toast
      toast.success("Changes saved successfully", { id: toastId });

      // Refresh data from server to ensure consistency
      await fetchLineItemDetails();
    } catch (err) {
      console.error("Error updating line item:", err);

      // Revert optimistic update
      setLineItem(previousLineItem);

      // Show error toast
      toast.error("Failed to save changes. Please try again.", { id: toastId });
    }
  };

  const handleDelete = async () => {
    if (!lineItem) return;

    if (!confirm(`Are you sure you want to delete "${lineItem.lineItemName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/line-items/${lineItem.lineItemId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete line item");
      }

      // Navigate back to budget page
      router.push(`/budgets/${resolvedParams.slug}`);
    } catch (err) {
      console.error("Error deleting line item:", err);
      alert("Failed to delete line item. Please try again.");
    }
  };

  async function handleCreatePurchaseRequest() {
    if (!lineItem) return;

    const amount = parseFloat(createPRAmount) || 0;

    if (amount <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }

    // Save form data before closing modal
    const savedFormData = {
      amount,
      description: createPRDescription.trim() || "",
      vendorName: createPRVendorName.trim() || "",
    };

    // Close modal immediately
    setIsCreatePurchaseRequestOpen(false);

    // Reset form
    setCreatePRAmount("");
    setCreatePRDescription("");
    setCreatePRVendorName("");

    // Create temporary optimistic purchase request
    const tempId = Date.now();
    const tempPurchaseRequest: PurchaseRequest = {
      id: tempId,
      amount: savedFormData.amount,
      description: savedFormData.description || "New Purchase Request",
      vendorName: savedFormData.vendorName || lineItem.vendorName || "TBD",
      approvalStatus: "Pending",
      requestedDate: new Date().toISOString(),
      approvedDate: null,
      transactionCount: 0,
      transactionTotal: 0,
      remainingAmount: savedFormData.amount,
    };

    // Store previous state for rollback
    const previousLineItem = { ...lineItem };

    // Update UI optimistically
    setLineItem({
      ...lineItem,
      purchaseRequests: [tempPurchaseRequest, ...lineItem.purchaseRequests],
      purchaseRequestCount: lineItem.purchaseRequestCount + 1,
      pendingRequestCount: lineItem.pendingRequestCount + 1,
    });

    const toastId = toast.loading("Creating purchase request...");

    try {
      const response = await fetch(`/api/projects/${lineItem.projectId}/purchase-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lineItemId: lineItem.lineItemId,
          amount: savedFormData.amount,
          description: savedFormData.description || null,
          vendorName: savedFormData.vendorName || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create purchase request");
      }

      // Refresh line item details to get real data from server
      await fetchLineItemDetails();

      toast.success("Purchase request created successfully", { id: toastId });
    } catch (error) {
      console.error("Error creating purchase request:", error);

      // Revert optimistic update on error
      setLineItem(previousLineItem);

      toast.error(error instanceof Error ? error.message : "Failed to create purchase request", { id: toastId });
    }
  }

  async function handleEditPurchaseRequest() {
    if (!lineItem || !editingPurchaseRequest) return;

    const amount = parseFloat(editPRAmount) || 0;

    if (amount <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }

    // Save form data before closing modal
    const savedFormData = {
      amount,
      description: editPRDescription.trim() || "",
      vendorName: editPRVendorName.trim() || "",
    };

    // Close modal immediately
    setIsEditPurchaseRequestOpen(false);

    // Reset form
    setEditPRAmount("");
    setEditPRDescription("");
    setEditPRVendorName("");
    setEditingPurchaseRequest(null);

    // Store previous state for rollback
    const previousLineItem = { ...lineItem };

    // Update UI optimistically
    setLineItem({
      ...lineItem,
      purchaseRequests: lineItem.purchaseRequests.map(pr =>
        pr.id === editingPurchaseRequest.id
          ? {
              ...pr,
              amount: savedFormData.amount,
              description: savedFormData.description,
              vendorName: savedFormData.vendorName,
              remainingAmount: savedFormData.amount - pr.transactionTotal,
            }
          : pr
      ),
    });

    const toastId = toast.loading("Updating purchase request...");

    try {
      const response = await fetch(`/api/purchase-requests/${editingPurchaseRequest.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          Amount: savedFormData.amount,
          Description: savedFormData.description || null,
          Vendor_Name: savedFormData.vendorName || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update purchase request");
      }

      // Refresh line item details to get real data from server
      await fetchLineItemDetails();

      toast.success("Purchase request updated successfully", { id: toastId });
    } catch (error) {
      console.error("Error updating purchase request:", error);

      // Revert optimistic update on error
      setLineItem(previousLineItem);

      toast.error(error instanceof Error ? error.message : "Failed to update purchase request", { id: toastId });
    }
  }

  async function handleAddTransaction() {
    if (!lineItem || !transactionPurchaseRequest) return;

    const amount = parseFloat(transactionAmount) || 0;

    if (amount <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }

    if (!transactionPaymentMethod.trim()) {
      toast.error("Payment method is required");
      return;
    }

    // Save form data before closing modal
    const savedFormData = {
      amount,
      description: transactionDescription.trim() || "",
      transactionDate,
      paymentMethod: transactionPaymentMethod.trim(),
    };

    // Close modal immediately
    setIsAddTransactionOpen(false);

    // Reset form
    setTransactionAmount("");
    setTransactionDescription("");
    setTransactionDate(new Date().toISOString().split('T')[0]);
    setTransactionPaymentMethod("");
    setTransactionPurchaseRequest(null);

    // Store previous state for rollback
    const previousLineItem = { ...lineItem };

    // Update UI optimistically - update purchase request transaction count and totals
    setLineItem({
      ...lineItem,
      actualAmount: lineItem.actualAmount + savedFormData.amount,
      variance: lineItem.estimatedAmount - (lineItem.actualAmount + savedFormData.amount),
      purchaseRequests: lineItem.purchaseRequests.map(pr =>
        pr.id === transactionPurchaseRequest.id
          ? {
              ...pr,
              transactionCount: pr.transactionCount + 1,
              transactionTotal: pr.transactionTotal + savedFormData.amount,
              remainingAmount: pr.amount - (pr.transactionTotal + savedFormData.amount),
            }
          : pr
      ),
    });

    const toastId = toast.loading("Adding transaction...");

    try {
      const response = await fetch(`/api/purchase-requests/${transactionPurchaseRequest.id}/transactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: savedFormData.amount,
          description: savedFormData.description || null,
          transactionDate: savedFormData.transactionDate,
          paymentMethod: savedFormData.paymentMethod,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add transaction");
      }

      // Refresh line item details to get real data from server
      await fetchLineItemDetails();

      toast.success("Transaction added successfully", { id: toastId });
    } catch (error) {
      console.error("Error adding transaction:", error);

      // Revert optimistic update on error
      setLineItem(previousLineItem);

      toast.error(error instanceof Error ? error.message : "Failed to add transaction", { id: toastId });
    }
  }

  async function handleStatusChange(purchaseRequest: PurchaseRequest, newStatus: "Pending" | "Approved" | "Rejected") {
    if (!lineItem) return;

    // Close dropdown immediately
    setStatusDropdownOpen(null);

    // Store previous state for rollback
    const previousLineItem = { ...lineItem };

    // Update UI optimistically
    setLineItem({
      ...lineItem,
      purchaseRequests: lineItem.purchaseRequests.map(pr =>
        pr.id === purchaseRequest.id
          ? {
              ...pr,
              approvalStatus: newStatus,
              approvedDate: newStatus === "Approved" ? new Date().toISOString() : null,
            }
          : pr
      ),
      pendingRequestCount: newStatus === "Pending"
        ? lineItem.pendingRequestCount + (purchaseRequest.approvalStatus !== "Pending" ? 1 : 0)
        : lineItem.pendingRequestCount - (purchaseRequest.approvalStatus === "Pending" ? 1 : 0),
      approvedRequestCount: newStatus === "Approved"
        ? lineItem.approvedRequestCount + (purchaseRequest.approvalStatus !== "Approved" ? 1 : 0)
        : lineItem.approvedRequestCount - (purchaseRequest.approvalStatus === "Approved" ? 1 : 0),
    });

    const toastId = toast.loading("Updating status...");

    try {
      const response = await fetch(`/api/purchase-requests/${purchaseRequest.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          Approval_Status: newStatus,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update status");
      }

      // Refresh line item details to get real data from server
      await fetchLineItemDetails();

      toast.success(`Purchase request ${newStatus.toLowerCase()}`, { id: toastId });
    } catch (error) {
      console.error("Error updating status:", error);

      // Revert optimistic update on error
      setLineItem(previousLineItem);

      toast.error(error instanceof Error ? error.message : "Failed to update status", { id: toastId });
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 max-w-[1600px]">
        <Skeleton className="h-10 w-64 mb-6" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !lineItem) {
    const isNotFound = error?.includes("not found") || error?.includes("404");
    return (
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 max-w-[1600px]">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-8 text-center">
          <h3 className="text-xl font-semibold text-red-900 dark:text-red-200 mb-2">
            {isNotFound ? "Line Item Not Found" : "Error Loading Line Item"}
          </h3>
          <p className="text-red-700 dark:text-red-300 mb-4">
            {isNotFound
              ? "This line item may have been deleted or does not exist."
              : error || "An error occurred while loading the line item."}
          </p>
          <Button
            onClick={() => router.push(`/budgets/${resolvedParams.slug}`)}
            variant="outline"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const isExpense = lineItem.categoryType === "expense";
  const isIncome = lineItem.categoryType === "revenue";

  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 max-w-[1600px]">
      {/* Header */}
      <div className="mb-6">
        <BackButton
          fallbackUrl={`/budgets/${resolvedParams.slug}`}
          label="Back"
        />

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {lineItem.lineItemName}
            </h1>
            <p className="text-muted-foreground mt-2">
              {lineItem.categoryName} •{" "}
              {isExpense ? "Expense" : "Income"} Line Item
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={openEditDialog}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button variant="outline" size="sm" onClick={handleDelete}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Budget Summary */}
      <Card className="p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <div className="text-sm text-muted-foreground mb-1">
              {isIncome ? "Received" : "Spent"}
            </div>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(lineItem.actualAmount)}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">
              {isIncome ? "Expected" : "Budgeted"}
            </div>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(lineItem.estimatedAmount)}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">Remaining</div>
            <div
              className={`text-2xl font-bold ${
                -lineItem.variance >= 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {formatCurrency(-lineItem.variance)}
            </div>
          </div>
          {lineItem.vendorName && (
            <div>
              <div className="text-sm text-muted-foreground mb-1">Vendor</div>
              <div className="text-xl font-semibold text-foreground">
                {lineItem.vendorName}
              </div>
            </div>
          )}
        </div>
        {lineItem.lineItemDescription && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="text-sm text-muted-foreground mb-1">Description</div>
            <p className="text-foreground">{lineItem.lineItemDescription}</p>
          </div>
        )}
      </Card>

      {/* Files Section */}
      <div className="mb-6">
        <FileAttachments
          files={lineItem.files || []}
          uploadEndpoint={`/api/projects/${lineItem.projectId}/line-items/${lineItem.lineItemId}/files`}
          onFilesUploaded={fetchLineItemDetails}
        />
      </div>

      {/* Expense Line Item - Purchase Requests */}
      {isExpense && (
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">
              Purchase Requests
            </h2>
            <Button
              size="sm"
              onClick={() => {
                setCreatePRAmount(lineItem.estimatedAmount.toString());
                setCreatePRVendorName(lineItem.vendorName || "");
                setIsCreatePurchaseRequestOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Request
            </Button>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            Expense line items require purchase request approval before
            transactions can be created.
          </p>

          {lineItem.purchaseRequestCount > 0 ? (
            <div className="space-y-2">
              {lineItem.purchaseRequests.map((request) => (
                <div
                  key={request.id}
                  className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() =>
                    router.push(
                      `/budgets/${resolvedParams.slug}/purchase-requests/${request.id}`
                    )
                  }
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-foreground">
                        {formatCurrency(request.amount)} - {request.vendorName}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {request.description}
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted/50">
                          <DollarSign className="w-3 h-3" />
                          {request.transactionCount} {request.transactionCount === 1 ? 'transaction' : 'transactions'}
                        </span>
                        <span className={`font-medium ${
                          request.remainingAmount < 0
                            ? 'text-red-600 dark:text-red-400'
                            : request.remainingAmount === 0
                            ? 'text-muted-foreground'
                            : 'text-green-600 dark:text-green-400'
                        }`}>
                          {formatCurrency(Math.abs(request.remainingAmount))} {request.remainingAmount < 0 ? 'over budget' : 'remaining'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Action Icons */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (request.approvalStatus === "Approved") {
                              setTransactionPurchaseRequest(request);
                              setTransactionAmount(request.remainingAmount.toString());
                              setTransactionDescription("");
                              setTransactionDate(new Date().toISOString().split('T')[0]);
                              setTransactionPaymentMethod("");
                              setIsAddTransactionOpen(true);
                            }
                          }}
                          disabled={request.approvalStatus !== "Approved"}
                          className={`p-1.5 rounded-md transition-colors ${
                            request.approvalStatus === "Approved"
                              ? "hover:bg-green-100 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400"
                              : "text-muted-foreground/30 cursor-not-allowed"
                          }`}
                          title={
                            request.approvalStatus === "Approved"
                              ? "Add Transaction"
                              : "Only available for approved requests"
                          }
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingPurchaseRequest(request);
                            setEditPRAmount(request.amount.toString());
                            setEditPRDescription(request.description);
                            setEditPRVendorName(request.vendorName);
                            setIsEditPurchaseRequestOpen(true);
                          }}
                          className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-muted-foreground hover:text-foreground transition-colors"
                          title="Edit Purchase Request"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (confirm("Are you sure you want to delete this purchase request? This action cannot be undone.")) {
                              try {
                                const response = await fetch(`/api/purchase-requests/${request.id}`, {
                                  method: "DELETE",
                                });

                                if (!response.ok) {
                                  throw new Error("Failed to delete purchase request");
                                }

                                // Refresh line item details
                                await fetchLineItemDetails();
                              } catch (err) {
                                console.error("Error deleting purchase request:", err);
                                alert("Failed to delete purchase request. Please try again.");
                              }
                            }
                          }}
                          className="p-1.5 rounded-md hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
                          title="Delete Purchase Request"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Approval Status Icon with Dropdown */}
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setStatusDropdownOpen(statusDropdownOpen === request.id ? null : request.id);
                          }}
                          className={`p-2 rounded-md transition-colors ${
                            request.approvalStatus === "Approved"
                              ? "bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50"
                              : request.approvalStatus === "Rejected"
                              ? "bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50"
                              : "bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:hover:bg-yellow-900/50"
                          }`}
                          title={`Status: ${request.approvalStatus}`}
                        >
                          {request.approvalStatus === "Approved" && (
                            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                          )}
                          {request.approvalStatus === "Rejected" && (
                            <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                          )}
                          {request.approvalStatus === "Pending" && (
                            <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                          )}
                        </button>

                        {/* Status Dropdown */}
                        {statusDropdownOpen === request.id && (
                          <div
                            className="absolute right-0 top-full mt-1 w-48 bg-background border border-border rounded-lg shadow-lg z-50"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => handleStatusChange(request, "Approved")}
                              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted transition-colors text-left"
                            >
                              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                              <span className="text-sm font-medium text-foreground">APPROVE</span>
                            </button>
                            <button
                              onClick={() => handleStatusChange(request, "Rejected")}
                              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted transition-colors text-left"
                            >
                              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                              <span className="text-sm font-medium text-foreground">REJECT</span>
                            </button>
                            <button
                              onClick={() => handleStatusChange(request, "Pending")}
                              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted transition-colors text-left"
                            >
                              <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                              <span className="text-sm font-medium text-foreground">PENDING</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No purchase requests yet. Create one to request spending approval.
            </div>
          )}
        </Card>
      )}

      {/* Income Line Item - Direct Transactions */}
      {isIncome && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">
              Transactions
            </h2>
            <Button
              size="sm"
              onClick={() =>
                router.push(
                  `/budgets/${resolvedParams.slug}/transactions?lineItemId=${lineItem.lineItemId}&type=Income`
                )
              }
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Transaction
            </Button>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            Income line items can have transactions added directly without
            purchase request approval.
          </p>

          {lineItem.transactionCount > 0 ? (
            <div className="space-y-2">
              {lineItem.transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() =>
                    router.push(
                      `/budgets/${resolvedParams.slug}/transactions/${transaction.id}`
                    )
                  }
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-foreground">
                        {formatCurrency(transaction.amount)}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {transaction.description} •{" "}
                        {formatDate(transaction.transactionDate)} •{" "}
                        {transaction.paymentMethod}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No transactions yet. Add income transactions as they are received.
            </div>
          )}
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Edit Line Item</DialogTitle>
            <DialogDescription>
              Make changes to the line item details below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="lineItemName">Line Item Name *</Label>
              <Input
                id="lineItemName"
                value={editForm.lineItemName}
                onChange={(e) =>
                  setEditForm({ ...editForm, lineItemName: e.target.value })
                }
                placeholder="Enter line item name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lineItemDescription">Description</Label>
              <Textarea
                id="lineItemDescription"
                value={editForm.lineItemDescription}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    lineItemDescription: e.target.value,
                  })
                }
                placeholder="Enter description (optional)"
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="vendorName">Vendor Name</Label>
              <Input
                id="vendorName"
                value={editForm.vendorName}
                onChange={(e) =>
                  setEditForm({ ...editForm, vendorName: e.target.value })
                }
                placeholder="Enter vendor name (optional)"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="estimatedAmount">Budget Amount *</Label>
              <Input
                id="estimatedAmount"
                type="number"
                step="0.01"
                value={editForm.estimatedAmount}
                onChange={(e) =>
                  setEditForm({ ...editForm, estimatedAmount: e.target.value })
                }
                placeholder="0.00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Purchase Request Dialog */}
      <Dialog open={isCreatePurchaseRequestOpen} onOpenChange={setIsCreatePurchaseRequestOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Purchase Request</DialogTitle>
            <DialogDescription>
              Request approval for a purchase from this line item. The request must be approved before you can add transactions.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Line Item (read-only) */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Line Item
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-muted text-muted-foreground border border-border rounded-md"
                value={lineItem?.lineItemName || ""}
                disabled
              />
            </div>

            {/* Amount */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Requested Amount *
              </label>
              <input
                type="number"
                className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-[#61bc47]"
                value={createPRAmount}
                onChange={(e) => setCreatePRAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
              />
            </div>

            {/* Vendor */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Vendor
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-[#61bc47]"
                value={createPRVendorName}
                onChange={(e) => setCreatePRVendorName(e.target.value)}
                placeholder="Enter vendor name"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Description
              </label>
              <textarea
                className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-[#61bc47]"
                value={createPRDescription}
                onChange={(e) => setCreatePRDescription(e.target.value)}
                placeholder="Describe what you need to purchase"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <button
              onClick={() => setIsCreatePurchaseRequestOpen(false)}
              className="px-4 py-2 text-foreground border border-border rounded-md hover:bg-accent transition-colors"
              disabled={isSavingPurchaseRequest}
            >
              Cancel
            </button>
            <button
              onClick={handleCreatePurchaseRequest}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#61bc47] hover:bg-[#52a038] text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSavingPurchaseRequest}
            >
              <ShoppingCart className="w-4 h-4" />
              Create Request
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Purchase Request Dialog */}
      <Dialog open={isEditPurchaseRequestOpen} onOpenChange={setIsEditPurchaseRequestOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Purchase Request</DialogTitle>
            <DialogDescription>
              Update the purchase request details below.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Amount */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Requested Amount *
              </label>
              <input
                type="number"
                className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-[#61bc47]"
                value={editPRAmount}
                onChange={(e) => setEditPRAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
              />
            </div>

            {/* Vendor */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Vendor
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-[#61bc47]"
                value={editPRVendorName}
                onChange={(e) => setEditPRVendorName(e.target.value)}
                placeholder="Enter vendor name"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Description
              </label>
              <textarea
                className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-[#61bc47]"
                value={editPRDescription}
                onChange={(e) => setEditPRDescription(e.target.value)}
                placeholder="Describe what you need to purchase"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <button
              onClick={() => setIsEditPurchaseRequestOpen(false)}
              className="px-4 py-2 text-foreground border border-border rounded-md hover:bg-accent transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleEditPurchaseRequest}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#61bc47] hover:bg-[#52a038] text-white rounded-md transition-colors"
            >
              <Edit className="w-4 h-4" />
              Update Request
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Transaction Dialog */}
      <Dialog open={isAddTransactionOpen} onOpenChange={setIsAddTransactionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Transaction</DialogTitle>
            <DialogDescription>
              Add a transaction to the approved purchase request.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Purchase Request (read-only) */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Purchase Request
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-muted text-muted-foreground border border-border rounded-md"
                value={transactionPurchaseRequest ? `${formatCurrency(transactionPurchaseRequest.amount)} - ${transactionPurchaseRequest.vendorName}` : ""}
                disabled
              />
            </div>

            {/* Amount */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Amount *
              </label>
              <input
                type="number"
                className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-[#61bc47]"
                value={transactionAmount}
                onChange={(e) => setTransactionAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
              />
            </div>

            {/* Transaction Date */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Transaction Date *
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-[#61bc47]"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
              />
            </div>

            {/* Payment Method */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Payment Method *
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-[#61bc47]"
                value={transactionPaymentMethod}
                onChange={(e) => setTransactionPaymentMethod(e.target.value)}
                placeholder="e.g., Credit Card, Check, Cash"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Description
              </label>
              <textarea
                className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-[#61bc47]"
                value={transactionDescription}
                onChange={(e) => setTransactionDescription(e.target.value)}
                placeholder="Additional notes about this transaction"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <button
              onClick={() => setIsAddTransactionOpen(false)}
              className="px-4 py-2 text-foreground border border-border rounded-md hover:bg-accent transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddTransaction}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#61bc47] hover:bg-[#52a038] text-white rounded-md transition-colors"
            >
              <DollarSign className="w-4 h-4" />
              Add Transaction
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
