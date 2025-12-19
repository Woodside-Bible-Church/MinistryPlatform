"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Calendar,
  DollarSign,
  CreditCard,
  Edit,
  Trash2,
  ShoppingCart,
  ExternalLink,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileAttachments } from "@/components/FileAttachments";
import { BackButton } from "@/components/BackButton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface TransactionDetails {
  transactionId: number;
  transactionDate: string;
  transactionType: "Expense" | "Income";
  amount: number;
  description: string;
  payeeName: string;
  paymentReference: string | null;
  notes: string | null;
  paymentMethodId: number | null;
  paymentMethod: string | null;
  projectId: number;
  projectName: string;
  projectSlug: string;
  categoryId: number | null;
  categoryName: string | null;
  lineItemId: number | null;
  lineItemName: string | null;
  lineItemCategoryId: number | null;
  lineItemCategoryName: string | null;
  purchaseRequestId: number | null;
  requisitionGuid: string | null;
  purchaseRequestAmount: number | null;
  purchaseRequestVendor: string | null;
  purchaseRequestStatus: string | null;
  submittedByUserId: number | null;
  submittedByContactId: number | null;
  submittedByName: string | null;
  submittedByEmail: string | null;
  files: FileAttachment[];
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

export default function TransactionDetailsPage({
  params,
}: {
  params: Promise<{ slug: string; transactionId: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [transaction, setTransaction] = useState<TransactionDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit Transaction modal state
  const [isEditTransactionOpen, setIsEditTransactionOpen] = useState(false);
  const [editTransactionDate, setEditTransactionDate] = useState("");
  const [editTransactionType, setEditTransactionType] = useState<"Expense" | "Income">("Expense");
  const [editTransactionAmount, setEditTransactionAmount] = useState("");
  const [editTransactionPayee, setEditTransactionPayee] = useState("");
  const [editTransactionDescription, setEditTransactionDescription] = useState("");
  const [editTransactionPaymentMethod, setEditTransactionPaymentMethod] = useState("");
  const [editTransactionPaymentReference, setEditTransactionPaymentReference] = useState("");
  const [editTransactionNotes, setEditTransactionNotes] = useState("");
  const [isSavingEditTransaction, setIsSavingEditTransaction] = useState(false);

  useEffect(() => {
    fetchTransactionDetails();
  }, [resolvedParams.transactionId]);

  const fetchTransactionDetails = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/transactions/${resolvedParams.transactionId}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch transaction details");
      }

      const data = await response.json();
      setTransaction(data);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenEdit = () => {
    if (!transaction) return;

    setEditTransactionDate(transaction.transactionDate.split('T')[0]);
    setEditTransactionType(transaction.transactionType);
    setEditTransactionAmount(Math.abs(transaction.amount).toString());
    setEditTransactionPayee(transaction.payeeName || "");
    setEditTransactionDescription(transaction.description || "");
    setEditTransactionPaymentMethod(transaction.paymentMethodId?.toString() || "");
    setEditTransactionPaymentReference(transaction.paymentReference || "");
    setEditTransactionNotes(transaction.notes || "");
    setIsEditTransactionOpen(true);
  };

  const handleEditTransaction = async () => {
    if (!transaction) return;

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

    try {
      const response = await fetch(`/api/projects/${transaction.projectId}/transactions`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transactionId: transaction.transactionId,
          transactionDate: editTransactionDate,
          transactionType: editTransactionType,
          amount: amount,
          lineItemId: transaction.lineItemId, // Keep existing line item
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
      await fetchTransactionDetails();

      toast.success("Transaction updated successfully", { id: toastId });
    } catch (err) {
      console.error("Error updating transaction:", err);
      toast.error(err instanceof Error ? err.message : "Failed to update transaction", { id: toastId });
    } finally {
      setIsSavingEditTransaction(false);
    }
  };

  const handleDeleteTransaction = async () => {
    if (!transaction) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete this transaction${transaction.description ? ` "${transaction.description}"` : ""}? This action cannot be undone.`
    );

    if (!confirmed) return;

    // Show loading toast
    const toastId = toast.loading("Deleting transaction...");

    try {
      const response = await fetch(
        `/api/projects/${transaction.projectId}/transactions?transactionId=${transaction.transactionId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete transaction");
      }

      toast.success("Transaction deleted successfully", { id: toastId });

      // Navigate back to transactions list
      router.push(`/budgets/${resolvedParams.slug}/transactions`);
    } catch (err) {
      console.error("Error deleting transaction:", err);
      toast.error(err instanceof Error ? err.message : "Failed to delete transaction", { id: toastId });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 max-w-[1200px]">
        <Skeleton className="h-10 w-64 mb-6" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !transaction) {
    const isNotFound = error?.includes("not found") || error?.includes("404");
    return (
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 max-w-[1200px]">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-8 text-center">
          <h3 className="text-xl font-semibold text-red-900 dark:text-red-200 mb-2">
            {isNotFound ? "Transaction Not Found" : "Error Loading Transaction"}
          </h3>
          <p className="text-red-700 dark:text-red-300 mb-4">
            {isNotFound
              ? "This transaction may have been deleted or does not exist."
              : error || "An error occurred while loading the transaction."}
          </p>
          <Button
            onClick={() => router.push(`/budgets/${resolvedParams.slug}/transactions`)}
            variant="outline"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-8 max-w-[1200px]">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <BackButton
            fallbackUrl={`/budgets/${resolvedParams.slug}/transactions`}
            label="Back"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          />

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleOpenEdit}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button variant="outline" size="sm" onClick={handleDeleteTransaction}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Transaction Details
          </h1>
          <p className="text-muted-foreground mt-2">
            {transaction.transactionType} Transaction
          </p>
        </div>
      </div>

      {/* Transaction Info */}
      <Card className="p-4 md:p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start gap-3">
            <DollarSign className="w-5 h-5 text-muted-foreground mt-1" />
            <div>
              <div className="text-sm text-muted-foreground mb-1">Amount</div>
              <div className={`text-xl md:text-2xl font-bold ${
                transaction.transactionType === "Income"
                  ? "text-green-600 dark:text-green-400"
                  : "text-foreground"
              }`}>
                {formatCurrency(transaction.amount)}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-muted-foreground mt-1" />
            <div>
              <div className="text-sm text-muted-foreground mb-1">Date</div>
              <div className="text-lg md:text-xl font-semibold text-foreground">
                {formatDate(transaction.transactionDate)}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-muted-foreground mt-1" />
            <div>
              <div className="text-sm text-muted-foreground mb-1">Type</div>
              <div className={`text-lg md:text-xl font-semibold ${
                transaction.transactionType === "Income"
                  ? "text-green-600 dark:text-green-400"
                  : "text-foreground"
              }`}>
                {transaction.transactionType}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-muted-foreground mt-1" />
            <div>
              <div className="text-sm text-muted-foreground mb-1">Payee</div>
              <div className="text-lg md:text-xl font-semibold text-foreground">
                {transaction.payeeName || "N/A"}
              </div>
            </div>
          </div>

          {transaction.paymentMethod && (
            <div className="flex items-start gap-3">
              <CreditCard className="w-5 h-5 text-muted-foreground mt-1" />
              <div>
                <div className="text-sm text-muted-foreground mb-1">
                  Payment Method
                </div>
                <div className="text-lg md:text-xl font-semibold text-foreground">
                  {transaction.paymentMethod}
                </div>
              </div>
            </div>
          )}

          {transaction.purchaseRequestId && (
            <div className="flex items-start gap-3">
              <ShoppingCart className="w-5 h-5 text-muted-foreground mt-1" />
              <div>
                <div className="text-sm text-muted-foreground mb-1">
                  Purchase Request
                </div>
                <button
                  onClick={() => router.push(`/budgets/${resolvedParams.slug}/purchase-requests/${transaction.purchaseRequestId}`)}
                  className="group flex items-center gap-2 text-lg md:text-xl font-semibold text-foreground hover:text-[#61bc47] transition-colors"
                >
                  <span>{transaction.purchaseRequestVendor || `Request #${transaction.purchaseRequestId}`}</span>
                  <ExternalLink className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                </button>
              </div>
            </div>
          )}

          {transaction.description && (
            <div className="md:col-span-2">
              <div className="text-sm text-muted-foreground mb-1">
                Description
              </div>
              <p className="text-foreground">{transaction.description}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Files Section */}
      <div className="mt-8">
        <FileAttachments
          files={transaction.files || []}
          uploadEndpoint={`/api/projects/${transaction.projectId}/transactions/${transaction.transactionId}/files`}
          onFilesUploaded={fetchTransactionDetails}
        />
      </div>

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
