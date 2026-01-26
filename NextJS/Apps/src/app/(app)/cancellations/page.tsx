"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  AlertCircle,
  Pencil,
  Loader2,
  X,
  Save,
  XCircle,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  MessageSquare,
  Plus,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useCampus } from "@/contexts/CampusContext";
import type {
  Cancellation,
  CancellationFormData,
  CancellationService,
  CancellationServiceFormData,
  CancellationUpdate,
  CancellationStatusOption,
} from "@/types/cancellations";

function formatShortDate(dateString: string) {
  if (!dateString) return "N/A";
  const date = new Date(dateString.replace(" ", "T"));
  if (isNaN(date.getTime())) return "Invalid Date";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatResumeDate(dateString: string) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = date.toDateString() === tomorrow.toDateString();

  const timeStr = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  if (isToday) {
    return `Today at ${timeStr}`;
  } else if (isTomorrow) {
    return `Tomorrow at ${timeStr}`;
  } else {
    const dayStr = date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
    return `${dayStr} at ${timeStr}`;
  }
}

function isValidDateString(str: string): boolean {
  if (!str) return false;
  const date = new Date(str);
  return !isNaN(date.getTime()) && (str.includes("T") || str.includes("-"));
}

function camelCaseToFriendly(str: string): string {
  // Insert space before capital letters and capitalize first letter
  return str
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

const statusConfig = {
  closed: {
    label: "Closed",
    bgColor: "bg-red-100 dark:bg-red-900/30",
    textColor: "text-red-700 dark:text-red-400",
    borderColor: "border-red-300 dark:border-red-800",
    icon: XCircle,
  },
  modified: {
    label: "Modified",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
    textColor: "text-amber-700 dark:text-amber-400",
    borderColor: "border-amber-300 dark:border-amber-800",
    icon: AlertTriangle,
  },
  open: {
    label: "Open",
    bgColor: "bg-green-100 dark:bg-green-900/30",
    textColor: "text-green-700 dark:text-green-400",
    borderColor: "border-green-300 dark:border-green-800",
    icon: CheckCircle,
  },
};

const serviceStatusOptions = [
  { value: "cancelled", label: "Cancelled" },
  { value: "modified", label: "Modified" },
  { value: "delayed", label: "Delayed" },
];

export default function CancellationsPage() {
  const { selectedCampus } = useCampus();
  const [cancellations, setCancellations] = useState<Cancellation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is viewing church-wide (all campuses) or a specific campus
  const isChurchWide = !selectedCampus || selectedCampus.Congregation_ID === 1;

  // Dropdowns data
  const [statuses, setStatuses] = useState<CancellationStatusOption[]>([]);

  // Modal state (simplified - just for status editing)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCancellation, setEditingCancellation] = useState<Cancellation | null>(null);

  // Form data
  const [formData, setFormData] = useState<CancellationFormData>({
    congregationID: 0,
    statusID: 1,
    reason: "",
    expectedResumeTime: "",
    startDate: new Date().toISOString().slice(0, 16),
    endDate: null,
  });

  // Expected Resume Time mode
  const [resumeTimeMode, setResumeTimeMode] = useState<"date" | "text">("date");
  const [resumeTimeDate, setResumeTimeDate] = useState<string>("");

  // Per-card service form state (keyed by cancellation ID)
  const [newServiceByCard, setNewServiceByCard] = useState<Record<number, CancellationServiceFormData>>({});

  // Per-card update message state (keyed by cancellation ID)
  const [newUpdateByCard, setNewUpdateByCard] = useState<Record<number, string>>({});

  // Helper to get/set per-card service form
  const getNewService = (cardId: number): CancellationServiceFormData =>
    newServiceByCard[cardId] || { serviceName: "", serviceStatus: "cancelled", details: "", sortOrder: 0 };

  const setNewService = (cardId: number, value: CancellationServiceFormData) =>
    setNewServiceByCard(prev => ({ ...prev, [cardId]: value }));

  // Helper to get/set per-card update message
  const getNewUpdateMessage = (cardId: number): string => newUpdateByCard[cardId] || "";

  const setNewUpdateMessage = (cardId: number, value: string) =>
    setNewUpdateByCard(prev => ({ ...prev, [cardId]: value }));

  // Application Labels state
  const [labels, setLabels] = useState<Array<{
    Application_Label_ID: number;
    Label_Name: string;
    English: string;
  }>>([]);
  const [editingLabelId, setEditingLabelId] = useState<number | null>(null);
  const [editingLabelValue, setEditingLabelValue] = useState<string>("");

  // Optimistic UI state - track saving/success per card
  const [savingCardId, setSavingCardId] = useState<number | null>(null);
  const [successCardId, setSuccessCardId] = useState<number | null>(null);

  // Fetch cancellations
  const fetchCancellations = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/cancellations?activeOnly=true`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || errorData.error || "Failed to fetch cancellations");
      }

      const data = await response.json();
      setCancellations(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching cancellations:", err);
      setError(err instanceof Error ? err.message : "Failed to load cancellations");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch statuses
  const fetchStatuses = async () => {
    try {
      const response = await fetch("/api/cancellations/statuses");
      if (response.ok) {
        const data = await response.json();
        setStatuses(data);
      }
    } catch (err) {
      console.error("Error fetching statuses:", err);
    }
  };

  // Fetch labels
  const fetchLabels = async () => {
    try {
      const response = await fetch("/api/cancellations/labels");
      if (response.ok) {
        const data = await response.json();
        setLabels(data);
      }
    } catch (err) {
      console.error("Error fetching labels:", err);
    }
  };

  useEffect(() => {
    fetchCancellations();
    fetchStatuses();
    fetchLabels();
  }, []);

  // Filter cancellations based on selected campus
  const filteredCancellations = cancellations.filter((cancellation) => {
    if (isChurchWide) return true;
    return cancellation.CongregationID === selectedCampus?.Congregation_ID;
  });

  // Open modal for editing status
  const handleEditStatus = (cancellation: Cancellation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCancellation(cancellation);

    const existingResumeTime = cancellation.ExpectedResumeTime || "";
    const isDate = isValidDateString(existingResumeTime);

    setResumeTimeMode(isDate ? "date" : existingResumeTime ? "text" : "date");
    setResumeTimeDate(isDate ? existingResumeTime.slice(0, 16) : "");

    setFormData({
      congregationID: cancellation.CongregationID,
      statusID: cancellation.StatusID,
      reason: cancellation.Reason || "",
      expectedResumeTime: existingResumeTime,
      startDate: cancellation.StartDate?.slice(0, 16) || new Date().toISOString().slice(0, 16),
      endDate: null,
    });
    setIsModalOpen(true);
  };

  // Save status changes with optimistic UI
  const handleSave = async () => {
    if (!editingCancellation) return;

    const cancellationId = editingCancellation.ID;
    const isSettingToOpen = formData.statusID === 1;

    // Find the new status info
    const newStatus = statuses.find(s => s.value === formData.statusID);

    // Close modal immediately and show saving state on card
    setIsModalOpen(false);
    setSavingCardId(cancellationId);

    // Optimistically update local state
    setCancellations(prev => prev.map(c => {
      if (c.ID === cancellationId) {
        return {
          ...c,
          StatusID: formData.statusID,
          StatusName: newStatus?.label || c.StatusName,
          Status: newStatus?.status || c.Status,
          Reason: isSettingToOpen ? null : formData.reason || null,
          ExpectedResumeTime: isSettingToOpen ? null : formData.expectedResumeTime || null,
          Services: isSettingToOpen ? [] : c.Services,
          Updates: isSettingToOpen ? [] : c.Updates,
        };
      }
      return c;
    }));

    try {
      // If changing to Open status, delete all services and updates first
      if (isSettingToOpen) {
        // Delete all services
        if (editingCancellation.Services && editingCancellation.Services.length > 0) {
          for (const service of editingCancellation.Services) {
            await fetch(`/api/cancellations/${cancellationId}/services?serviceId=${service.ID}`, {
              method: "DELETE",
            });
          }
        }

        // Delete all updates
        if (editingCancellation.Updates && editingCancellation.Updates.length > 0) {
          for (const update of editingCancellation.Updates) {
            await fetch(`/api/cancellations/${cancellationId}/updates?updateId=${update.ID}`, {
              method: "DELETE",
            });
          }
        }
      }

      const saveData = {
        ...formData,
        reason: isSettingToOpen ? "" : formData.reason,
        expectedResumeTime: isSettingToOpen ? "" : formData.expectedResumeTime,
      };

      const response = await fetch(`/api/cancellations/${cancellationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(saveData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || "Failed to save");
      }

      // Show success state on card
      setSavingCardId(null);
      setSuccessCardId(cancellationId);
      setTimeout(() => setSuccessCardId(null), 1500);

      // Silently refresh data in background to ensure consistency
      const refreshResponse = await fetch(`/api/cancellations?activeOnly=true`);
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        setCancellations(data);
      }
    } catch (err) {
      console.error("Error saving:", err);
      toast.error(err instanceof Error ? err.message : "Failed to save");
      setSavingCardId(null);
      // Revert by refetching
      fetchCancellations();
    }
  };

  // Add service inline with optimistic UI
  const handleAddService = async (cancellationId: number) => {
    const newService = getNewService(cancellationId);
    if (!newService.serviceName) {
      toast.error("Activity name is required");
      return;
    }

    // Create optimistic service with temp ID
    const tempId = Date.now();
    const optimisticService: CancellationService = {
      ID: tempId,
      CancellationID: cancellationId,
      ServiceName: newService.serviceName,
      ServiceStatus: newService.serviceStatus as 'cancelled' | 'modified' | 'delayed',
      Details: newService.details || null,
      SortOrder: 0,
    };

    // Clear form immediately
    setNewService(cancellationId, { serviceName: "", serviceStatus: "cancelled", details: "", sortOrder: 0 });

    // Optimistically add to UI
    setCancellations(prev => prev.map(c => {
      if (c.ID === cancellationId) {
        return {
          ...c,
          Services: [...(c.Services || []), optimisticService],
        };
      }
      return c;
    }));

    try {
      const response = await fetch(`/api/cancellations/${cancellationId}/services`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceName: newService.serviceName,
          serviceStatus: newService.serviceStatus,
          details: newService.details,
          sortOrder: 0,
        }),
      });

      if (!response.ok) throw new Error("Failed to add activity");

      // Silently refresh to get real ID
      const refreshResponse = await fetch(`/api/cancellations?activeOnly=true`);
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        setCancellations(data);
      }
    } catch (err) {
      toast.error("Failed to add activity");
      fetchCancellations(); // Revert
    }
  };

  // Remove service/activity with optimistic UI
  const handleRemoveService = async (cancellationId: number, serviceId: number) => {
    // Optimistically remove from UI
    setCancellations(prev => prev.map(c => {
      if (c.ID === cancellationId) {
        return {
          ...c,
          Services: (c.Services || []).filter(s => s.ID !== serviceId),
        };
      }
      return c;
    }));

    try {
      await fetch(`/api/cancellations/${cancellationId}/services?serviceId=${serviceId}`, {
        method: "DELETE",
      });
    } catch {
      toast.error("Failed to remove activity");
      fetchCancellations(); // Revert
    }
  };

  // Add update inline with optimistic UI
  const handleAddUpdate = async (cancellationId: number) => {
    const message = getNewUpdateMessage(cancellationId);
    if (!message.trim()) {
      toast.error("Update message is required");
      return;
    }

    // Create optimistic update with temp ID
    const tempId = Date.now();
    const optimisticUpdate: CancellationUpdate = {
      ID: tempId,
      CancellationID: cancellationId,
      Message: message,
      Timestamp: new Date().toISOString(),
    };

    // Clear form immediately
    setNewUpdateMessage(cancellationId, "");

    // Optimistically add to UI (prepend since updates are shown newest first)
    setCancellations(prev => prev.map(c => {
      if (c.ID === cancellationId) {
        return {
          ...c,
          Updates: [optimisticUpdate, ...(c.Updates || [])],
        };
      }
      return c;
    }));

    try {
      const response = await fetch(`/api/cancellations/${cancellationId}/updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) throw new Error("Failed to add update");

      // Silently refresh to get real ID and timestamp
      const refreshResponse = await fetch(`/api/cancellations?activeOnly=true`);
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        setCancellations(data);
      }
    } catch (err) {
      toast.error("Failed to add update");
      fetchCancellations(); // Revert
    }
  };

  // Delete update with optimistic UI
  const handleDeleteUpdate = async (cancellationId: number, updateId: number) => {
    // Optimistically remove from UI
    setCancellations(prev => prev.map(c => {
      if (c.ID === cancellationId) {
        return {
          ...c,
          Updates: (c.Updates || []).filter(u => u.ID !== updateId),
        };
      }
      return c;
    }));

    try {
      await fetch(`/api/cancellations/${cancellationId}/updates?updateId=${updateId}`, {
        method: "DELETE",
      });
    } catch {
      toast.error("Failed to remove update");
      fetchCancellations(); // Revert
    }
  };

  // Save label
  const handleSaveLabel = async (labelId: number) => {
    try {
      const response = await fetch("/api/cancellations/labels", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: labelId,
          english: editingLabelValue,
        }),
      });

      if (!response.ok) throw new Error("Failed to update label");

      setLabels(prev =>
        prev.map(l =>
          l.Application_Label_ID === labelId
            ? { ...l, English: editingLabelValue }
            : l
        )
      );
      setEditingLabelId(null);
      setEditingLabelValue("");
      toast.success("Label updated");
    } catch {
      toast.error("Failed to update label");
    }
  };

  // Start editing a label
  const startEditingLabel = (label: { Application_Label_ID: number; English: string }) => {
    setEditingLabelId(label.Application_Label_ID);
    setEditingLabelValue(label.English);
  };

  // Cancel editing
  const cancelEditingLabel = () => {
    setEditingLabelId(null);
    setEditingLabelValue("");
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Cancellations
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {isChurchWide
              ? "Manage campus status and service cancellations"
              : `Status for ${selectedCampus?.Congregation_Name}`}
          </p>
        </div>

        {!isChurchWide && selectedCampus && (
          <a
            href={`https://woodsidebible.org/cancellations/?campus=${selectedCampus.Congregation_Name?.toLowerCase().replace(/\s+/g, '-')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            View Widget
          </a>
        )}
      </div>

      {/* Widget Labels - Visual Preview */}
      {labels.length > 0 && (() => {
        // Helper to get label by short name
        const getLabel = (shortName: string) =>
          labels.find(l => l.Label_Name.endsWith(`.${shortName}`));

        // Editable label component
        const EditableLabel = ({
          shortName,
          className = "",
          inputClassName = "",
          multiline = false,
        }: {
          shortName: string;
          className?: string;
          inputClassName?: string;
          multiline?: boolean;
        }) => {
          const label = getLabel(shortName);
          if (!label) return null;

          const isEditing = editingLabelId === label.Application_Label_ID;
          const friendlyName = camelCaseToFriendly(shortName);

          if (isEditing) {
            return (
              <div className="relative group">
                <div className="flex items-center gap-1">
                  {multiline ? (
                    <textarea
                      value={editingLabelValue}
                      onChange={(e) => setEditingLabelValue(e.target.value)}
                      className={`w-full px-2 py-1 text-sm border-2 border-amber-400 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded focus:outline-none focus:border-amber-500 resize-none ${inputClassName}`}
                      rows={3}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.metaKey) {
                          e.preventDefault();
                          handleSaveLabel(label.Application_Label_ID);
                        } else if (e.key === 'Escape') {
                          cancelEditingLabel();
                        }
                      }}
                      autoFocus
                    />
                  ) : (
                    <input
                      type="text"
                      value={editingLabelValue}
                      onChange={(e) => setEditingLabelValue(e.target.value)}
                      className={`w-full px-2 py-1 text-sm border-2 border-amber-400 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded focus:outline-none focus:border-amber-500 ${inputClassName}`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSaveLabel(label.Application_Label_ID);
                        } else if (e.key === 'Escape') {
                          cancelEditingLabel();
                        }
                      }}
                      autoFocus
                    />
                  )}
                  <button
                    onClick={() => handleSaveLabel(label.Application_Label_ID)}
                    className="shrink-0 h-7 w-7 flex items-center justify-center bg-amber-500 text-white rounded hover:bg-amber-600"
                    title="Save"
                  >
                    <Save className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={cancelEditingLabel}
                    className="shrink-0 h-7 w-7 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                    title="Cancel"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <span className="absolute -top-5 left-0 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                  {friendlyName}
                </span>
              </div>
            );
          }

          return (
            <div className="relative group">
              <span
                onClick={() => startEditingLabel(label)}
                className={`cursor-pointer border border-transparent hover:border-amber-400 hover:border-dashed rounded px-1 -mx-1 transition-colors ${className}`}
                title={`Click to edit "${friendlyName}"`}
              >
                {label.English}
              </span>
              <span className="absolute -top-4 left-0 text-[10px] font-medium text-amber-600 dark:text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {friendlyName}
              </span>
              <Pencil className="absolute -right-4 top-1/2 -translate-y-1/2 w-3 h-3 text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          );
        };

        return (
          <div className="mb-8 border-b border-gray-200 dark:border-gray-700 pb-8">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Widget Labels
              </h2>
              <span className="text-xs text-gray-400">(click to edit)</span>
            </div>

            {/* Visual Preview Container */}
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700">
              {/* Header Section */}
              <div className="p-6 pb-4 text-right">
                <div className="flex items-center justify-end gap-2 text-gray-500 dark:text-gray-400 uppercase tracking-widest text-sm mb-1 whitespace-nowrap">
                  <svg className="w-4 h-4 text-amber-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <EditableLabel shortName="alertTitle" className="text-gray-500 dark:text-gray-400" />
                </div>
                <div className="text-4xl md:text-5xl font-bold tracking-tighter text-gray-900 dark:text-white">
                  <EditableLabel shortName="mainTitle" className="text-gray-900 dark:text-white" />
                </div>
              </div>

              {/* Alert Message */}
              <div className="px-6 pb-4 text-center">
                <div className="text-gray-500 dark:text-gray-400 uppercase tracking-widest text-sm leading-relaxed max-w-xl mx-auto">
                  <EditableLabel shortName="alertMessage" className="text-gray-500 dark:text-gray-400" multiline />
                </div>
              </div>

              {/* Sample Campus Card */}
              <div className="mx-6 mb-6">
                <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-lg overflow-hidden">
                  {/* Card Header */}
                  <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded" />
                      <span className="font-bold text-green-700 dark:text-green-400 uppercase">Sample Campus</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                      <CheckCircle className="w-4 h-4" />
                      <span className="font-medium text-sm">OPEN</span>
                    </div>
                  </div>
                  {/* Card Content */}
                  <div className="px-4 py-4 bg-white/80 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                      <div>
                        <div className="font-medium text-gray-700 dark:text-gray-200 whitespace-nowrap">
                          <EditableLabel shortName="openStatusMessage" className="text-gray-700 dark:text-gray-200" />
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                          <EditableLabel shortName="openStatusSubtext" className="text-gray-500 dark:text-gray-400" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 pb-6 text-center text-sm text-gray-500 dark:text-gray-400">
                <div className="mb-1">
                  <EditableLabel shortName="autoRefreshMessage" className="text-gray-500 dark:text-gray-400" />
                </div>
                <div className="flex items-center justify-center gap-1 whitespace-nowrap">
                  <EditableLabel shortName="lastUpdatedPrefix" className="text-gray-500 dark:text-gray-400" />
                  <span className="text-gray-400 dark:text-gray-500">Mon, Jan 26, 7:52 AM</span>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Campus Status Grid */}
      {filteredCancellations.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">No campuses found</p>
          <p className="text-sm mt-1">
            Run the seed script to initialize campus status records
          </p>
        </div>
      ) : (
        <div className={`grid gap-4 ${
          filteredCancellations.length === 1
            ? "grid-cols-1 max-w-2xl"
            : "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
        }`}>
          {[...filteredCancellations].sort((a, b) =>
            a.CongregationName.localeCompare(b.CongregationName)
          ).map((cancellation) => {
            const config = statusConfig[cancellation.Status];
            const StatusIcon = config.icon;
            const hasContent = cancellation.Status !== 'open';
            const isSaving = savingCardId === cancellation.ID;
            const isSuccess = successCardId === cancellation.ID;

            return (
              <div
                key={cancellation.ID}
                className={`group border-2 rounded-lg overflow-hidden ${config.borderColor} flex flex-col relative transition-all duration-300 ${
                  isSaving ? "opacity-75" : ""
                } ${isSuccess ? "ring-2 ring-green-500 ring-offset-2" : ""}`}
              >
                {/* Saving overlay */}
                {isSaving && (
                  <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 flex items-center justify-center z-10">
                    <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-lg">
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Saving...</span>
                    </div>
                  </div>
                )}

                {/* Success indicator */}
                {isSuccess && (
                  <div className="absolute top-2 right-2 z-10 animate-in fade-in zoom-in duration-300">
                    <div className="bg-green-500 text-white p-1.5 rounded-full shadow-lg">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                  </div>
                )}

                {/* Card Header */}
                <div className={`p-4 ${config.bgColor}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Campus SVG Icon */}
                      <div className="relative w-7 h-7 flex-shrink-0">
                        {cancellation.CampusSvgUrl ? (
                          <img
                            src={cancellation.CampusSvgUrl}
                            alt=""
                            className="w-7 h-7"
                            onError={(e) => {
                              // Hide the broken image and show fallback
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <MapPin className={`w-5 h-5 text-gray-500 dark:text-gray-400 ${cancellation.CampusSvgUrl ? 'hidden' : ''}`} />
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {cancellation.CongregationName}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleEditStatus(cancellation, e)}
                        className="p-2 hover:bg-white/50 dark:hover:bg-black/20 rounded-lg transition-colors"
                        title="Edit Status"
                        disabled={isSaving}
                      >
                        <Pencil className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                      </button>
                      <a
                        href={`https://woodsidebible.org/cancellations/?campus=${cancellation.CongregationName?.toLowerCase().replace(/\s+/g, '-')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-white/50 dark:hover:bg-black/20 rounded-lg transition-colors"
                        title="View on website"
                      >
                        <ExternalLink className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                      </a>
                      <span className={`text-sm font-medium ${config.textColor} flex items-center gap-1.5 ml-1`}>
                        <StatusIcon className="w-4 h-4" />
                        {config.label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Content - Always visible */}
                <div className="bg-white dark:bg-gray-900 flex-1 flex flex-col">
                  {/* Open Status Message */}
                  {!hasContent && (
                    <div className="p-4 flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {labels.find(l => l.Label_Name === 'customWidgets.cancellationsWidget.openStatusMessage')?.English || 'All activities are proceeding as scheduled'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {labels.find(l => l.Label_Name === 'customWidgets.cancellationsWidget.openStatusSubtext')?.English || 'No cancellations or modifications at this time'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Reason & Expected Resume */}
                  {hasContent && (cancellation.Reason || cancellation.ExpectedResumeTime) && (
                    <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                      {cancellation.Reason && (
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                          {cancellation.Reason}
                        </p>
                      )}
                      {cancellation.ExpectedResumeTime && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          Expected: {cancellation.ExpectedResumeTime}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Affected Activities */}
                  {hasContent && (
                    <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                      <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                        Affected Activities
                      </h4>

                      {cancellation.Services && cancellation.Services.length > 0 && (
                        <ul className="space-y-1.5 mb-3">
                          {cancellation.Services.map((service) => (
                            <li
                              key={service.ID}
                              className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm"
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <span
                                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                    service.ServiceStatus === "cancelled"
                                      ? "bg-red-500"
                                      : service.ServiceStatus === "modified"
                                      ? "bg-amber-500"
                                      : "bg-blue-500"
                                  }`}
                                />
                                <span className="text-gray-700 dark:text-gray-300 truncate">
                                  {service.ServiceName}
                                </span>
                                <span className="text-xs text-gray-400 capitalize flex-shrink-0">
                                  ({service.ServiceStatus})
                                </span>
                              </div>
                              <button
                                onClick={() => handleRemoveService(cancellation.ID, service.ID)}
                                className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded flex-shrink-0"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={getNewService(cancellation.ID).serviceName}
                          onChange={(e) =>
                            setNewService(cancellation.ID, { ...getNewService(cancellation.ID), serviceName: e.target.value })
                          }
                          placeholder="Add activity..."
                          className="flex-1 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddService(cancellation.ID);
                            }
                          }}
                        />
                        <select
                          value={getNewService(cancellation.ID).serviceStatus}
                          onChange={(e) =>
                            setNewService(cancellation.ID, {
                              ...getNewService(cancellation.ID),
                              serviceStatus: e.target.value as "cancelled" | "modified" | "delayed",
                            })
                          }
                          className="px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        >
                          {serviceStatusOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleAddService(cancellation.ID)}
                          className="w-8 h-8 flex items-center justify-center bg-primary text-white hover:bg-primary/90"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Status Updates - only show for non-open statuses */}
                  {hasContent && (
                    <div className="p-4 flex-1">
                      <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5" />
                        Updates
                      </h4>

                      <div className="flex gap-2 mb-3">
                        <input
                          type="text"
                          value={getNewUpdateMessage(cancellation.ID)}
                          onChange={(e) => setNewUpdateMessage(cancellation.ID, e.target.value)}
                          placeholder="Post an update..."
                          className="flex-1 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleAddUpdate(cancellation.ID);
                            }
                          }}
                        />
                        <button
                          onClick={() => handleAddUpdate(cancellation.ID)}
                          className="px-3 py-1.5 bg-primary text-white text-sm hover:bg-primary/90"
                        >
                          Post
                        </button>
                      </div>

                      {cancellation.Updates && cancellation.Updates.length > 0 ? (
                        <ul className="space-y-2 max-h-48 overflow-y-auto">
                          {cancellation.Updates.map((update) => (
                            <li
                              key={update.ID}
                              className="flex items-start justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm"
                            >
                              <div className="flex-1 min-w-0">
                                <span className="text-xs text-gray-400">
                                  {formatShortDate(update.Timestamp)}
                                </span>
                                <p className="text-gray-700 dark:text-gray-300 mt-0.5">
                                  {update.Message}
                                </p>
                              </div>
                              <button
                                onClick={() => handleDeleteUpdate(cancellation.ID, update.ID)}
                                className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded ml-2 flex-shrink-0"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-gray-400 dark:text-gray-500 italic">
                          No updates yet
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Status Modal (Simplified) */}
      {isModalOpen && editingCancellation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-lg w-full">
            <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {editingCancellation.CongregationName}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Update campus status
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Status
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {statuses.map((status) => {
                    const config = statusConfig[status.status];
                    const StatusIcon = config.icon;
                    const isSelected = formData.statusID === status.value;

                    return (
                      <button
                        key={status.value}
                        onClick={() => setFormData(prev => ({ ...prev, statusID: status.value }))}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          isSelected
                            ? `${config.borderColor} ${config.bgColor}`
                            : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                        }`}
                      >
                        <StatusIcon className={`w-6 h-6 mx-auto mb-2 ${isSelected ? config.textColor : "text-gray-400"}`} />
                        <span className={`text-sm font-medium ${isSelected ? config.textColor : "text-gray-600 dark:text-gray-300"}`}>
                          {status.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Reason & Expected Resume - only show when not Open */}
              {formData.statusID !== 1 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Reason
                    </label>
                    <textarea
                      value={formData.reason || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, reason: e.target.value }))
                      }
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder="e.g., Hazardous road conditions"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Expected Resume Time
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const newMode = resumeTimeMode === "date" ? "text" : "date";
                          setResumeTimeMode(newMode);
                          if (newMode === "text" && resumeTimeDate) {
                            setFormData(prev => ({
                              ...prev,
                              expectedResumeTime: formatResumeDate(resumeTimeDate),
                            }));
                          } else if (newMode === "date") {
                            setResumeTimeDate("");
                            setFormData(prev => ({ ...prev, expectedResumeTime: "" }));
                          }
                        }}
                        className="text-xs text-primary hover:underline"
                      >
                        {resumeTimeMode === "date" ? "Use custom text" : "Use date picker"}
                      </button>
                    </div>

                    {resumeTimeMode === "date" ? (
                      <div className="space-y-2">
                        <input
                          type="datetime-local"
                          value={resumeTimeDate}
                          onChange={(e) => {
                            setResumeTimeDate(e.target.value);
                            setFormData(prev => ({
                              ...prev,
                              expectedResumeTime: e.target.value ? formatResumeDate(e.target.value) : "",
                            }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                        {resumeTimeDate && (
                          <p className="text-sm text-gray-500">
                            Displays as: <span className="font-medium text-gray-700 dark:text-gray-300">{formatResumeDate(resumeTimeDate)}</span>
                          </p>
                        )}
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={formData.expectedResumeTime || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, expectedResumeTime: e.target.value }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        placeholder="e.g., Waiting on DTE for timeline"
                      />
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
