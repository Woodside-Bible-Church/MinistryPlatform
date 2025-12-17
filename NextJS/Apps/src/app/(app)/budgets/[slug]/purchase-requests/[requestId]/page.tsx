"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileAttachments } from "@/components/FileAttachments";

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

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 max-w-[1200px]">
        <Skeleton className="h-10 w-64 mb-6" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !purchaseRequest) {
    return (
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 max-w-[1200px]">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-8 text-center">
          <h3 className="text-xl font-semibold text-red-900 dark:text-red-200 mb-2">
            Error Loading Purchase Request
          </h3>
          <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
          <Button onClick={() => router.back()} variant="outline">
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
        <Link
          href={`/budgets/${resolvedParams.slug}/purchase-requests`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Purchase Requests
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Purchase Request
            </h1>
            <p className="text-muted-foreground mt-2">
              {purchaseRequest.lineItemName} • {purchaseRequest.categoryName}
            </p>
          </div>

          <div className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 ${status.className}`}>
            <StatusIcon className="w-4 h-4" />
            {status.label}
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
      <FileAttachments
        files={purchaseRequest.files || []}
        uploadEndpoint={`/api/projects/${purchaseRequest.projectId}/purchase-requests/${purchaseRequest.purchaseRequestId}/files`}
        onFilesUploaded={fetchPurchaseRequestDetails}
      />

      {/* Transactions Section */}
      {purchaseRequest.transactionCount > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Transactions ({purchaseRequest.transactionCount})
          </h2>

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
        </Card>
      )}
    </div>
  );
}
