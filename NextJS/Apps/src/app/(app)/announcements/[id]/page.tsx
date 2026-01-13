"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
  Calendar,
  MapPin,
  Link as LinkIcon,
  Eye,
  EyeOff,
  Star,
  X,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Announcement, AnnouncementFormData, CongregationOption } from "@/types/announcements";

export default function AnnouncementEditPage() {
  const router = useRouter();
  const params = useParams();
  const isNew = params.id === "new";
  const announcementId = isNew ? null : parseInt(params.id as string);

  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

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
  const [relationType, setRelationType] = useState<"none" | "event" | "opportunity">("event");
  const [eventSearch, setEventSearch] = useState("");
  const [eventOptions, setEventOptions] = useState<Array<{ value: number; label: string }>>([]);
  const [opportunitySearch, setOpportunitySearch] = useState("");
  const [opportunityOptions, setOpportunityOptions] = useState<Array<{ value: number; label: string }>>([]);

  // Preview data
  const [previewData, setPreviewData] = useState<Announcement | null>(null);

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

  // Load announcement if editing
  useEffect(() => {
    if (isNew) return;

    async function loadAnnouncement() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/announcements/${announcementId}`);
        if (!response.ok) throw new Error("Failed to load announcement");

        const data: Announcement = await response.json();

        // Convert to form data
        setFormData({
          title: data.Title,
          body: data.Body,
          active: data.Active,
          topPriority: data.TopPriority,
          startDate: new Date(data.StartDate).toISOString().slice(0, 16),
          endDate: new Date(data.EndDate).toISOString().slice(0, 16),
          sort: data.Sort,
          congregationID: data.CongregationID,
          callToActionURL: data.CallToActionURL,
          callToActionLabel: data.CallToActionLabel,
          eventID: data.EventID,
          opportunityID: data.OpportunityID,
        });

        // Set relation type
        if (data.EventID) {
          setRelationType("event");
        } else if (data.OpportunityID) {
          setRelationType("opportunity");
        } else {
          setRelationType("none");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load announcement");
      } finally {
        setIsLoading(false);
      }
    }

    loadAnnouncement();
  }, [isNew, announcementId]);

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

  // Generate preview
  async function handlePreview() {
    if (!formData.title || !formData.startDate || !formData.endDate) {
      toast.error("Please fill in required fields (Title, Start Date, End Date) before previewing");
      return;
    }

    // Create mock preview data
    const mockPreview: Announcement = {
      ID: announcementId || 0,
      Title: formData.title,
      Body: formData.body,
      Active: formData.active,
      TopPriority: formData.topPriority,
      StartDate: formData.startDate,
      EndDate: formData.endDate,
      Sort: formData.sort,
      CongregationID: formData.congregationID,
      CongregationName: congregations.find((c) => c.value === formData.congregationID)?.label || "",
      CallToActionURL: formData.callToActionURL,
      CallToActionLabel: formData.callToActionLabel,
      EventID: formData.eventID,
      OpportunityID: formData.opportunityID,
      ImageURL: null,
      ComputedLink: formData.callToActionURL || "#",
      ComputedHeading: formData.callToActionLabel || formData.title,
      Status: formData.active ? "active" : "inactive",
    };

    setPreviewData(mockPreview);
    setShowPreview(true);
  }

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

    try {
      setIsSaving(true);
      setError(null);

      const url = isNew ? "/api/announcements" : `/api/announcements/${announcementId}`;
      const method = isNew ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save announcement");
      }

      // Show success toast
      toast.success(
        isNew
          ? `"${formData.title}" created successfully`
          : `"${formData.title}" updated successfully`
      );

      // Redirect to list
      router.push("/announcements");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to save announcement";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 max-w-[1200px]">
        <Skeleton className="h-10 w-48 mb-8" />
        <div className="space-y-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </div>
    );
  }

  if (error && !isNew) {
    return (
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 max-w-[1200px]">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-600 dark:text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-red-900 dark:text-red-200 mb-2">
            Failed to Load Announcement
          </h3>
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 max-w-[1200px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/announcements"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-3xl font-bold text-primary dark:text-foreground">
            {isNew ? "New Announcement" : "Edit Announcement"}
          </h1>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handlePreview}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <Eye className="w-5 h-5" />
            Preview
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 bg-[#61BC47] hover:bg-[#4fa037] text-white px-6 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Form */}
      <div className="bg-card border border-border rounded-lg p-6 space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#61bc47]"
            placeholder="e.g., Baptism anytime"
            required
          />
          <p className="text-xs text-muted-foreground mt-1">
            Note: Title only displays on the card when no image is available
          </p>
        </div>

        {/* Congregation */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Campus <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.congregationID}
            onChange={(e) => setFormData({ ...formData, congregationID: parseInt(e.target.value) })}
            className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#61bc47]"
            required
          >
            {congregations.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Dates */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              When do you want to start announcing this? <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#61bc47]"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              When do you want to stop announcing this? <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#61bc47]"
              required
            />
          </div>
        </div>

        {/* Relationship Type - Mutually Exclusive */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Related To
          </label>
          <div className="flex gap-4 mb-4">
            {[
              { value: "none", label: "None" },
              { value: "event", label: "Event" },
              { value: "opportunity", label: "Serve Opportunity" },
            ].map((option) => (
              <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value={option.value}
                  checked={relationType === option.value}
                  onChange={(e) => setRelationType(e.target.value as any)}
                  className="w-4 h-4 text-[#61BC47] border-border focus:ring-[#61bc47]"
                />
                <span className="text-sm text-foreground">{option.label}</span>
              </label>
            ))}
          </div>

          {/* Event Search */}
          {relationType === "event" && (
            <div className="space-y-2">
              <input
                type="text"
                value={eventSearch}
                onChange={(e) => setEventSearch(e.target.value)}
                placeholder="Search for an event..."
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#61bc47]"
              />
              {eventOptions.length > 0 && (
                <select
                  value={formData.eventID || ""}
                  onChange={(e) => setFormData({ ...formData, eventID: parseInt(e.target.value) || null })}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#61bc47]"
                >
                  <option value="">Select an event</option>
                  {eventOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Opportunity Search */}
          {relationType === "opportunity" && (
            <div className="space-y-2">
              <input
                type="text"
                value={opportunitySearch}
                onChange={(e) => setOpportunitySearch(e.target.value)}
                placeholder="Search for a serve opportunity..."
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#61bc47]"
              />
              {opportunityOptions.length > 0 && (
                <select
                  value={formData.opportunityID || ""}
                  onChange={(e) => setFormData({ ...formData, opportunityID: parseInt(e.target.value) || null })}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#61bc47]"
                >
                  <option value="">Select an opportunity</option>
                  {opportunityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>

        {/* Call to Action */}
        <div className="border-t border-border pt-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Call to Action</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Link
              </label>
              <input
                type="url"
                value={formData.callToActionURL || ""}
                onChange={(e) => setFormData({ ...formData, callToActionURL: e.target.value || null })}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#61bc47]"
                placeholder="https://woodsidebible.org/baptism"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Heading
              </label>
              <input
                type="text"
                value={formData.callToActionLabel || ""}
                onChange={(e) => setFormData({ ...formData, callToActionLabel: e.target.value || null })}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#61bc47]"
                placeholder="Learn More"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Sub Heading
              </label>
              <textarea
                value={formData.body || ""}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#61bc47]"
                placeholder="Additional description or details..."
              />
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="border-t border-border pt-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-4 h-4 text-[#61BC47] border-border rounded focus:ring-[#61bc47]"
                />
                <span className="text-sm font-medium text-foreground">Active</span>
              </label>
              <span className="text-xs text-muted-foreground">
                Turn on to publish this announcement
              </span>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.topPriority}
                  onChange={(e) => setFormData({ ...formData, topPriority: e.target.checked })}
                  className="w-4 h-4 text-[#61BC47] border-border rounded focus:ring-[#61bc47]"
                />
                <span className="text-sm font-medium text-foreground">Top Priority</span>
              </label>
              <span className="text-xs text-muted-foreground">
                Pin to top of all announcements
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Sort Order <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.sort}
                onChange={(e) => setFormData({ ...formData, sort: parseInt(e.target.value) || 10 })}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#61bc47]"
                min="0"
                step="1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Lower numbers appear first (default: 10)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && previewData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground">Preview</h2>
                <button
                  onClick={() => setShowPreview(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-foreground">{previewData.Title}</h3>
                  {previewData.TopPriority && (
                    <Star className="w-5 h-5 text-yellow-500 fill-current" />
                  )}
                  {!previewData.Active && (
                    <EyeOff className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>

                {previewData.Body && (
                  <p className="text-sm text-muted-foreground">{previewData.Body}</p>
                )}

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{previewData.CongregationName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {new Date(previewData.StartDate).toLocaleDateString()} -{" "}
                      {new Date(previewData.EndDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {previewData.CallToActionURL && (
                  <div className="flex items-center gap-2">
                    <LinkIcon className="w-4 h-4" />
                    <a
                      href={previewData.CallToActionURL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#61BC47] hover:underline"
                    >
                      {previewData.CallToActionLabel || "Learn More"}
                    </a>
                  </div>
                )}

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-6">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    This is how your announcement will appear on the website. The actual image will
                    be pulled from the related event or opportunity.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
