"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Calendar,
  DollarSign,
  CreditCard,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileAttachments } from "@/components/FileAttachments";
import { BackButton } from "@/components/BackButton";

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

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 max-w-[1200px]">
        <Skeleton className="h-10 w-64 mb-6" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 max-w-[1200px]">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-8 text-center">
          <h3 className="text-xl font-semibold text-red-900 dark:text-red-200 mb-2">
            Error Loading Transaction
          </h3>
          <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
          <Button onClick={() => router.back()} variant="outline">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 max-w-[1200px]">
      {/* Header */}
      <div className="mb-6">
        <BackButton
          fallbackUrl={`/budgets/${resolvedParams.slug}/transactions`}
          label="Back"
        />

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Transaction Details
            </h1>
            <p className="text-muted-foreground mt-2">
              {transaction.transactionType} Transaction
            </p>
          </div>

          <Button variant="outline" size="sm">
            Edit
          </Button>
        </div>
      </div>

      {/* Transaction Info */}
      <Card className="p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start gap-3">
            <DollarSign className="w-5 h-5 text-muted-foreground mt-1" />
            <div>
              <div className="text-sm text-muted-foreground mb-1">Amount</div>
              <div className={`text-2xl font-bold ${
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
              <div className="text-xl font-semibold text-foreground">
                {formatDate(transaction.transactionDate)}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-muted-foreground mt-1" />
            <div>
              <div className="text-sm text-muted-foreground mb-1">Payee</div>
              <div className="text-xl font-semibold text-foreground">
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
                <div className="text-xl font-semibold text-foreground">
                  {transaction.paymentMethod}
                </div>
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
      <FileAttachments
        files={transaction.files || []}
        uploadEndpoint={`/api/projects/${transaction.projectId}/transactions/${transaction.transactionId}/files`}
        onFilesUploaded={fetchTransactionDetails}
      />
    </div>
  );
}
