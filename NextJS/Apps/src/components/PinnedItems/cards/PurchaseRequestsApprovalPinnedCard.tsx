"use client";

import { useState, useEffect } from "react";
import {
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  DollarSign,
} from "lucide-react";
import { PinnedItem } from "@/types/pinnedItems";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  requestedByContactId: number;
  requestedByName: string;
  requestedByEmail: string;
}

interface PurchaseRequestsApprovalPinnedCardProps {
  item: PinnedItem;
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
  return guid.substring(0, 8).toUpperCase();
}

export function PurchaseRequestsApprovalPinnedCard({ item }: PurchaseRequestsApprovalPinnedCardProps) {
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Approval modal state
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [approvingRequest, setApprovingRequest] = useState<PurchaseRequest | null>(null);
  const [approvalAction, setApprovalAction] = useState<"Approved" | "Rejected" | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSavingApproval, setIsSavingApproval] = useState(false);
  const [processingRequestId, setProcessingRequestId] = useState<number | null>(null);

  // Extract project ID from the item's route
  const projectSlug = item.item_id;

  useEffect(() => {
    async function fetchRequests() {
      try {
        setIsLoading(true);
        setError(null);

        // Get project ID from slug
        const projectResponse = await fetch(`/api/projects/budgets/${encodeURIComponent(projectSlug)}`);
        if (!projectResponse.ok) {
          throw new Error("Failed to fetch project data");
        }
        const projectData = await projectResponse.json();

        // Fetch all purchase requests (not filtered)
        const response = await fetch(
          `/api/projects/${projectData.Project_ID}/purchase-requests?filterByMe=false`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch purchase requests");
        }

        const data = await response.json();
        setRequests(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    }

    fetchRequests();
  }, [projectSlug]);

  async function refetchRequests() {
    try {
      const projectResponse = await fetch(`/api/projects/budgets/${encodeURIComponent(projectSlug)}`);
      if (!projectResponse.ok) return;
      const projectData = await projectResponse.json();

      const response = await fetch(
        `/api/projects/${projectData.Project_ID}/purchase-requests?filterByMe=false`
      );
      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      }
    } catch (err) {
      console.error("Error refetching purchase requests:", err);
    }
  }

  async function handleApprovalAction() {
    if (!approvingRequest || !approvalAction) return;

    if (approvalAction === "Rejected" && !rejectionReason.trim()) {
      alert("Please provide a reason for rejection");
      return;
    }

    // Set processing state and close modal immediately
    setProcessingRequestId(approvingRequest.purchaseRequestId);
    setIsApprovalModalOpen(false);
    setIsSavingApproval(true);

    try {
      const projectResponse = await fetch(`/api/projects/budgets/${encodeURIComponent(projectSlug)}`);
      if (!projectResponse.ok) throw new Error("Failed to fetch project data");
      const projectData = await projectResponse.json();

      const response = await fetch(
        `/api/projects/${projectData.Project_ID}/purchase-requests/${approvingRequest.purchaseRequestId}`,
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
      setProcessingRequestId(null);
    }
  }

  const pendingRequests = requests.filter(r => r.approvalStatus === "Pending");

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-yellow-500 animate-pulse" />
          <div className="h-6 w-48 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-zinc-100 dark:bg-zinc-800 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <p className="text-sm text-red-500">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-foreground mb-1 hover:text-[#61BC47] transition-colors">
          {item.item_data.title}
        </h2>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-yellow-500" />
          <span className="text-sm text-muted-foreground">Quick Approval</span>
          {pendingRequests.length > 0 && (
            <>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-medium rounded-full">
                {pendingRequests.length} pending
              </span>
            </>
          )}
        </div>
      </div>

      {pendingRequests.length === 0 ? (
        <div className="text-center py-8">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No pending approvals</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pendingRequests.slice(0, 3).map((request) => {
            const isProcessing = processingRequestId === request.purchaseRequestId;

            return (
              <div
                key={request.purchaseRequestId}
                className={`bg-zinc-100 dark:bg-zinc-800 rounded-lg p-4 transition-all ${
                  isProcessing
                    ? 'opacity-60 pointer-events-none'
                    : 'hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-purple-600 dark:text-purple-400 font-semibold">
                      {formatGuid(request.requisitionGuid)}
                    </span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-sm font-medium text-foreground truncate">
                      {request.lineItemName}
                    </span>
                    {isProcessing && (
                      <span className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
                        <div className="w-3 h-3 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
                        Processing...
                      </span>
                    )}
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
                    <p className="text-xs text-muted-foreground truncate">
                      {request.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setApprovingRequest(request);
                        setApprovalAction("Approved");
                        setIsApprovalModalOpen(true);
                      }}
                      disabled={isProcessing}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setApprovingRequest(request);
                        setApprovalAction("Rejected");
                        setIsApprovalModalOpen(true);
                      }}
                      disabled={isProcessing}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {pendingRequests.length > 3 && (
            <div className="text-center py-2">
              <p className="text-xs text-muted-foreground">
                + {pendingRequests.length - 3} more pending request{pendingRequests.length - 3 !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>
      )}

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
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onFocus={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  rows={3}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#61bc47] bg-background text-foreground resize-none"
                  placeholder="Explain why this request is being rejected"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
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
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleApprovalAction();
              }}
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
    </div>
  );
}
