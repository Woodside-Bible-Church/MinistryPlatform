"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  DollarSign,
  FileText,
  Upload,
  Download,
  Link2,
  CheckCircle,
  Clock,
  XCircle,
  Plus,
  Trash2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

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

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
  const [isUploading, setIsUploading] = useState(false);

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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !lineItem) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append("files", file);
      });

      const response = await fetch(
        `/api/projects/${lineItem.projectId}/line-items/${lineItem.lineItemId}/files`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to upload files");
      }

      // Refresh line item details to show new files
      await fetchLineItemDetails();
    } catch (err) {
      console.error("Error uploading files:", err);
      alert("Failed to upload files. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const copyPublicUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    alert("Public URL copied to clipboard!");
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
            <Button variant="outline" size="sm">
              Edit
            </Button>
            <Button variant="outline" size="sm">
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
      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Attached Files
          </h2>
          <div>
            <input
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
              disabled={isUploading}
            />
            <Button
              onClick={() => document.getElementById("file-upload")?.click()}
              disabled={isUploading}
              size="sm"
            >
              <Upload className="w-4 h-4 mr-2" />
              {isUploading ? "Uploading..." : "Upload Files"}
            </Button>
          </div>
        </div>

        {lineItem.files && lineItem.files.length > 0 ? (
          <div className="space-y-2">
            {lineItem.files.map((file) => (
              <div
                key={file.FileId}
                className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileText className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-foreground truncate">
                      {file.FileName}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatFileSize(file.FileSize)} •{" "}
                      {formatDate(file.LastUpdated)}
                      {file.Description && ` • ${file.Description}`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(file.publicUrl, "_blank")}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyPublicUrl(file.publicUrl)}
                  >
                    <Link2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No files attached yet. Upload files like quotes or receipts.
          </div>
        )}
      </Card>

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
                    <div>
                      <div className="font-medium text-foreground">
                        {formatCurrency(request.amount)} - {request.vendorName}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {request.description}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
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
    </div>
  );
}
