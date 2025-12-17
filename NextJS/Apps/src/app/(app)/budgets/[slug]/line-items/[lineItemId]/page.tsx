"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  Plus,
  Trash2,
  Edit,
} from "lucide-react";
import { FileAttachments } from "@/components/FileAttachments";
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

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 max-w-[1600px]">
        <Skeleton className="h-10 w-64 mb-6" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !lineItem) {
    return (
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 max-w-[1600px]">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-8 text-center">
          <h3 className="text-xl font-semibold text-red-900 dark:text-red-200 mb-2">
            Error Loading Line Item
          </h3>
          <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
          <Button
            onClick={() => router.back()}
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
        <Link
          href={`/budgets/${resolvedParams.slug}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {lineItem.projectName}
        </Link>

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
            <div className="text-sm text-muted-foreground mb-1">Estimated</div>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(lineItem.estimatedAmount)}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">Actual</div>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(lineItem.actualAmount)}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">Variance</div>
            <div
              className={`text-2xl font-bold ${
                lineItem.variance > 0
                  ? "text-red-600"
                  : lineItem.variance < 0
                  ? "text-green-600"
                  : "text-muted-foreground"
              }`}
            >
              {formatCurrency(Math.abs(lineItem.variance))}
              {lineItem.variance > 0 && " over"}
              {lineItem.variance < 0 && " under"}
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
      <FileAttachments
        files={lineItem.files || []}
        uploadEndpoint={`/api/projects/${lineItem.projectId}/line-items/${lineItem.lineItemId}/files`}
        onFilesUploaded={fetchLineItemDetails}
      />

      {/* Expense Line Item - Purchase Requests */}
      {isExpense && (
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">
              Purchase Requests
            </h2>
            <Button size="sm">
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
                              router.push(
                                `/budgets/${resolvedParams.slug}/purchase-requests/${request.id}/add-transaction`
                              );
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
                            router.push(
                              `/budgets/${resolvedParams.slug}/purchase-requests/${request.id}/edit`
                            );
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

                      {/* Approval Status Badge */}
                      {request.approvalStatus === "Pending" && (
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                          <Clock className="w-3 h-3 inline mr-1" />
                          Pending
                        </span>
                      )}
                      {request.approvalStatus === "Approved" && (
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          <CheckCircle className="w-3 h-3 inline mr-1" />
                          Approved
                        </span>
                      )}
                      {request.approvalStatus === "Rejected" && (
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                          <XCircle className="w-3 h-3 inline mr-1" />
                          Rejected
                        </span>
                      )}
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
            <Button size="sm">
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
              <Label htmlFor="estimatedAmount">Estimated Amount *</Label>
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
    </div>
  );
}
