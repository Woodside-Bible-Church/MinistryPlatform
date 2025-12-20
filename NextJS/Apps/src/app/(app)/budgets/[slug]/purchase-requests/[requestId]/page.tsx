"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  Edit,
  Trash2,
  Plus,
  ShoppingCart,
} from "lucide-react";
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
import { FileAttachments } from "@/components/FileAttachments";
import { BackButton } from "@/components/BackButton";
import { toast } from "sonner";
import { useBudgetPermissions } from "@/hooks/useBudgetPermissions";

interface PurchaseRequestDetails {
  purchaseRequestId: number;
  requisitionGuid: string;
  projectId: number;
  lineItemId: number;
  lineItemName: string;
  categoryId: number;
  categoryName: string;
  amount: number;
  description: string;
  vendorName: string;
  requestedDate: string;
  approvalStatus: "Pending" | "Approved" | "Rejected";
  approvedDate: string | null;
  rejectionReason: string | null;
  requestedByContactId: number;
  requestedByName: string;
  requestedByEmail: string;
  approvedByContactId: number | null;
  approvedByName: string | null;
  transactions: Transaction[];
  transactionCount: number;
  transactionTotal: number;
  remainingAmount: number;
  files: FileAttachment[];
}

interface Transaction {
  transactionId: number;
  transactionDate: string;
  amount: number;
  description: string;
  vendorName: string;
  paymentMethod: string;
  paymentMethodId: number;
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
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function PurchaseRequestDetailsPage({
  params,
}: {
  params: Promise<{ slug: string; requestId: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const permissions = useBudgetPermissions();
  const [purchaseRequest, setPurchaseRequest] =
    useState<PurchaseRequestDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit Purchase Request modal state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editAmount, setEditAmount] = useState<string>("");
  const [editDescription, setEditDescription] = useState<string>("");
  const [editVendorName, setEditVendorName] = useState<string>("");

  // Add Transaction modal state
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [transactionAmount, setTransactionAmount] = useState<string>("");
  const [transactionDescription, setTransactionDescription] = useState<string>("");
  const [transactionDate, setTransactionDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [transactionPaymentMethod, setTransactionPaymentMethod] = useState<string>("");
  const [transactionFiles, setTransactionFiles] = useState<File[]>([]);

  // Edit Transaction modal state
  const [isEditTransactionOpen, setIsEditTransactionOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editTransactionAmount, setEditTransactionAmount] = useState<string>("");
  const [editTransactionDescription, setEditTransactionDescription] = useState<string>("");
  const [editTransactionDate, setEditTransactionDate] = useState<string>("");
  const [editTransactionPaymentMethod, setEditTransactionPaymentMethod] = useState<string>("");

  // Status dropdown state
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

  useEffect(() => {
    fetchPurchaseRequestDetails();
  }, [resolvedParams.requestId]);

  const fetchPurchaseRequestDetails = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/purchase-requests/${resolvedParams.requestId}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch purchase request details");
      }

      const data = await response.json();
      setPurchaseRequest(data);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  async function handleEdit() {
    if (!purchaseRequest) return;

    const amount = parseFloat(editAmount) || 0;

    if (amount <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }

    const savedFormData = {
      amount,
      description: editDescription.trim() || "",
      vendorName: editVendorName.trim() || "",
    };

    setIsEditOpen(false);
    setEditAmount("");
    setEditDescription("");
    setEditVendorName("");

    const previousState = { ...purchaseRequest };

    setPurchaseRequest({
      ...purchaseRequest,
      amount: savedFormData.amount,
      description: savedFormData.description,
      vendorName: savedFormData.vendorName,
      remainingAmount: savedFormData.amount - purchaseRequest.transactionTotal,
    });

    const toastId = toast.loading("Updating purchase request...");

    try {
      const response = await fetch(`/api/purchase-requests/${purchaseRequest.purchaseRequestId}`, {
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

      await fetchPurchaseRequestDetails();
      toast.success("Purchase request updated successfully", { id: toastId });
    } catch (error) {
      console.error("Error updating purchase request:", error);
      setPurchaseRequest(previousState);
      toast.error(error instanceof Error ? error.message : "Failed to update purchase request", { id: toastId });
    }
  }

  async function handleDelete() {
    if (!purchaseRequest) return;

    if (!confirm(`Are you sure you want to delete this purchase request? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/purchase-requests/${purchaseRequest.purchaseRequestId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete purchase request");
      }

      toast.success("Purchase request deleted");
      router.push(`/budgets/${resolvedParams.slug}/purchase-requests`);
    } catch (err) {
      console.error("Error deleting purchase request:", err);
      toast.error("Failed to delete purchase request. Please try again.");
    }
  }

  async function handleStatusChange(newStatus: "Pending" | "Approved" | "Rejected") {
    if (!purchaseRequest) return;

    setStatusDropdownOpen(false);

    const previousState = { ...purchaseRequest };

    setPurchaseRequest({
      ...purchaseRequest,
      approvalStatus: newStatus,
      approvedDate: newStatus === "Approved" ? new Date().toISOString() : null,
    });

    const toastId = toast.loading("Updating status...");

    try {
      const response = await fetch(`/api/purchase-requests/${purchaseRequest.purchaseRequestId}`, {
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

      await fetchPurchaseRequestDetails();
      toast.success(`Purchase request ${newStatus.toLowerCase()}`, { id: toastId });
    } catch (error) {
      console.error("Error updating status:", error);
      setPurchaseRequest(previousState);
      toast.error(error instanceof Error ? error.message : "Failed to update status", { id: toastId });
    }
  }

  async function handleEditTransaction() {
    if (!purchaseRequest || !editingTransaction) return;

    const amount = parseFloat(editTransactionAmount) || 0;

    if (amount <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }

    if (!editTransactionPaymentMethod.trim()) {
      toast.error("Payment method is required");
      return;
    }

    const savedFormData = {
      amount,
      description: editTransactionDescription.trim() || "",
      transactionDate: editTransactionDate,
      paymentMethod: editTransactionPaymentMethod.trim(),
    };

    setIsEditTransactionOpen(false);
    setEditingTransaction(null);
    setEditTransactionAmount("");
    setEditTransactionDescription("");
    setEditTransactionDate("");
    setEditTransactionPaymentMethod("");

    const previousState = { ...purchaseRequest };

    // Update UI optimistically
    setPurchaseRequest({
      ...purchaseRequest,
      transactions: purchaseRequest.transactions.map(t =>
        t.transactionId === editingTransaction.transactionId
          ? {
              ...t,
              amount: savedFormData.amount,
              description: savedFormData.description,
              transactionDate: savedFormData.transactionDate,
              paymentMethod: savedFormData.paymentMethod,
            }
          : t
      ),
      transactionTotal: purchaseRequest.transactionTotal - editingTransaction.amount + savedFormData.amount,
      remainingAmount: purchaseRequest.amount - (purchaseRequest.transactionTotal - editingTransaction.amount + savedFormData.amount),
    });

    const toastId = toast.loading("Updating transaction...");

    try {
      const response = await fetch(`/api/projects/${purchaseRequest.projectId}/transactions`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transactionId: editingTransaction.transactionId,
          amount: savedFormData.amount,
          description: savedFormData.description || null,
          transactionDate: savedFormData.transactionDate,
          payeeName: savedFormData.paymentMethod,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update transaction");
      }

      await fetchPurchaseRequestDetails();
      toast.success("Transaction updated successfully", { id: toastId });
    } catch (error) {
      console.error("Error updating transaction:", error);
      setPurchaseRequest(previousState);
      toast.error(error instanceof Error ? error.message : "Failed to update transaction", { id: toastId });
    }
  }

  async function handleAddTransaction() {
    if (!purchaseRequest) return;

    const amount = parseFloat(transactionAmount) || 0;

    if (amount <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }

    if (!transactionPaymentMethod.trim()) {
      toast.error("Payment method is required");
      return;
    }

    const savedFormData = {
      amount,
      description: transactionDescription.trim() || "",
      transactionDate,
      paymentMethod: transactionPaymentMethod.trim(),
    };
    const savedFiles = [...transactionFiles];

    setIsAddTransactionOpen(false);
    setTransactionAmount("");
    setTransactionDescription("");
    setTransactionDate(new Date().toISOString().split('T')[0]);
    setTransactionPaymentMethod("");
    setTransactionFiles([]);

    const previousState = { ...purchaseRequest };

    // Create optimistic transaction entry
    const optimisticTransaction: Transaction = {
      transactionId: Date.now(), // Temporary ID
      transactionDate: savedFormData.transactionDate,
      amount: savedFormData.amount,
      description: savedFormData.description,
      vendorName: purchaseRequest.vendorName,
      paymentMethod: savedFormData.paymentMethod,
      paymentMethodId: 0,
    };

    setPurchaseRequest({
      ...purchaseRequest,
      transactions: [optimisticTransaction, ...(purchaseRequest.transactions || [])],
      transactionCount: purchaseRequest.transactionCount + 1,
      transactionTotal: purchaseRequest.transactionTotal + savedFormData.amount,
      remainingAmount: purchaseRequest.amount - (purchaseRequest.transactionTotal + savedFormData.amount),
    });

    const toastId = toast.loading("Adding transaction...");

    try {
      const response = await fetch(`/api/purchase-requests/${purchaseRequest.purchaseRequestId}/transactions`, {
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

      const createdTransaction = await response.json();

      // Upload files if any were selected
      if (savedFiles.length > 0 && createdTransaction.transactionId) {
        try {
          const formData = new FormData();
          savedFiles.forEach((file) => {
            formData.append('files', file);
          });

          const uploadResponse = await fetch(`/api/projects/${purchaseRequest.projectId}/transactions/${createdTransaction.transactionId}/files`, {
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

      await fetchPurchaseRequestDetails();
      toast.success("Transaction added successfully", { id: toastId });
    } catch (error) {
      console.error("Error adding transaction:", error);
      setPurchaseRequest(previousState);
      toast.error(error instanceof Error ? error.message : "Failed to add transaction", { id: toastId });
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 max-w-[1200px]">
        <Skeleton className="h-10 w-64 mb-6" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !purchaseRequest) {
    const isNotFound = error?.includes("not found") || error?.includes("404");
    return (
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 max-w-[1200px]">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-8 text-center">
          <h3 className="text-xl font-semibold text-red-900 dark:text-red-200 mb-2">
            {isNotFound ? "Purchase Request Not Found" : "Error Loading Purchase Request"}
          </h3>
          <p className="text-red-700 dark:text-red-300 mb-4">
            {isNotFound
              ? "This purchase request may have been deleted or does not exist."
              : error || "An error occurred while loading the purchase request."}
          </p>
          <Button
            onClick={() => router.push(`/budgets/${resolvedParams.slug}/purchase-requests`)}
            variant="outline"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const statusConfig = {
    Pending: {
      icon: Clock,
      className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      label: "Pending Approval",
    },
    Approved: {
      icon: CheckCircle,
      className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      label: "Approved",
    },
    Rejected: {
      icon: XCircle,
      className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      label: "Rejected",
    },
  };

  const status = statusConfig[purchaseRequest.approvalStatus];
  const StatusIcon = status.icon;

  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 max-w-[1200px]">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <BackButton
            fallbackUrl={`/budgets/${resolvedParams.slug}/purchase-requests`}
            label="Back"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          />

          <div className="flex gap-2">
            {/* Status Icon with Dropdown - First button */}
            {permissions.canApprovePurchaseRequests && (
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                  className={`${
                    purchaseRequest.approvalStatus === "Approved"
                      ? "bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50"
                      : purchaseRequest.approvalStatus === "Rejected"
                      ? "bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50"
                      : "bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:hover:bg-yellow-900/50"
                  }`}
                  title={`Status: ${purchaseRequest.approvalStatus}`}
                >
                  <StatusIcon className="w-4 h-4" />
                </Button>

                {/* Status Dropdown */}
                {statusDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-background border border-border rounded-lg shadow-lg z-50">
                    <button
                      onClick={() => handleStatusChange("Approved")}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted transition-colors text-left"
                    >
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <span className="text-sm font-medium text-foreground">APPROVE</span>
                    </button>
                    <button
                      onClick={() => handleStatusChange("Rejected")}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted transition-colors text-left"
                    >
                      <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                      <span className="text-sm font-medium text-foreground">REJECT</span>
                    </button>
                    <button
                      onClick={() => handleStatusChange("Pending")}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted transition-colors text-left"
                    >
                      <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                      <span className="text-sm font-medium text-foreground">PENDING</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {permissions.canManagePurchaseRequests && (
              <>
                <Button variant="outline" size="sm" onClick={() => {
                  setEditAmount(purchaseRequest.amount.toString());
                  setEditDescription(purchaseRequest.description);
                  setEditVendorName(purchaseRequest.vendorName);
                  setIsEditOpen(true);
                }}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" onClick={handleDelete}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Purchase Request
          </h1>
          <p className="text-muted-foreground mt-2">
            {purchaseRequest.lineItemName} • {purchaseRequest.categoryName}
          </p>
        </div>
      </div>

      {/* Budget Summary - Horizontal bar chart */}
      <div className="mb-10 md:mb-8">
        <div className="flex items-center justify-between mb-2 text-sm text-muted-foreground">
          <div>Spent</div>
          <div>Approved</div>
        </div>
        <div className="relative h-8 bg-muted/30 overflow-hidden flex items-center">
          {purchaseRequest.transactionTotal > 0 && (
            <div
              className={`absolute left-0 top-0 h-full ${
                purchaseRequest.transactionTotal <= purchaseRequest.amount
                  ? "bg-[#61bc47]"
                  : "bg-red-500"
              } transition-all flex items-center justify-start px-3`}
              style={{
                width: `${Math.min(
                  (purchaseRequest.transactionTotal / purchaseRequest.amount) * 100,
                  100
                )}%`,
              }}
            >
              <span className="text-sm font-semibold text-black dark:text-white">
                {formatCurrency(purchaseRequest.transactionTotal)}
              </span>
            </div>
          )}
          <div className="ml-auto pr-3 text-sm font-semibold text-foreground relative z-10">
            {formatCurrency(purchaseRequest.amount)}
          </div>
        </div>
        <div className="mt-2 text-sm">
          <span className="text-muted-foreground">Remaining: </span>
          <span className={`font-medium ${
            purchaseRequest.remainingAmount < 0
              ? "text-red-600 dark:text-red-400"
              : purchaseRequest.remainingAmount === 0
              ? "text-muted-foreground"
              : "text-green-600 dark:text-green-400"
          }`}>
            {purchaseRequest.remainingAmount < 0 ? '-' : ''}{formatCurrency(Math.abs(purchaseRequest.remainingAmount))}
          </span>
          {purchaseRequest.transactionCount > 0 && (
            <span className="text-muted-foreground ml-1">
              ({purchaseRequest.transactionCount} {purchaseRequest.transactionCount === 1 ? 'transaction' : 'transactions'})
            </span>
          )}
        </div>

        {/* Additional Details */}
        <div className="mt-4 pt-4 border-t border-border space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Requested Date</div>
              <div className="text-base font-semibold text-foreground">
                {formatDate(purchaseRequest.requestedDate)}
              </div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground mb-1">Vendor</div>
              <div className="text-base font-semibold text-foreground">
                {purchaseRequest.vendorName}
              </div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground mb-1">Requested By</div>
              <div className="text-base font-semibold text-foreground">
                {purchaseRequest.requestedByName}
              </div>
            </div>

            {purchaseRequest.approvedByName && (
              <div>
                <div className="text-sm text-muted-foreground mb-1">Approved By</div>
                <div className="text-base font-semibold text-foreground">
                  {purchaseRequest.approvedByName}
                  {purchaseRequest.approvedDate && ` on ${formatDate(purchaseRequest.approvedDate)}`}
                </div>
              </div>
            )}
          </div>

          {purchaseRequest.description && (
            <div>
              <div className="text-sm text-muted-foreground mb-1">Description</div>
              <p className="text-foreground">{purchaseRequest.description}</p>
            </div>
          )}

          {purchaseRequest.rejectionReason && (
            <div>
              <div className="text-sm text-muted-foreground mb-1">Rejection Reason</div>
              <p className="text-red-600 dark:text-red-400">
                {purchaseRequest.rejectionReason}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Grid layout for Files and Transactions - side by side on large screens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 gap-y-10 mb-6">
        {/* Files Section - Only admins can manage files */}
        {permissions.canManagePurchaseRequests && (
          <div>
            <FileAttachments
              files={purchaseRequest.files || []}
              uploadEndpoint={`/api/projects/${purchaseRequest.projectId}/purchase-requests/${purchaseRequest.purchaseRequestId}/files`}
              onFilesUploaded={fetchPurchaseRequestDetails}
              emptyMessage="No files attached yet. Upload files like quotes or estimates."
            />
          </div>
        )}

        {/* Transactions Section - No Card wrapper */}
        <div>
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5" />
            Transactions
          </h2>

          <p className="text-sm text-muted-foreground mb-4">
            {purchaseRequest.approvalStatus === "Approved"
              ? "Record transactions as spending occurs against this approved purchase request."
              : "This purchase request must be approved before transactions can be added."}
          </p>

          {purchaseRequest.transactionCount > 0 ? (
            <div className="space-y-2 mb-4">
              {purchaseRequest.transactions.map((transaction) => (
                <div
                  key={transaction.transactionId}
                  className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() =>
                    router.push(
                      `/budgets/${resolvedParams.slug}/transactions/${transaction.transactionId}`
                    )
                  }
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground">
                        {formatCurrency(transaction.amount)}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {transaction.description} • {formatDate(transaction.transactionDate)}
                      </div>
                    </div>

                    {permissions.canManageTransactions && (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTransaction(transaction);
                            setEditTransactionAmount(transaction.amount.toString());
                            setEditTransactionDescription(transaction.description);
                            setEditTransactionDate(transaction.transactionDate.split('T')[0]);
                            setEditTransactionPaymentMethod(transaction.paymentMethod);
                            setIsEditTransactionOpen(true);
                          }}
                          className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-muted-foreground hover:text-foreground transition-colors"
                          title="Edit Transaction"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (confirm("Are you sure you want to delete this transaction? This action cannot be undone.")) {
                              try {
                                const response = await fetch(
                                  `/api/projects/${purchaseRequest.projectId}/transactions?transactionId=${transaction.transactionId}`,
                                  {
                                    method: "DELETE",
                                  }
                                );

                                if (!response.ok) {
                                  throw new Error("Failed to delete transaction");
                                }

                                toast.success("Transaction deleted");
                                await fetchPurchaseRequestDetails();
                              } catch (err) {
                                console.error("Error deleting transaction:", err);
                                toast.error("Failed to delete transaction. Please try again.");
                              }
                            }
                          }}
                          className="p-1.5 rounded-md hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
                          title="Delete Transaction"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Payment method info */}
                  <div className="text-xs text-muted-foreground">
                    {transaction.paymentMethod}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground mb-4">
              {purchaseRequest.approvalStatus === "Approved"
                ? "No transactions yet. Add a transaction to record spending."
                : "This purchase request must be approved before transactions can be added."}
            </div>
          )}

          {/* New Transaction button - full width with dashed border */}
          {purchaseRequest.approvalStatus === "Approved" && permissions.canManageTransactions && (
            <button
              onClick={() => {
                setTransactionAmount(purchaseRequest.remainingAmount.toString());
                setTransactionDescription("");
                setTransactionDate(new Date().toISOString().split('T')[0]);
                setTransactionPaymentMethod("");
                setIsAddTransactionOpen(true);
              }}
              className="w-full py-3 px-6 border-2 border-dashed border-border hover:border-[#61bc47] hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-lg transition-colors flex items-center justify-center gap-2 text-muted-foreground hover:text-[#61bc47]"
            >
              <Plus className="w-4 h-4" />
              New Transaction
            </button>
          )}
        </div>
      </div>

      {/* Edit Purchase Request Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Purchase Request</DialogTitle>
            <DialogDescription>
              Update the purchase request details below.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Requested Amount *
              </label>
              <input
                type="number"
                className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-[#61bc47]"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Vendor
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-[#61bc47]"
                value={editVendorName}
                onChange={(e) => setEditVendorName(e.target.value)}
                placeholder="Enter vendor name"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Description
              </label>
              <textarea
                className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-[#61bc47]"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Describe what you need to purchase"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <button
              onClick={() => setIsEditOpen(false)}
              className="px-4 py-2 text-foreground border border-border rounded-md hover:bg-accent transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleEdit}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#61bc47] hover:bg-[#52a038] text-white rounded-md transition-colors"
            >
              <Edit className="w-4 h-4" />
              Update Request
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Transaction Dialog */}
      <Dialog open={isEditTransactionOpen} onOpenChange={setIsEditTransactionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
            <DialogDescription>
              Update the transaction details below.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Amount *
              </label>
              <input
                type="number"
                className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-[#61bc47]"
                value={editTransactionAmount}
                onChange={(e) => setEditTransactionAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Transaction Date *
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-[#61bc47]"
                value={editTransactionDate}
                onChange={(e) => setEditTransactionDate(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Payment Method *
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-[#61bc47]"
                value={editTransactionPaymentMethod}
                onChange={(e) => setEditTransactionPaymentMethod(e.target.value)}
                placeholder="e.g., Credit Card, Check, Cash"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Description
              </label>
              <textarea
                className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-[#61bc47]"
                value={editTransactionDescription}
                onChange={(e) => setEditTransactionDescription(e.target.value)}
                placeholder="Additional notes about this transaction"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <button
              onClick={() => setIsEditTransactionOpen(false)}
              className="px-4 py-2 text-foreground border border-border rounded-md hover:bg-accent transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleEditTransaction}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#61bc47] hover:bg-[#52a038] text-white rounded-md transition-colors"
            >
              <DollarSign className="w-4 h-4" />
              Save Changes
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

            {/* File Attachments */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Attach Receipts <span className="text-xs text-muted-foreground">(optional)</span>
              </label>
              <p className="text-xs text-muted-foreground mb-2">
                Upload receipts, invoices, or proof of purchase
              </p>
              <input
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
