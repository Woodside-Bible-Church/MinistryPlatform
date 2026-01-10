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
  Church,
  Upload,
  Image as ImageIcon,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useCampus } from "@/contexts/CampusContext";
import { useTheme } from "next-themes";
import type { Announcement, AnnouncementFormData, CongregationOption } from "@/types/announcements";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableAnnouncementCard } from "@/components/SortableAnnouncementCard";

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
  const { resolvedTheme } = useTheme();
  const widgetRef = useRef<HTMLDivElement>(null);
  const [svgLoaded, setSvgLoaded] = useState(false);
  const [svgError, setSvgError] = useState(false);

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [eventSearch, setEventSearch] = useState("");
  const [eventSearchLoading, setEventSearchLoading] = useState(false);
  const [eventOptions, setEventOptions] = useState<Array<{
    value: number;
    label: string;
    startDate: string;
    endDate: string;
    congregationName: string;
    link: string;
    imageUrl: string | null;
  }>>([]);
  const [opportunitySearch, setOpportunitySearch] = useState("");
  const [opportunitySearchLoading, setOpportunitySearchLoading] = useState(false);
  const [opportunityOptions, setOpportunityOptions] = useState<Array<{
    value: number;
    label: string;
    shiftStart: string;
    shiftEnd: string;
    programName: string;
    congregationName: string;
    groupName: string | null;
    minimumNeeded: number;
    maximumNeeded: number;
  }>>([]);

  // Drag-and-drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
      setEventSearchLoading(false);
      return;
    }

    setEventSearchLoading(true);
    const timer = setTimeout(async () => {
      try {
        console.log("Searching events with query:", eventSearch);
        const response = await fetch(
          `/api/announcements/events?q=${encodeURIComponent(eventSearch)}&congregationID=${formData.congregationID}`
        );
        console.log("Events API response status:", response.status);

        if (!response.ok) {
          const errorData = await response.json();
          console.error("Events API error:", errorData);
          throw new Error(errorData.error || "Failed to search events");
        }

        const data = await response.json();
        console.log("Events data received:", data);

        // Ensure data is an array
        if (Array.isArray(data)) {
          setEventOptions(data);
        } else {
          console.error("Events API returned non-array:", data);
          setEventOptions([]);
        }
      } catch (err) {
        console.error("Error searching events:", err);
        toast.error(err instanceof Error ? err.message : "Failed to search events");
        setEventOptions([]);
      } finally {
        setEventSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [eventSearch, relationType, formData.congregationID]);

  // Search opportunities
  useEffect(() => {
    if (relationType !== "opportunity" || opportunitySearch.length < 2) {
      setOpportunityOptions([]);
      setOpportunitySearchLoading(false);
      return;
    }

    setOpportunitySearchLoading(true);
    const timer = setTimeout(async () => {
      try {
        console.log("Searching opportunities with query:", opportunitySearch);
        const response = await fetch(
          `/api/announcements/opportunities?q=${encodeURIComponent(opportunitySearch)}&congregationID=${formData.congregationID}`
        );
        console.log("Opportunities API response status:", response.status);

        if (!response.ok) {
          const errorData = await response.json();
          console.error("Opportunities API error:", errorData);
          throw new Error(errorData.error || "Failed to search opportunities");
        }

        const data = await response.json();
        console.log("Opportunities data received:", data);

        // Ensure data is an array
        if (Array.isArray(data)) {
          setOpportunityOptions(data);
        } else {
          console.error("Opportunities API returned non-array:", data);
          setOpportunityOptions([]);
        }
      } catch (err) {
        console.error("Error searching opportunities:", err);
        toast.error(err instanceof Error ? err.message : "Failed to search opportunities");
        setOpportunityOptions([]);
      } finally {
        setOpportunitySearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [opportunitySearch, relationType, formData.congregationID]);

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

  // Update widget theme when site theme changes
  useEffect(() => {
    if (widgetRef.current && resolvedTheme) {
      // Update the data-theme attribute
      widgetRef.current.setAttribute('data-theme', resolvedTheme);

      // Programmatically update the theme if widget is loaded
      if (typeof (window as any).SetWidgetTheme === 'function') {
        (window as any).SetWidgetTheme('announcements-widget-root', resolvedTheme);
      }
    }
  }, [resolvedTheme]);

  // Update relation type and clear opposite field
  useEffect(() => {
    if (relationType === "none") {
      setFormData((prev) => ({ ...prev, eventID: null, opportunityID: null }));
    } else if (relationType === "event") {
      setFormData((prev) => ({ ...prev, opportunityID: null }));
      setSelectedFile(null); // Clear file when switching to event
    } else if (relationType === "opportunity") {
      setFormData((prev) => ({ ...prev, eventID: null }));
      setSelectedFile(null); // Clear file when switching to opportunity
    }
  }, [relationType]);

  // Recalculate sort number when congregation changes (for new announcements only)
  useEffect(() => {
    // Only recalculate for new announcements, not when editing
    if (editingId !== null || !isModalOpen) return;

    const existingInCongregation = announcements.filter(
      (a) => a.CongregationID === formData.congregationID
    );
    const maxSort = existingInCongregation.length > 0
      ? Math.max(...existingInCongregation.map((a) => a.Sort))
      : 0;

    setFormData((prev) => ({ ...prev, sort: maxSort + 1 }));
  }, [formData.congregationID, editingId, isModalOpen, announcements]);

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

    // Use the currently selected campus, or default to Church-Wide (ID = 1)
    const defaultCongregation = selectedCampus?.Congregation_ID || 1;
    const existingInCongregation = announcements.filter(
      (a) => a.CongregationID === defaultCongregation
    );
    const maxSort = existingInCongregation.length > 0
      ? Math.max(...existingInCongregation.map((a) => a.Sort))
      : 0;

    setFormData({
      title: "",
      body: "",
      active: true,
      topPriority: false,
      startDate: new Date().toISOString().slice(0, 16),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      sort: maxSort + 1,
      congregationID: defaultCongregation,
      callToActionURL: null,
      callToActionLabel: null,
      eventID: null,
      opportunityID: null,
    });
    setRelationType("none");
    // Clear search states
    setEventSearch("");
    setEventOptions([]);
    setOpportunitySearch("");
    setOpportunityOptions([]);
    setSelectedFile(null);
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
      // Pre-populate event search with event title to trigger search
      if (announcement.EventTitle) {
        setEventSearch(announcement.EventTitle);
      }
    } else if (announcement.OpportunityID) {
      setRelationType("opportunity");
      // Pre-populate opportunity search with opportunity title
      if (announcement.OpportunityTitle) {
        setOpportunitySearch(announcement.OpportunityTitle);
      }
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

      // Ensure proper IDs are cleared based on relation type
      const dataToSave = { ...formData };
      if (relationType === "none") {
        dataToSave.eventID = null;
        dataToSave.opportunityID = null;
      } else if (relationType === "event") {
        dataToSave.opportunityID = null;
      } else if (relationType === "opportunity") {
        dataToSave.eventID = null;
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSave),
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
        <div className="flex-shrink-0 relative w-full md:w-48 aspect-video md:aspect-auto md:h-32">
          {announcement.ImageURL ? (
            <img
              src={announcement.ImageURL}
              alt={announcement.Title}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <div
              className="w-full h-full grid place-items-center p-4 rounded-lg relative"
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
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex items-start justify-between gap-4 mb-3 flex-1">
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

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>
                  {formatDate(announcement.StartDate)}
                  {formatDate(announcement.EndDate) === "N/A"
                    ? " - Ongoing"
                    : ` - ${formatDate(announcement.EndDate)}`
                  }
                </span>
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

          {/* Event/Opportunity badges at bottom */}
          {(announcement.EventTitle || announcement.OpportunityTitle) && (
            <div className="flex flex-wrap gap-2 mt-2">
              {announcement.EventTitle && (
                <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 px-2 py-1 rounded">
                  Event: {announcement.EventTitle}
                </span>
              )}
              {announcement.OpportunityTitle && (
                <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 px-2 py-1 rounded">
                  Serve: {announcement.OpportunityTitle}
                </span>
              )}
            </div>
          )}
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

  // Handle drag end for reordering
  async function handleDragEnd(event: DragEndEvent, sectionType: "church-wide" | "campus") {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    // Get the correct section's announcements
    const sectionAnnouncements = sectionType === "church-wide"
      ? churchWideAnnouncements
      : campusAnnouncements;

    const oldIndex = sectionAnnouncements.findIndex((a) => a.ID === active.id);
    const newIndex = sectionAnnouncements.findIndex((a) => a.ID === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Optimistically update the order
    const reorderedItems = arrayMove(sectionAnnouncements, oldIndex, newIndex);

    // Recalculate sort numbers
    // Start from the lowest sort number in the section to maintain gaps
    const sortNumbers = sectionAnnouncements.map((a) => a.Sort).sort((a, b) => a - b);
    const baseSortNumber = sortNumbers[0] || 1;

    const updates = reorderedItems.map((item, index) => ({
      id: item.ID,
      sort: baseSortNumber + index,
    }));

    // Update local state optimistically
    setAnnouncements((prev) =>
      prev.map((a) => {
        const update = updates.find((u) => u.id === a.ID);
        return update ? { ...a, Sort: update.sort } : a;
      })
    );

    try {
      const response = await fetch("/api/announcements/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });

      if (!response.ok) {
        throw new Error("Failed to reorder announcements");
      }

      toast.success("Announcements reordered successfully");

      // Refresh widget
      refreshWidget();
    } catch (err) {
      // Revert on error
      toast.error(err instanceof Error ? err.message : "Failed to reorder");

      // Fetch fresh data to revert
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      const fetchResponse = await fetch(`/api/announcements?${params.toString()}`);
      if (fetchResponse.ok) {
        const data = await fetchResponse.json();
        setAnnouncements(data);
      }
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
  // Sort by: Sort ASC, Announcement_Start_Date ASC, Announcement_ID ASC
  const sortAnnouncements = (announcements: Announcement[]) => {
    return [...announcements].sort((a, b) => {
      // 1. Sort (ASC - lower numbers first)
      if (a.Sort !== b.Sort) {
        return a.Sort - b.Sort;
      }

      // 2. Start Date (ASC - earlier dates first)
      const dateA = new Date(a.StartDate).getTime();
      const dateB = new Date(b.StartDate).getTime();
      if (dateA !== dateB) {
        return dateA - dateB;
      }

      // 3. ID (ASC - lower IDs first)
      return a.ID - b.ID;
    });
  };

  const churchWideAnnouncements = sortAnnouncements(
    filteredAnnouncements.filter((a) => a.CongregationID === 1)
  );
  const campusAnnouncements = sortAnnouncements(
    filteredAnnouncements.filter((a) => a.CongregationID !== 1)
  );

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
          data-theme={resolvedTheme || "light"}
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
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search announcements by title, body, campus..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#61bc47]"
          />
        </div>

        {/* Status Filter Dropdown */}
        <div className="w-full md:w-48">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#61bc47] cursor-pointer"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="scheduled">Scheduled</option>
            <option value="inactive">Inactive</option>
            <option value="expired">Expired</option>
          </select>
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
                <Church className="w-5 h-5 text-[#61BC47]" />
                Church-Wide Announcements
              </h3>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(e) => handleDragEnd(e, "church-wide")}
              >
                <SortableContext
                  items={churchWideAnnouncements.map((a) => a.ID)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-4">
                    {churchWideAnnouncements.map((announcement) => (
                      <SortableAnnouncementCard
                        key={announcement.ID}
                        id={announcement.ID}
                        isProcessing={processingIds.has(announcement.ID)}
                      >
                        {renderAnnouncementCard(announcement)}
                      </SortableAnnouncementCard>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          )}

          {/* Campus-Specific Announcements */}
          {campusAnnouncements.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                {selectedCampus?.Campus_SVG_URL && !svgError ? (
                  <>
                    <img
                      src={selectedCampus.Campus_SVG_URL}
                      alt=""
                      className={`w-6 h-6 transition-opacity ${svgLoaded ? 'opacity-100' : 'opacity-0'}`}
                      onLoad={() => setSvgLoaded(true)}
                      onError={() => setSvgError(true)}
                      style={{ display: svgLoaded ? 'block' : 'none' }}
                    />
                    {!svgLoaded && <MapPin className="w-6 h-6 text-[#61BC47]" />}
                  </>
                ) : (
                  <MapPin className="w-6 h-6 text-[#61BC47]" />
                )}
                {selectedCampus?.Congregation_Name || "Campus"} Announcements
              </h3>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(e) => handleDragEnd(e, "campus")}
              >
                <SortableContext
                  items={campusAnnouncements.map((a) => a.ID)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-4">
                    {campusAnnouncements.map((announcement) => (
                      <SortableAnnouncementCard
                        key={announcement.ID}
                        id={announcement.ID}
                        isProcessing={processingIds.has(announcement.ID)}
                      >
                        {renderAnnouncementCard(announcement)}
                      </SortableAnnouncementCard>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
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
              {/* Campus Toggle */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  Campus <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    // Toggle between selected campus and Church-Wide (ID = 1)
                    const isChurchWide = formData.congregationID === 1;
                    const newCongregationID = isChurchWide
                      ? (selectedCampus?.Congregation_ID || 1)
                      : 1;
                    setFormData((prev) => ({
                      ...prev,
                      congregationID: newCongregationID,
                    }));
                  }}
                  className="relative w-full inline-flex rounded-xl bg-zinc-100 dark:bg-zinc-800 p-1 shadow-inner cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                  disabled={isSaving}
                >
                  {/* Sliding background indicator */}
                  <div
                    className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-[#61BC47] rounded-lg shadow-md transition-all duration-300 ease-in-out pointer-events-none ${
                      formData.congregationID === 1 ? "left-1" : "left-[calc(50%+4px-1px)]"
                    }`}
                  />

                  {/* Labels */}
                  <div
                    className={`relative z-10 flex-1 py-2.5 rounded-lg font-medium text-center transition-all duration-300 pointer-events-none ${
                      formData.congregationID === 1
                        ? "text-white"
                        : "text-muted-foreground"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Church className="w-4 h-4" />
                      <span>Church-Wide</span>
                    </div>
                  </div>
                  <div
                    className={`relative z-10 flex-1 py-2.5 rounded-lg font-medium text-center transition-all duration-300 pointer-events-none ${
                      formData.congregationID !== 1
                        ? "text-white"
                        : "text-muted-foreground"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      {selectedCampus?.Campus_SVG_URL && !svgError ? (
                        <>
                          <img
                            src={selectedCampus.Campus_SVG_URL}
                            alt=""
                            className={`w-4 h-4 transition-opacity ${svgLoaded ? 'opacity-100' : 'opacity-0'}`}
                            onLoad={() => setSvgLoaded(true)}
                            onError={() => setSvgError(true)}
                            style={{ display: svgLoaded ? 'block' : 'none' }}
                          />
                          {!svgLoaded && <MapPin className="w-4 h-4" />}
                        </>
                      ) : (
                        <MapPin className="w-4 h-4" />
                      )}
                      <span>{selectedCampus?.Congregation_Name || "Campus"}</span>
                    </div>
                  </div>
                </button>
                <p className="text-xs text-muted-foreground mt-2">
                  Church-Wide announcements appear for all campuses
                </p>
              </div>

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
                  <input
                    type="text"
                    value={formData.body || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, body: e.target.value || null }))
                    }
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

              {/* Image Upload - only when no event/opportunity selected */}
              {relationType === "none" && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Upload Image (Optional)
                  </label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-[#61bc47] transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="hidden"
                      id="image-upload"
                      disabled={isSaving}
                    />
                    <label
                      htmlFor="image-upload"
                      className="cursor-pointer flex flex-col items-center gap-3"
                    >
                      {selectedFile ? (
                        <>
                          <ImageIcon className="w-10 h-10 text-[#61bc47]" />
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-sm font-medium text-foreground">
                              {selectedFile.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              setSelectedFile(null);
                            }}
                            className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          >
                            Remove
                          </button>
                        </>
                      ) : (
                        <>
                          <Upload className="w-10 h-10 text-muted-foreground" />
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-sm font-medium text-foreground">
                              Click to upload or drag and drop
                            </span>
                            <span className="text-xs text-muted-foreground">
                              PNG, JPG, GIF up to 10MB
                            </span>
                          </div>
                        </>
                      )}
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    If no image is uploaded or event/opportunity selected, the title will be displayed
                  </p>
                </div>
              )}

              {/* Event Search */}
              {relationType === "event" && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Event
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={eventSearch}
                      onChange={(e) => setEventSearch(e.target.value)}
                      placeholder="Type at least 2 characters to search..."
                      className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#61bc47] mb-3"
                      disabled={isSaving}
                    />
                    {eventSearchLoading && (
                      <div className="absolute right-3 top-2.5">
                        <Loader2 className="w-5 h-5 animate-spin text-[#61bc47]" />
                      </div>
                    )}
                  </div>
                  {eventSearch.length >= 2 && !eventSearchLoading && eventOptions.length === 0 && (
                    <div className="text-sm text-muted-foreground italic mb-3">
                      No events found matching "{eventSearch}"
                    </div>
                  )}
                  {eventOptions.length > 0 && (
                    <div className="border border-border rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted sticky top-0">
                          <tr>
                            <th className="text-left p-3 font-medium">ID</th>
                            <th className="text-left p-3 font-medium">Title</th>
                            <th className="text-left p-3 font-medium">Campus</th>
                            <th className="text-left p-3 font-medium">Dates</th>
                            <th className="text-left p-3 font-medium">Link</th>
                            <th className="w-16"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {eventOptions.map((event) => (
                            <tr
                              key={event.value}
                              className={`border-t border-border hover:bg-muted/50 transition-colors ${
                                formData.eventID === event.value ? "bg-[#61bc47]/10" : ""
                              }`}
                            >
                              <td className="p-3 text-muted-foreground">{event.value}</td>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  {event.imageUrl && (
                                    <img
                                      src={event.imageUrl}
                                      alt={event.label}
                                      className="w-12 h-8 object-cover rounded"
                                    />
                                  )}
                                  <span className="font-medium">{event.label}</span>
                                </div>
                              </td>
                              <td className="p-3 text-muted-foreground">{event.congregationName}</td>
                              <td className="p-3 text-muted-foreground text-xs">
                                {formatDate(event.startDate)}
                                <br />
                                to {formatDate(event.endDate)}
                              </td>
                              <td className="p-3">
                                <a
                                  href={event.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[#61bc47] hover:underline text-xs"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  View
                                </a>
                              </td>
                              <td className="p-3">
                                <button
                                  onClick={() =>
                                    setFormData((prev) => ({
                                      ...prev,
                                      eventID: event.value,
                                    }))
                                  }
                                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                                    formData.eventID === event.value
                                      ? "bg-[#61bc47] text-white"
                                      : "bg-muted hover:bg-muted/80 text-foreground"
                                  }`}
                                  disabled={isSaving}
                                >
                                  {formData.eventID === event.value ? "Selected" : "Select"}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Opportunity Search */}
              {relationType === "opportunity" && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Opportunity
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={opportunitySearch}
                      onChange={(e) => setOpportunitySearch(e.target.value)}
                      placeholder="Type at least 2 characters to search..."
                      className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#61bc47] mb-3"
                      disabled={isSaving}
                    />
                    {opportunitySearchLoading && (
                      <div className="absolute right-3 top-2.5">
                        <Loader2 className="w-5 h-5 animate-spin text-[#61bc47]" />
                      </div>
                    )}
                  </div>
                  {opportunitySearch.length >= 2 && !opportunitySearchLoading && opportunityOptions.length === 0 && (
                    <div className="text-sm text-muted-foreground italic mb-3">
                      No opportunities found matching "{opportunitySearch}"
                    </div>
                  )}
                  {opportunityOptions.length > 0 && (
                    <div className="border border-border rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted sticky top-0">
                          <tr>
                            <th className="text-left p-3 font-medium">ID</th>
                            <th className="text-left p-3 font-medium">Title</th>
                            <th className="text-left p-3 font-medium">Program</th>
                            <th className="text-left p-3 font-medium">Campus</th>
                            <th className="text-left p-3 font-medium">Dates</th>
                            <th className="text-left p-3 font-medium">Needed</th>
                            <th className="w-16"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {opportunityOptions.map((opp) => (
                            <tr
                              key={opp.value}
                              className={`border-t border-border hover:bg-muted/50 transition-colors ${
                                formData.opportunityID === opp.value ? "bg-[#61bc47]/10" : ""
                              }`}
                            >
                              <td className="p-3 text-muted-foreground">{opp.value}</td>
                              <td className="p-3">
                                <div className="font-medium">{opp.label}</div>
                                {opp.groupName && (
                                  <div className="text-xs text-muted-foreground">{opp.groupName}</div>
                                )}
                              </td>
                              <td className="p-3 text-muted-foreground text-xs">{opp.programName}</td>
                              <td className="p-3 text-muted-foreground text-xs">{opp.congregationName}</td>
                              <td className="p-3 text-muted-foreground text-xs">
                                {formatDate(opp.shiftStart)}
                                <br />
                                to {formatDate(opp.shiftEnd)}
                              </td>
                              <td className="p-3 text-muted-foreground text-xs">
                                {opp.minimumNeeded}-{opp.maximumNeeded}
                              </td>
                              <td className="p-3">
                                <button
                                  onClick={() =>
                                    setFormData((prev) => ({
                                      ...prev,
                                      opportunityID: opp.value,
                                    }))
                                  }
                                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                                    formData.opportunityID === opp.value
                                      ? "bg-[#61bc47] text-white"
                                      : "bg-muted hover:bg-muted/80 text-foreground"
                                  }`}
                                  disabled={isSaving}
                                >
                                  {formData.opportunityID === opp.value ? "Selected" : "Select"}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Active Checkbox */}
              <div>
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
