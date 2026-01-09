"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import Script from "next/script";
import {
  Calendar,
  MapPin,
  Search,
  AlertCircle,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Star,
  Loader2,
  X,
  Save,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useCampus } from "@/contexts/CampusContext";
import type { Announcement, AnnouncementFormData, CongregationOption } from "@/types/announcements";

function formatDate(dateString: string) {
  if (!dateString) return "N/A";

  // Handle SQL Server date formats (both "YYYY-MM-DD HH:mm:ss" and "YYYY-MM-DDTHH:mm:ss")
  const date = new Date(dateString.replace(" ", "T"));

  // Check if date is valid
  if (isNaN(date.getTime())) {
    console.error("Invalid date:", dateString);
    return "Invalid Date";
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AnnouncementsPage() {
  const { selectedCampus } = useCampus();
  const widgetRef = useRef<HTMLDivElement>(null);

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("active");
  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());
  const [widgetMode, setWidgetMode] = useState<"carousel" | "grid">(() => {
    // Load from localStorage on mount
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('announcements-widget-mode');
      return (saved === 'grid' ? 'grid' : 'carousel') as "carousel" | "grid";
    }
    return "carousel";
  });

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form data
  const [formData, setFormData] = useState<AnnouncementFormData>({
    title: "",
    body: "",
    active: true,
    topPriority: false,
    startDate: new Date().toISOString().slice(0, 16),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    sort: 10,
    congregationID: 1,
    callToActionURL: null,
    callToActionLabel: null,
    eventID: null,
    opportunityID: null,
  });

  // Dropdowns data
  const [congregations, setCongregations] = useState<CongregationOption[]>([]);
  const [relationType, setRelationType] = useState<"none" | "event" | "opportunity">("none");
  const [eventSearch, setEventSearch] = useState("");
  const [eventOptions, setEventOptions] = useState<Array<{ value: number; label: string }>>([]);
  const [opportunitySearch, setOpportunitySearch] = useState("");
  const [opportunityOptions, setOpportunityOptions] = useState<Array<{ value: number; label: string }>>([]);

  // Fetch announcements
  useEffect(() => {
    async function fetchAnnouncements() {
      try {
        setIsLoading(true);
        const params = new URLSearchParams();
        if (searchQuery) params.append("search", searchQuery);

        const response = await fetch(`/api/announcements?${params.toString()}`);
        if (!response.ok) throw new Error("Failed to fetch announcements");

        const data = await response.json();
        setAnnouncements(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    }

    fetchAnnouncements();
  }, [searchQuery]);

  // Load congregations
  useEffect(() => {
    async function loadCongregations() {
      try {
        const response = await fetch("/api/announcements/congregations");
        if (!response.ok) throw new Error("Failed to load congregations");
        const data = await response.json();
        setCongregations(data);
      } catch (err) {
        console.error("Error loading congregations:", err);
      }
    }
    loadCongregations();
  }, []);

  // Search events
  useEffect(() => {
    if (relationType !== "event" || eventSearch.length < 2) {
      setEventOptions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/announcements/events?q=${encodeURIComponent(eventSearch)}`);
        if (!response.ok) throw new Error("Failed to search events");
        const data = await response.json();
        setEventOptions(data);
      } catch (err) {
        console.error("Error searching events:", err);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [eventSearch, relationType]);

  // Search opportunities
  useEffect(() => {
    if (relationType !== "opportunity" || opportunitySearch.length < 2) {
      setOpportunityOptions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/announcements/opportunities?q=${encodeURIComponent(opportunitySearch)}`);
        if (!response.ok) throw new Error("Failed to search opportunities");
        const data = await response.json();
        setOpportunityOptions(data);
      } catch (err) {
        console.error("Error searching opportunities:", err);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [opportunitySearch, relationType]);

  // Refresh widget when campus changes
  useEffect(() => {
    // Update widget data-params attribute
    if (widgetRef.current) {
      const newParams = selectedCampus && selectedCampus.Congregation_ID !== 1
        ? `@CongregationID=${selectedCampus.Congregation_ID}`
        : "";

      widgetRef.current.setAttribute('data-params', newParams);

      // Reinitialize widget if it's already loaded
      if (typeof (window as any).ReInitWidget === 'function') {
        (window as any).ReInitWidget('announcements-widget-root');
      }
    }
  }, [selectedCampus]);

  // Update relation type and clear opposite field
  useEffect(() => {
    if (relationType === "none") {
      setFormData((prev) => ({ ...prev, eventID: null, opportunityID: null }));
    } else if (relationType === "event") {
      setFormData((prev) => ({ ...prev, opportunityID: null }));
    } else if (relationType === "opportunity") {
      setFormData((prev) => ({ ...prev, eventID: null }));
    }
  }, [relationType]);

  // Refresh widget after CRUD operations
  function refreshWidget() {
    // Use the widget's ReInitWidget function if available
    if (typeof (window as any).ReInitWidget === 'function') {
      (window as any).ReInitWidget('announcements-widget-root');
    } else {
      // Fallback to page reload
      window.location.reload();
    }
  }

  // Open modal for new announcement
  function handleNew() {
    setEditingId(null);
    setFormData({
      title: "",
      body: "",
      active: true,
      topPriority: false,
      startDate: new Date().toISOString().slice(0, 16),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      sort: 10,
      congregationID: congregations[0]?.value || 1,
      callToActionURL: null,
      callToActionLabel: null,
      eventID: null,
      opportunityID: null,
    });
    setRelationType("none");
    setIsModalOpen(true);
  }

  // Open modal for editing
  async function handleEdit(announcement: Announcement) {
    setEditingId(announcement.ID);

    // Handle null/undefined dates by providing defaults
    const startDate = announcement.StartDate
      ? new Date(announcement.StartDate).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16);

    const endDate = announcement.EndDate
      ? new Date(announcement.EndDate).toISOString().slice(0, 16)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16); // Default to 7 days from now

    setFormData({
      title: announcement.Title,
      body: announcement.Body,
      active: announcement.Active,
      topPriority: announcement.TopPriority,
      startDate: startDate,
      endDate: endDate,
      sort: announcement.Sort,
      congregationID: announcement.CongregationID,
      callToActionURL: announcement.CallToActionURL,
      callToActionLabel: announcement.CallToActionLabel,
      eventID: announcement.EventID,
      opportunityID: announcement.OpportunityID,
    });

    if (announcement.EventID) {
      setRelationType("event");
    } else if (announcement.OpportunityID) {
      setRelationType("opportunity");
    } else {
      setRelationType("none");
    }

    setIsModalOpen(true);
  }

  // Handle save
  async function handleSave() {
    // Validation
    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!formData.startDate) {
      toast.error("Start Date is required");
      return;
    }
    if (!formData.endDate) {
      toast.error("End Date is required");
      return;
    }
    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      toast.error("End Date must be after Start Date");
      return;
    }

    // Close modal immediately
    setIsModalOpen(false);

    // Add to processing set if editing (for card micro interaction)
    if (editingId) {
      setProcessingIds((prev) => new Set(prev).add(editingId));
    }

    try {
      const url = editingId ? `/api/announcements/${editingId}` : "/api/announcements";
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save announcement");
      }

      toast.success(
        editingId
          ? `"${formData.title}" updated successfully`
          : `"${formData.title}" created successfully`
      );

      // Refresh announcements list
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      const fetchResponse = await fetch(`/api/announcements?${params.toString()}`);
      if (fetchResponse.ok) {
        const data = await fetchResponse.json();
        setAnnouncements(data);
      }

      // Refresh widget
      refreshWidget();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save announcement");
    } finally {
      // Remove from processing set
      if (editingId) {
        setProcessingIds((prev) => {
          const next = new Set(prev);
          next.delete(editingId);
          return next;
        });
      }
    }
  }

  // Render announcement card
  function renderAnnouncementCard(announcement: Announcement) {
    return (
      <div className="flex flex-col md:flex-row gap-6">
        {/* Image or Fallback */}
        <div className="flex-shrink-0 relative">
          {announcement.ImageURL ? (
            <img
              src={announcement.ImageURL}
              alt={announcement.Title}
              className="w-full md:w-48 h-32 object-cover rounded-lg"
            />
          ) : (
            <div
              className="w-full md:w-48 h-32 grid place-items-center p-4 rounded-lg relative"
              style={{
                backgroundColor: '#1c2b39',
                backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20'%3E%3Ccircle cx='2' cy='2' r='1' fill='%23ffffff' fill-opacity='0.15'/%3E%3Ccircle cx='12' cy='12' r='1' fill='%23ffffff' fill-opacity='0.25'/%3E%3C/svg%3E\")",
                backgroundRepeat: 'repeat',
                backgroundSize: '20px 20px',
              }}
            >
              <div
                className="absolute inset-0 rounded-lg"
                style={{
                  outline: '1px solid rgba(255, 255, 255, 0.95)',
                  outlineOffset: '-10px'
                }}
              />
              <span className="text-white font-extrabold uppercase leading-tight text-center tracking-tight relative z-10" style={{ fontSize: 'clamp(0.875rem, 4vw, 1.125rem)' }}>
                {announcement.Title}
              </span>
            </div>
          )}

          {/* Badge Overlay */}
          <div className="absolute top-2 left-2 flex items-center gap-2">
            {announcement.TopPriority && (
              <Star className="w-5 h-5 text-yellow-500 fill-current drop-shadow-md" />
            )}
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full shadow-md ${
                announcement.Status === "active"
                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                  : announcement.Status === "scheduled"
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                  : announcement.Status === "expired"
                  ? "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
                  : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
              }`}
            >
              {announcement.Status}
            </span>
            {!announcement.Active && (
              <EyeOff className="w-5 h-5 text-white drop-shadow-md" />
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1">
              {announcement.CallToActionLabel && (
                <h3 className="text-lg font-bold text-foreground mb-2">
                  {announcement.CallToActionLabel}
                </h3>
              )}

              {announcement.Body && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {announcement.Body}
                </p>
              )}

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {formatDate(announcement.StartDate)} - {formatDate(announcement.EndDate)}
                  </span>
                </div>
                {announcement.EventTitle && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 px-2 py-1 rounded">
                      Event: {announcement.EventTitle}
                    </span>
                  </div>
                )}
                {announcement.OpportunityTitle && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 px-2 py-1 rounded">
                      Serve: {announcement.OpportunityTitle}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(announcement)}
                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                title="Edit"
              >
                <Pencil className="w-5 h-5" />
              </button>
              <button
                onClick={() =>
                  handleDelete(announcement.ID, announcement.Title)
                }
                disabled={processingIds.has(announcement.ID)}
                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Delete"
              >
                {processingIds.has(announcement.ID) ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Trash2 className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Handle delete with optimistic UI
  async function handleDelete(id: number, title: string) {
    if (!confirm("Are you sure you want to delete this announcement?")) {
      return;
    }

    // Mark as processing and optimistically remove from UI
    setProcessingIds((prev) => new Set(prev).add(id));
    const previousAnnouncements = announcements;
    setAnnouncements((prev) => prev.filter((a) => a.ID !== id));

    try {
      const response = await fetch(`/api/announcements/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete announcement");

      toast.success(`"${title}" deleted successfully`);

      // Refresh widget
      refreshWidget();
    } catch (err) {
      // Restore on error
      setAnnouncements(previousAnnouncements);
      toast.error(
        err instanceof Error ? err.message : "Failed to delete announcement"
      );
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  // Filter announcements by status and campus
  const filteredAnnouncements = announcements.filter((announcement) => {
    // Filter by status
    if (filterStatus !== "all" && announcement.Status !== filterStatus) {
      return false;
    }

    // Always show Church-Wide announcements (Congregation_ID = 1)
    if (announcement.CongregationID === 1) {
      return true;
    }

    // Show campus-specific announcements only if they match selected campus
    if (selectedCampus) {
      return announcement.CongregationID === selectedCampus.Congregation_ID;
    }

    return true;
  });

  // Separate Church-Wide and Campus-specific announcements
  // Sort to match stored procedure: Top_Priority DESC, Sort ASC, Announcement_Start_Date ASC, Announcement_ID ASC
  const sortAnnouncements = (announcements: Announcement[]) => {
    return [...announcements].sort((a, b) => {
      // 1. Top Priority (DESC - true/1 comes before false/0)
      if (a.TopPriority !== b.TopPriority) {
        return b.TopPriority ? 1 : -1;
      }

      // 2. Sort (ASC - lower numbers first)
      if (a.Sort !== b.Sort) {
        return a.Sort - b.Sort;
      }

      // 3. Start Date (ASC - earlier dates first)
      const dateA = new Date(a.StartDate).getTime();
      const dateB = new Date(b.StartDate).getTime();
      if (dateA !== dateB) {
        return dateA - dateB;
      }

      // 4. ID (ASC - lower IDs first)
      return a.ID - b.ID;
    });
  };

  const churchWideAnnouncements = sortAnnouncements(
    filteredAnnouncements.filter((a) => a.CongregationID === 1)
  );
  const campusAnnouncements = sortAnnouncements(
    filteredAnnouncements.filter((a) => a.CongregationID !== 1)
  );

  // Count by status (using all announcements for accurate counts)
  const statusCounts = announcements.reduce((acc, a) => {
    acc[a.Status || "active"] = (acc[a.Status || "active"] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 max-w-[1600px]">
        <div className="flex justify-between items-center mb-8">
          <div>
            <Skeleton className="h-9 w-48 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>
          <Skeleton className="h-12 w-48" />
        </div>
        <Skeleton className="h-12 w-full mb-6" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 max-w-[1600px]">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-600 dark:text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-red-900 dark:text-red-200 mb-2">
            Failed to Load Announcements
          </h3>
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 max-w-[1600px]">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-primary dark:text-foreground">
            announcements
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage church-wide and campus-specific announcements
          </p>
        </div>
        <button
          onClick={handleNew}
          className="inline-flex items-center gap-2 bg-[#61BC47] hover:bg-[#4fa037] text-white px-6 py-3 rounded-lg font-semibold transition-colors shadow-sm hover:shadow-md"
        >
          <Plus className="w-5 h-5" />
          New Announcement
        </button>
      </div>

      {/* Widget Toggle and Display */}
      <div className="mb-8">
        {/* View Toggle */}
        <div className="mb-6 flex justify-center">
          <button
            onClick={() => {
              const newMode = widgetMode === "carousel" ? "grid" : "carousel";
              setWidgetMode(newMode);

              // Save to localStorage
              localStorage.setItem('announcements-widget-mode', newMode);

              // Update the widget container attribute and reinitialize
              if (widgetRef.current) {
                widgetRef.current.setAttribute('data-mode', newMode);

                // Use the widget's ReInitWidget function if available
                if (typeof (window as any).ReInitWidget === 'function') {
                  (window as any).ReInitWidget('announcements-widget-root');
                }
              }
            }}
            className="relative w-full md:w-auto md:min-w-[320px] inline-flex rounded-xl bg-zinc-100 dark:bg-zinc-800 p-1 shadow-inner cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            {/* Sliding background indicator */}
            <div
              className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-[#61BC47] rounded-lg shadow-md transition-all duration-300 ease-in-out pointer-events-none ${
                widgetMode === "carousel" ? "left-1" : "left-[calc(50%+4px-1px)]"
              }`}
            />

            {/* Labels */}
            <div
              className={`relative z-10 flex-1 py-2.5 rounded-lg font-medium text-center transition-all duration-300 pointer-events-none ${
                widgetMode === "carousel"
                  ? "text-white"
                  : "text-muted-foreground"
              }`}
            >
              Carousel
            </div>
            <div
              className={`relative z-10 flex-1 py-2.5 rounded-lg font-medium text-center transition-all duration-300 pointer-events-none ${
                widgetMode === "grid"
                  ? "text-white"
                  : "text-muted-foreground"
              }`}
            >
              Grid
            </div>
          </button>
        </div>

        {/* Widget Container */}
        <div
          ref={widgetRef}
          id="announcements-widget-root"
          data-mode={widgetMode}
          data-params={
            selectedCampus && selectedCampus.Congregation_ID !== 1
              ? `@CongregationID=${selectedCampus.Congregation_ID}`
              : ""
          }
        ></div>
      </div>

      {/* Widget Script */}
      <Script
        src="https://announcements-widget.vercel.app/widget/announcements-widget.js"
        strategy="afterInteractive"
        onLoad={() => {
          console.log("Widget script loaded");
          if ((window as any).initAnnouncementsWidget) {
            (window as any).initAnnouncementsWidget();
          }
        }}
      />

      {/* Search and Filter */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search announcements by title, body, campus..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#61bc47]"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto">
          {[
            { value: "all", label: "All", count: announcements.length },
            { value: "active", label: "Active", count: statusCounts.active || 0 },
            { value: "scheduled", label: "Scheduled", count: statusCounts.scheduled || 0 },
            { value: "inactive", label: "Inactive", count: statusCounts.inactive || 0 },
            { value: "expired", label: "Expired", count: statusCounts.expired || 0 },
          ].map((status) => (
            <button
              key={status.value}
              onClick={() => setFilterStatus(status.value)}
              className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                filterStatus === status.value
                  ? "bg-[#61BC47] text-white"
                  : "bg-card border border-border text-foreground hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              {status.label} ({status.count})
            </button>
          ))}
        </div>
      </div>

      {/* Announcements List */}
      {filteredAnnouncements.length === 0 ? (
        <div className="bg-card border-2 border-dashed border-border rounded-lg p-12 text-center">
          <h3 className="text-xl font-semibold text-foreground mb-2">
            {searchQuery || filterStatus !== "all"
              ? "No announcements found"
              : "No announcements yet"}
          </h3>
          <p className="text-muted-foreground mb-6">
            {searchQuery || filterStatus !== "all"
              ? "Try adjusting your search or filters"
              : "Create your first announcement to get started"}
          </p>
          {!searchQuery && filterStatus === "all" && (
            <button
              onClick={handleNew}
              className="inline-block bg-[#61BC47] hover:bg-[#4fa037] text-white px-6 py-3 rounded-lg font-semibold transition-colors shadow-sm hover:shadow-md"
            >
              Create Announcement
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Church-Wide Announcements */}
          {churchWideAnnouncements.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-[#61BC47]" />
                Church-Wide Announcements
              </h3>
              <div className="space-y-4">
                {churchWideAnnouncements.map((announcement) => (
                  <div
                    key={announcement.ID}
                    className={`bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-all ${
                      processingIds.has(announcement.ID)
                        ? "opacity-50 scale-[0.98] pointer-events-none"
                        : ""
                    }`}
                  >
                    {renderAnnouncementCard(announcement)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Campus-Specific Announcements */}
          {campusAnnouncements.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#61BC47]" />
                {selectedCampus?.Congregation_Name || "Campus"} Announcements
              </h3>
              <div className="space-y-4">
                {campusAnnouncements.map((announcement) => (
                  <div
                    key={announcement.ID}
                    className={`bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-all ${
                      processingIds.has(announcement.ID)
                        ? "opacity-50 scale-[0.98] pointer-events-none"
                        : ""
                    }`}
                  >
                    {renderAnnouncementCard(announcement)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background border border-border rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-background border-b border-border px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-foreground">
                {editingId ? "Edit Announcement" : "New Announcement"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                disabled={isSaving}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#61bc47]"
                  disabled={isSaving}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Note: Title only displays on the card when no image is available
                </p>
              </div>

              {/* Call to Action Section */}
              <div className="border border-border rounded-lg p-4 space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Call to Action</h3>

                {/* Heading */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Heading
                  </label>
                  <input
                    type="text"
                    value={formData.callToActionLabel || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        callToActionLabel: e.target.value || null,
                      }))
                    }
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#61bc47]"
                    disabled={isSaving}
                  />
                </div>

                {/* Sub Heading */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Sub Heading
                  </label>
                  <textarea
                    value={formData.body || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, body: e.target.value || null }))
                    }
                    rows={3}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#61bc47]"
                    disabled={isSaving}
                  />
                </div>

                {/* URL */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    URL
                  </label>
                  <input
                    type="url"
                    value={formData.callToActionURL || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        callToActionURL: e.target.value || null,
                      }))
                    }
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#61bc47]"
                    disabled={isSaving}
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, startDate: e.target.value }))
                    }
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#61bc47]"
                    disabled={isSaving}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, endDate: e.target.value }))
                    }
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#61bc47]"
                    disabled={isSaving}
                  />
                </div>
              </div>

              {/* Campus */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Campus <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.congregationID}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      congregationID: parseInt(e.target.value),
                    }))
                  }
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#61bc47]"
                  disabled={isSaving}
                >
                  {congregations.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Related To Dropdown */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Related To
                </label>
                <select
                  value={relationType}
                  onChange={(e) =>
                    setRelationType(e.target.value as "none" | "event" | "opportunity")
                  }
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#61bc47]"
                  disabled={isSaving}
                >
                  <option value="none">None</option>
                  <option value="event">Event</option>
                  <option value="opportunity">Opportunity</option>
                </select>
              </div>

              {/* Event Search */}
              {relationType === "event" && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Search Event
                  </label>
                  <input
                    type="text"
                    value={eventSearch}
                    onChange={(e) => setEventSearch(e.target.value)}
                    placeholder="Type to search events..."
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#61bc47] mb-2"
                    disabled={isSaving}
                  />
                  {eventOptions.length > 0 && (
                    <select
                      value={formData.eventID || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          eventID: e.target.value ? parseInt(e.target.value) : null,
                        }))
                      }
                      className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#61bc47]"
                      disabled={isSaving}
                    >
                      <option value="">Select an event...</option>
                      {eventOptions.map((e) => (
                        <option key={e.value} value={e.value}>
                          {e.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Opportunity Search */}
              {relationType === "opportunity" && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Search Opportunity
                  </label>
                  <input
                    type="text"
                    value={opportunitySearch}
                    onChange={(e) => setOpportunitySearch(e.target.value)}
                    placeholder="Type to search opportunities..."
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#61bc47] mb-2"
                    disabled={isSaving}
                  />
                  {opportunityOptions.length > 0 && (
                    <select
                      value={formData.opportunityID || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          opportunityID: e.target.value ? parseInt(e.target.value) : null,
                        }))
                      }
                      className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#61bc47]"
                      disabled={isSaving}
                    >
                      <option value="">Select an opportunity...</option>
                      {opportunityOptions.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Sort Order */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Sort Order
                </label>
                <input
                  type="number"
                  value={formData.sort}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      sort: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#61bc47]"
                  disabled={isSaving}
                />
              </div>

              {/* Checkboxes */}
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, active: e.target.checked }))
                    }
                    className="w-5 h-5 text-[#61bc47] border-border rounded focus:ring-[#61bc47]"
                    disabled={isSaving}
                  />
                  <span className="text-sm font-medium text-foreground">Active</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.topPriority}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, topPriority: e.target.checked }))
                    }
                    className="w-5 h-5 text-[#61bc47] border-border rounded focus:ring-[#61bc47]"
                    disabled={isSaving}
                  />
                  <span className="text-sm font-medium text-foreground">Top Priority</span>
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-background border-t border-border px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2 border border-border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center gap-2 bg-[#61BC47] hover:bg-[#4fa037] text-white px-6 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
