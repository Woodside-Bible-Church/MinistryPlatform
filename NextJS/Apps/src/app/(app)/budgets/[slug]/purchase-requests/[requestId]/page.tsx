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

    setIsAddTransactionOpen(false);
    setTransactionAmount("");
    setTransactionDescription("");
    setTransactionDate(new Date().toISOString().split('T')[0]);
    setTransactionPaymentMethod("");

    const previousState = { ...purchaseRequest };

    setPurchaseRequest({
      ...purchaseRequest,
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
        <BackButton
          fallbackUrl={`/budgets/${resolvedParams.slug}/purchase-requests`}
          label="Back"
        />

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Purchase Request
            </h1>
            <p className="text-muted-foreground mt-2">
              {purchaseRequest.lineItemName} • {purchaseRequest.categoryName}
            </p>
          </div>

          <div className="flex items-center gap-2">
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

            {/* Status Icon with Dropdown */}
            <div className="relative">
              <button
                onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                className={`p-2 rounded-md transition-colors ${
                  purchaseRequest.approvalStatus === "Approved"
                    ? "bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50"
                    : purchaseRequest.approvalStatus === "Rejected"
                    ? "bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50"
                    : "bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:hover:bg-yellow-900/50"
                }`}
                title={`Status: ${purchaseRequest.approvalStatus}`}
              >
                <StatusIcon className="w-5 h-5" />
              </button>

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
          </div>
        </div>
      </div>

      {/* Request Info */}
      <Card className="p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start gap-3">
            <DollarSign className="w-5 h-5 text-muted-foreground mt-1" />
            <div>
              <div className="text-sm text-muted-foreground mb-1">
                Requested Amount
              </div>
              <div className="text-2xl font-bold text-foreground">
                {formatCurrency(purchaseRequest.amount)}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-muted-foreground mt-1" />
            <div>
              <div className="text-sm text-muted-foreground mb-1">
                Requested Date
              </div>
              <div className="text-xl font-semibold text-foreground">
                {formatDate(purchaseRequest.requestedDate)}
              </div>
            </div>
          </div>

          <div>
            <div className="text-sm text-muted-foreground mb-1">Vendor</div>
            <div className="text-xl font-semibold text-foreground">
              {purchaseRequest.vendorName}
            </div>
          </div>

          <div>
            <div className="text-sm text-muted-foreground mb-1">Requested By</div>
            <div className="text-xl font-semibold text-foreground">
              {purchaseRequest.requestedByName}
            </div>
          </div>

          {purchaseRequest.description && (
            <div className="md:col-span-2">
              <div className="text-sm text-muted-foreground mb-1">
                Description
              </div>
              <p className="text-foreground">{purchaseRequest.description}</p>
            </div>
          )}

          {purchaseRequest.approvedByName && (
            <div className="md:col-span-2 pt-4 border-t border-border">
              <div className="text-sm text-muted-foreground mb-1">
                Approved By
              </div>
              <div className="text-lg font-semibold text-foreground">
                {purchaseRequest.approvedByName} on{" "}
                {purchaseRequest.approvedDate &&
                  formatDate(purchaseRequest.approvedDate)}
              </div>
            </div>
          )}

          {purchaseRequest.rejectionReason && (
            <div className="md:col-span-2 pt-4 border-t border-border">
              <div className="text-sm text-muted-foreground mb-1">
                Rejection Reason
              </div>
              <p className="text-red-600 dark:text-red-400">
                {purchaseRequest.rejectionReason}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Files Section */}
      <div className="mb-6">
        <FileAttachments
          files={purchaseRequest.files || []}
          uploadEndpoint={`/api/projects/${purchaseRequest.projectId}/purchase-requests/${purchaseRequest.purchaseRequestId}/files`}
          onFilesUploaded={fetchPurchaseRequestDetails}
        />
      </div>

      {/* Transactions Section */}
      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">
            Transactions ({purchaseRequest.transactionCount})
          </h2>
          {purchaseRequest.approvalStatus === "Approved" && (
            <Button
              size="sm"
              onClick={() => {
                setTransactionAmount(purchaseRequest.remainingAmount.toString());
                setTransactionDescription("");
                setTransactionDate(new Date().toISOString().split('T')[0]);
                setTransactionPaymentMethod("");
                setIsAddTransactionOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Transaction
            </Button>
          )}
        </div>

        {purchaseRequest.transactionCount > 0 ? (
          <>
            <div className="space-y-2">
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

            <div className="mt-4 pt-4 border-t border-border flex justify-between">
              <div className="text-sm text-muted-foreground">Total Spent:</div>
              <div className="font-bold text-foreground">
                {formatCurrency(purchaseRequest.transactionTotal)}
              </div>
            </div>

            <div className="flex justify-between mt-2">
              <div className="text-sm text-muted-foreground">Remaining:</div>
              <div className="font-bold text-foreground">
                {formatCurrency(purchaseRequest.remainingAmount)}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            {purchaseRequest.approvalStatus === "Approved"
              ? "No transactions yet. Add a transaction to record spending."
              : "This purchase request must be approved before transactions can be added."}
          </div>
        )}
      </Card>

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
