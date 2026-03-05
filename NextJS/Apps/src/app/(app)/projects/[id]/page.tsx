"use client";

import { use, useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Trash2,
  Plus,
  X,
  Calendar,
  User,
  MapPin,
  CalendarDays,
  Settings,
  LinkIcon,
  AlertCircle,
  Check,
  ChevronsUpDown,
  DollarSign,
  Ticket,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  useProject,
  useProjectCampuses,
  useProjectEvents,
  useProjectLookups,
} from "@/hooks/useProjectManagement";
import type {
  ProjectRecord,
  UpdateProjectPayload,
  CoordinatorLookup,
} from "@/types/projectManagement";

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function toInputDate(dateString: string) {
  if (!dateString) return "";
  return dateString.split("T")[0];
}

type Tab = "general" | "budget" | "rsvp" | "events" | "campuses";

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: slug } = use(params);
  const router = useRouter();

  const {
    data: project,
    isLoading: projectLoading,
    error: projectError,
    refetch: refetchProject,
  } = useProject(slug);

  const projectId = project?.Project_ID ?? null;

  const {
    data: campuses,
    isLoading: campusesLoading,
    refetch: refetchCampuses,
  } = useProjectCampuses(projectId);
  const {
    data: events,
    isLoading: eventsLoading,
    refetch: refetchEvents,
  } = useProjectEvents(projectId);
  const { data: lookups } = useProjectLookups();

  const [activeTab, setActiveTab] = useState<Tab>("general");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Edit form state
  const [formData, setFormData] = useState<Partial<UpdateProjectPayload> | null>(
    null
  );

  // Campus dialog state
  const [showAddCampus, setShowAddCampus] = useState(false);
  const [newCampusCongregationId, setNewCampusCongregationId] = useState("");

  // Coordinator combobox state
  const [coordinatorOpen, setCoordinatorOpen] = useState(false);
  const [coordinatorSearch, setCoordinatorSearch] = useState("");
  const [coordinatorResults, setCoordinatorResults] = useState<CoordinatorLookup[]>([]);
  const [coordinatorLoading, setCoordinatorLoading] = useState(false);
  const [selectedCoordinatorName, setSelectedCoordinatorName] = useState("");
  const coordinatorDebounce = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    if (project?.Coordinator_Name && !selectedCoordinatorName) {
      setSelectedCoordinatorName(project.Coordinator_Name);
    }
  }, [project, selectedCoordinatorName]);

  useEffect(() => {
    if (coordinatorDebounce.current) clearTimeout(coordinatorDebounce.current);
    if (coordinatorSearch.length < 2) {
      setCoordinatorResults([]);
      return;
    }
    setCoordinatorLoading(true);
    coordinatorDebounce.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/projects/contacts/search?q=${encodeURIComponent(coordinatorSearch)}`);
        if (res.ok) {
          setCoordinatorResults(await res.json());
        }
      } catch { /* ignore */ }
      setCoordinatorLoading(false);
    }, 300);
    return () => { if (coordinatorDebounce.current) clearTimeout(coordinatorDebounce.current); };
  }, [coordinatorSearch]);

  // Event link dialog state
  const [showLinkEvent, setShowLinkEvent] = useState(false);
  const [linkEventId, setLinkEventId] = useState("");

  // Initialize form data when project loads
  if (project && !formData) {
    setFormData({
      Project_ID: project.Project_ID,
      Project_Title: project.Project_Title,
      Project_Coordinator: project.Project_Coordinator,
      Project_Start: toInputDate(project.Project_Start),
      Project_End: toInputDate(project.Project_End),
      Project_Approved: project.Project_Approved,
      Project_Type_ID: project.Project_Type_ID,
      Slug: project.Slug,
      // Budget
      Budgets_Enabled: project.Budgets_Enabled,
      Budget_Status_ID: project.Budget_Status_ID ?? null,
      Budget_Locked: project.Budget_Locked,
      Expected_Registration_Revenue: project.Expected_Registration_Revenue ?? null,
      Expected_Discounts_Budget: project.Expected_Discounts_Budget ?? null,
      // RSVP
      RSVP_Title: project.RSVP_Title ?? null,
      RSVP_Description: project.RSVP_Description ?? null,
      RSVP_URL: project.RSVP_URL ?? null,
      RSVP_Start_Date: project.RSVP_Start_Date ?? null,
      RSVP_End_Date: project.RSVP_End_Date ?? null,
      RSVP_Is_Active: project.RSVP_Is_Active ?? null,
      RSVP_Slug: project.RSVP_Slug ?? null,
      RSVP_Confirmation_Email_Template_ID: project.RSVP_Confirmation_Email_Template_ID ?? null,
      RSVP_Reminder_Email_Template_ID: project.RSVP_Reminder_Email_Template_ID ?? null,
      RSVP_Days_To_Remind: project.RSVP_Days_To_Remind ?? null,
      RSVP_Primary_Color: project.RSVP_Primary_Color ?? null,
      RSVP_Secondary_Color: project.RSVP_Secondary_Color ?? null,
      RSVP_Accent_Color: project.RSVP_Accent_Color ?? null,
      RSVP_Background_Color: project.RSVP_Background_Color ?? null,
    });
  }

  const handleSave = async () => {
    if (!formData) return;
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const response = await fetch("/api/projects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save");
      }

      setSaveMessage("Project saved successfully");
      refetchProject();
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      setSaveMessage(
        `Error: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/projects?id=${projectId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete");
      }

      router.push("/projects");
    } catch (err) {
      console.error("Delete failed:", err);
      setIsDeleting(false);
    }
  };

  const handleAddCampus = async () => {
    if (!newCampusCongregationId) return;

    try {
      const response = await fetch(`/api/projects/${projectId}/campuses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Congregation_ID: parseInt(newCampusCongregationId, 10),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add campus");
      }

      setShowAddCampus(false);
      setNewCampusCongregationId("");
      refetchCampuses();
    } catch (err) {
      console.error("Add campus failed:", err);
    }
  };

  const handleRemoveCampus = async (campusId: number) => {
    try {
      const response = await fetch(
        `/api/projects/${projectId}/campuses?campusId=${campusId}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to remove campus");
      }

      refetchCampuses();
    } catch (err) {
      console.error("Remove campus failed:", err);
    }
  };

  const handleLinkEvent = async () => {
    if (!linkEventId) return;

    try {
      const response = await fetch(`/api/projects/${projectId}/events`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Event_ID: parseInt(linkEventId, 10),
          action: "link",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to link event");
      }

      setShowLinkEvent(false);
      setLinkEventId("");
      refetchEvents();
    } catch (err) {
      console.error("Link event failed:", err);
    }
  };

  const handleUpdateEventField = async (
    eventId: number,
    field: string,
    value: boolean
  ) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/events`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Event_ID: eventId,
          [field]: value,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update event");
      }

      refetchEvents();
    } catch (err) {
      console.error("Update event field failed:", err);
    }
  };

  const handleUnlinkEvent = async (eventId: number) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/events`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Event_ID: eventId,
          action: "unlink",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to unlink event");
      }

      refetchEvents();
    } catch (err) {
      console.error("Unlink event failed:", err);
    }
  };

  if (projectLoading) {
    return (
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 max-w-[1600px]">
        <Skeleton className="h-8 w-24 mb-6" />
        <Skeleton className="h-10 w-64 mb-2" />
        <Skeleton className="h-5 w-96 mb-8" />
        <Skeleton className="h-10 w-full max-w-md mb-8" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (projectError || !project) {
    return (
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 max-w-[1600px]">
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </Link>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-600 dark:text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-red-900 dark:text-red-200 mb-2">
            Project Not Found
          </h3>
          <p className="text-red-700 dark:text-red-300 mb-4">
            {projectError || "The project could not be loaded."}
          </p>
          <Button variant="outline" asChild>
            <Link href="/projects">Back to Projects</Link>
          </Button>
        </div>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "general", label: "General", icon: <Settings className="w-4 h-4" /> },
    { key: "budget", label: "Budget", icon: <DollarSign className="w-4 h-4" /> },
    { key: "rsvp", label: "RSVP", icon: <Ticket className="w-4 h-4" /> },
    {
      key: "events",
      label: `Events (${events.length})`,
      icon: <CalendarDays className="w-4 h-4" />,
    },
    {
      key: "campuses",
      label: `Campuses (${campuses.length})`,
      icon: <MapPin className="w-4 h-4" />,
    },
  ];

  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 max-w-[1600px]">
      {/* Back link */}
      <Link
        href="/projects"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Projects
      </Link>

      {/* Page Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-primary dark:text-foreground">
            {project.Project_Title}
          </h1>
          <p className="text-muted-foreground mt-1">
            {project.Project_Type_Name && (
              <span className="mr-3">{project.Project_Type_Name}</span>
            )}
            {project.Coordinator_Name && (
              <span>
                <User className="w-3 h-3 inline mr-1" />
                {project.Coordinator_Name}
              </span>
            )}
          </p>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Project</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete &quot;{project.Project_Title}
                &quot;? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-destructive text-white hover:bg-destructive/90"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Tabs */}
      <div className="border-b border-border mb-6">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-[#61bc47] text-[#61bc47]"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "general" && formData && (
        <div className="max-w-2xl">
          {saveMessage && (
            <div
              className={`mb-6 p-3 rounded-lg text-sm ${
                saveMessage.startsWith("Error")
                  ? "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300"
                  : "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300"
              }`}
            >
              {saveMessage}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <Label htmlFor="edit-title">Project Title</Label>
              <Input
                id="edit-title"
                value={formData.Project_Title || ""}
                onChange={(e) =>
                  setFormData((prev) =>
                    prev ? { ...prev, Project_Title: e.target.value } : prev
                  )
                }
              />
            </div>

            <div>
              <Label htmlFor="edit-slug">Slug</Label>
              <Input
                id="edit-slug"
                value={formData.Slug || ""}
                onChange={(e) =>
                  setFormData((prev) =>
                    prev ? { ...prev, Slug: e.target.value } : prev
                  )
                }
              />
            </div>

            <div>
              <Label>Coordinator</Label>
              <Popover open={coordinatorOpen} onOpenChange={setCoordinatorOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={coordinatorOpen}
                    className="w-full justify-between font-normal"
                  >
                    {selectedCoordinatorName || "Search for coordinator..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Type a name..."
                      value={coordinatorSearch}
                      onValueChange={setCoordinatorSearch}
                    />
                    <CommandList>
                      {coordinatorLoading ? (
                        <div className="py-6 text-center text-sm text-muted-foreground">Searching...</div>
                      ) : coordinatorSearch.length < 2 ? (
                        <div className="py-6 text-center text-sm text-muted-foreground">Type at least 2 characters...</div>
                      ) : coordinatorResults.length === 0 ? (
                        <CommandEmpty>No contacts found.</CommandEmpty>
                      ) : (
                        <CommandGroup>
                          {coordinatorResults.map((c) => (
                            <CommandItem
                              key={c.User_ID}
                              value={String(c.User_ID)}
                              onSelect={() => {
                                setFormData((prev) =>
                                  prev
                                    ? { ...prev, Project_Coordinator: c.User_ID }
                                    : prev
                                );
                                setSelectedCoordinatorName(c.Display_Name);
                                setCoordinatorOpen(false);
                                setCoordinatorSearch("");
                              }}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${
                                  formData.Project_Coordinator === c.User_ID
                                    ? "opacity-100"
                                    : "opacity-0"
                                }`}
                              />
                              <div>
                                <div>{c.Display_Name}</div>
                                {c.Email_Address && (
                                  <div className="text-xs text-muted-foreground">{c.Email_Address}</div>
                                )}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="edit-type">Project Type</Label>
              <select
                id="edit-type"
                value={formData.Project_Type_ID || ""}
                onChange={(e) =>
                  setFormData((prev) =>
                    prev
                      ? {
                          ...prev,
                          Project_Type_ID: parseInt(e.target.value, 10),
                        }
                      : prev
                  )
                }
                className="w-full h-9 rounded-md border bg-background px-3 text-sm"
              >
                <option value="">Select type...</option>
                {lookups?.projectTypes.map((t) => (
                  <option key={t.Project_Type_ID} value={t.Project_Type_ID}>
                    {t.Project_Type}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-start">Start Date</Label>
                <Input
                  id="edit-start"
                  type="date"
                  value={formData.Project_Start || ""}
                  onChange={(e) =>
                    setFormData((prev) =>
                      prev
                        ? { ...prev, Project_Start: e.target.value }
                        : prev
                    )
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-end">End Date</Label>
                <Input
                  id="edit-end"
                  type="date"
                  value={formData.Project_End || ""}
                  onChange={(e) =>
                    setFormData((prev) =>
                      prev ? { ...prev, Project_End: e.target.value } : prev
                    )
                  }
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="edit-approved"
                checked={formData.Project_Approved || false}
                onCheckedChange={(checked) =>
                  setFormData((prev) =>
                    prev ? { ...prev, Project_Approved: checked } : prev
                  )
                }
              />
              <Label htmlFor="edit-approved">Approved</Label>
            </div>

            <div className="pt-4">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-[#61BC47] hover:bg-[#4fa037] text-white"
              >
                <Save className="w-4 h-4" />
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "budget" && formData && (
        <div className="max-w-2xl">
          {saveMessage && (
            <div
              className={`mb-6 p-3 rounded-lg text-sm ${
                saveMessage.startsWith("Error")
                  ? "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300"
                  : "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300"
              }`}
            >
              {saveMessage}
            </div>
          )}

          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Switch
                id="budget-enabled"
                checked={formData.Budgets_Enabled || false}
                onCheckedChange={(checked) =>
                  setFormData((prev) =>
                    prev ? { ...prev, Budgets_Enabled: checked } : prev
                  )
                }
              />
              <Label htmlFor="budget-enabled">Budget Enabled</Label>
            </div>

            {project.Budget_Status_Name && (
              <div>
                <Label>Status</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {project.Budget_Status_Name}
                </p>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Switch
                id="budget-locked"
                checked={formData.Budget_Locked || false}
                onCheckedChange={(checked) =>
                  setFormData((prev) =>
                    prev ? { ...prev, Budget_Locked: checked } : prev
                  )
                }
              />
              <Label htmlFor="budget-locked">Budget Locked</Label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="expected-revenue">Expected Registration Revenue</Label>
                <Input
                  id="expected-revenue"
                  type="number"
                  step="0.01"
                  value={formData.Expected_Registration_Revenue ?? ""}
                  onChange={(e) =>
                    setFormData((prev) =>
                      prev
                        ? {
                            ...prev,
                            Expected_Registration_Revenue: e.target.value
                              ? parseFloat(e.target.value)
                              : null,
                          }
                        : prev
                    )
                  }
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="expected-discounts">Expected Discounts Budget</Label>
                <Input
                  id="expected-discounts"
                  type="number"
                  step="0.01"
                  value={formData.Expected_Discounts_Budget ?? ""}
                  onChange={(e) =>
                    setFormData((prev) =>
                      prev
                        ? {
                            ...prev,
                            Expected_Discounts_Budget: e.target.value
                              ? parseFloat(e.target.value)
                              : null,
                          }
                        : prev
                    )
                  }
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="pt-4">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-[#61BC47] hover:bg-[#4fa037] text-white"
              >
                <Save className="w-4 h-4" />
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "rsvp" && formData && (
        <div className="max-w-2xl">
          {saveMessage && (
            <div
              className={`mb-6 p-3 rounded-lg text-sm ${
                saveMessage.startsWith("Error")
                  ? "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300"
                  : "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300"
              }`}
            >
              {saveMessage}
            </div>
          )}

          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Switch
                id="rsvp-active"
                checked={formData.RSVP_Is_Active || false}
                onCheckedChange={(checked) =>
                  setFormData((prev) =>
                    prev ? { ...prev, RSVP_Is_Active: checked } : prev
                  )
                }
              />
              <Label htmlFor="rsvp-active">Active</Label>
            </div>

            <div>
              <Label htmlFor="rsvp-title">Title</Label>
              <Input
                id="rsvp-title"
                value={formData.RSVP_Title ?? ""}
                onChange={(e) =>
                  setFormData((prev) =>
                    prev ? { ...prev, RSVP_Title: e.target.value || null } : prev
                  )
                }
                placeholder="RSVP title"
              />
            </div>

            <div>
              <Label htmlFor="rsvp-description">Description</Label>
              <textarea
                id="rsvp-description"
                value={formData.RSVP_Description ?? ""}
                onChange={(e) =>
                  setFormData((prev) =>
                    prev ? { ...prev, RSVP_Description: e.target.value || null } : prev
                  )
                }
                placeholder="RSVP description"
                className="w-full min-h-[100px] rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rsvp-slug">Slug</Label>
                <Input
                  id="rsvp-slug"
                  value={formData.RSVP_Slug ?? ""}
                  onChange={(e) =>
                    setFormData((prev) =>
                      prev ? { ...prev, RSVP_Slug: e.target.value || null } : prev
                    )
                  }
                  placeholder="rsvp-slug"
                />
              </div>
              <div>
                <Label htmlFor="rsvp-url">URL</Label>
                <Input
                  id="rsvp-url"
                  value={formData.RSVP_URL ?? ""}
                  onChange={(e) =>
                    setFormData((prev) =>
                      prev ? { ...prev, RSVP_URL: e.target.value || null } : prev
                    )
                  }
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rsvp-start">Start Date</Label>
                <Input
                  id="rsvp-start"
                  type="date"
                  value={formData.RSVP_Start_Date ? toInputDate(formData.RSVP_Start_Date) : ""}
                  onChange={(e) =>
                    setFormData((prev) =>
                      prev
                        ? { ...prev, RSVP_Start_Date: e.target.value || null }
                        : prev
                    )
                  }
                />
              </div>
              <div>
                <Label htmlFor="rsvp-end">End Date</Label>
                <Input
                  id="rsvp-end"
                  type="date"
                  value={formData.RSVP_End_Date ? toInputDate(formData.RSVP_End_Date) : ""}
                  onChange={(e) =>
                    setFormData((prev) =>
                      prev
                        ? { ...prev, RSVP_End_Date: e.target.value || null }
                        : prev
                    )
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rsvp-confirm-email">Confirmation Email Template ID</Label>
                <Input
                  id="rsvp-confirm-email"
                  type="number"
                  value={formData.RSVP_Confirmation_Email_Template_ID ?? ""}
                  onChange={(e) =>
                    setFormData((prev) =>
                      prev
                        ? {
                            ...prev,
                            RSVP_Confirmation_Email_Template_ID: e.target.value
                              ? parseInt(e.target.value, 10)
                              : null,
                          }
                        : prev
                    )
                  }
                />
              </div>
              <div>
                <Label htmlFor="rsvp-reminder-email">Reminder Email Template ID</Label>
                <Input
                  id="rsvp-reminder-email"
                  type="number"
                  value={formData.RSVP_Reminder_Email_Template_ID ?? ""}
                  onChange={(e) =>
                    setFormData((prev) =>
                      prev
                        ? {
                            ...prev,
                            RSVP_Reminder_Email_Template_ID: e.target.value
                              ? parseInt(e.target.value, 10)
                              : null,
                          }
                        : prev
                    )
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rsvp-days-remind">Days to Remind</Label>
                <Input
                  id="rsvp-days-remind"
                  type="number"
                  value={formData.RSVP_Days_To_Remind ?? ""}
                  onChange={(e) =>
                    setFormData((prev) =>
                      prev
                        ? {
                            ...prev,
                            RSVP_Days_To_Remind: e.target.value
                              ? parseInt(e.target.value, 10)
                              : null,
                          }
                        : prev
                    )
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rsvp-primary-color">Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="rsvp-primary-color"
                    value={formData.RSVP_Primary_Color ?? ""}
                    onChange={(e) =>
                      setFormData((prev) =>
                        prev ? { ...prev, RSVP_Primary_Color: e.target.value || null } : prev
                      )
                    }
                    placeholder="#000000"
                    className="flex-1"
                  />
                  {formData.RSVP_Primary_Color && (
                    <div
                      className="w-9 h-9 rounded-md border flex-shrink-0"
                      style={{ backgroundColor: formData.RSVP_Primary_Color }}
                    />
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="rsvp-secondary-color">Secondary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="rsvp-secondary-color"
                    value={formData.RSVP_Secondary_Color ?? ""}
                    onChange={(e) =>
                      setFormData((prev) =>
                        prev ? { ...prev, RSVP_Secondary_Color: e.target.value || null } : prev
                      )
                    }
                    placeholder="#000000"
                    className="flex-1"
                  />
                  {formData.RSVP_Secondary_Color && (
                    <div
                      className="w-9 h-9 rounded-md border flex-shrink-0"
                      style={{ backgroundColor: formData.RSVP_Secondary_Color }}
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rsvp-accent-color">Accent Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="rsvp-accent-color"
                    value={formData.RSVP_Accent_Color ?? ""}
                    onChange={(e) =>
                      setFormData((prev) =>
                        prev ? { ...prev, RSVP_Accent_Color: e.target.value || null } : prev
                      )
                    }
                    placeholder="#000000"
                    className="flex-1"
                  />
                  {formData.RSVP_Accent_Color && (
                    <div
                      className="w-9 h-9 rounded-md border flex-shrink-0"
                      style={{ backgroundColor: formData.RSVP_Accent_Color }}
                    />
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="rsvp-bg-color">Background Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="rsvp-bg-color"
                    value={formData.RSVP_Background_Color ?? ""}
                    onChange={(e) =>
                      setFormData((prev) =>
                        prev ? { ...prev, RSVP_Background_Color: e.target.value || null } : prev
                      )
                    }
                    placeholder="#000000"
                    className="flex-1"
                  />
                  {formData.RSVP_Background_Color && (
                    <div
                      className="w-9 h-9 rounded-md border flex-shrink-0"
                      style={{ backgroundColor: formData.RSVP_Background_Color }}
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-[#61BC47] hover:bg-[#4fa037] text-white"
              >
                <Save className="w-4 h-4" />
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "events" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              Linked Events
            </h2>
            <Button
              size="sm"
              onClick={() => setShowLinkEvent(true)}
              className="bg-[#61BC47] hover:bg-[#4fa037] text-white"
            >
              <Plus className="w-4 h-4" />
              Link Event
            </Button>
          </div>

          {eventsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="bg-card border-2 border-dashed border-border rounded-lg p-8 text-center">
              <CalendarDays className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                No events linked to this project yet.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="mt-3"
                onClick={() => setShowLinkEvent(true)}
              >
                Link an Event
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {events.map((event) => (
                <div
                  key={event.Event_ID}
                  className="bg-card border border-border rounded-lg p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-foreground">
                        {event.Event_Title}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(event.Event_Start_Date)}
                        </span>
                        {event.Congregation_Name && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {event.Congregation_Name}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleUnlinkEvent(event.Event_ID)}
                      title="Unlink event"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-6 mt-3 pt-3 border-t border-border">
                    <label className="flex items-center gap-2 text-sm">
                      <Switch
                        checked={
                          event.Include_Registrations_In_Project_Budgets ??
                          false
                        }
                        onCheckedChange={(checked) =>
                          handleUpdateEventField(
                            event.Event_ID,
                            "Include_Registrations_In_Project_Budgets",
                            checked
                          )
                        }
                      />
                      <span className="text-muted-foreground">
                        Include Registrations in Budgets
                      </span>
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <Switch
                        checked={event.Include_In_RSVP ?? false}
                        onCheckedChange={(checked) =>
                          handleUpdateEventField(
                            event.Event_ID,
                            "Include_In_RSVP",
                            checked
                          )
                        }
                      />
                      <span className="text-muted-foreground">
                        Include in RSVP
                      </span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Link Event Dialog */}
          <Dialog open={showLinkEvent} onOpenChange={setShowLinkEvent}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Link Event</DialogTitle>
                <DialogDescription>
                  Enter the Event ID to link to this project.
                </DialogDescription>
              </DialogHeader>
              <div>
                <Label htmlFor="event-id">Event ID</Label>
                <Input
                  id="event-id"
                  type="number"
                  value={linkEventId}
                  onChange={(e) => setLinkEventId(e.target.value)}
                  placeholder="e.g. 12345"
                />
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowLinkEvent(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleLinkEvent}
                  disabled={!linkEventId}
                  className="bg-[#61BC47] hover:bg-[#4fa037] text-white"
                >
                  <LinkIcon className="w-4 h-4" />
                  Link
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {activeTab === "campuses" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              Project Campuses
            </h2>
            <Button
              size="sm"
              onClick={() => setShowAddCampus(true)}
              className="bg-[#61BC47] hover:bg-[#4fa037] text-white"
            >
              <Plus className="w-4 h-4" />
              Add Campus
            </Button>
          </div>

          {campusesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : campuses.length === 0 ? (
            <div className="bg-card border-2 border-dashed border-border rounded-lg p-8 text-center">
              <MapPin className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                No campuses added to this project yet.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="mt-3"
                onClick={() => setShowAddCampus(true)}
              >
                Add a Campus
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {campuses.map((campus) => (
                <div
                  key={campus.Project_Campus_ID}
                  className="flex items-center justify-between bg-card border border-border rounded-lg p-4"
                >
                  <div>
                    <div className="font-medium text-foreground">
                      {campus.Campus_Name || `Campus ${campus.Congregation_ID}`}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {campus.Event_Title && (
                        <span className="flex items-center gap-1">
                          <CalendarDays className="w-3 h-3" />
                          {campus.Event_Title}
                        </span>
                      )}
                      {!campus.Is_Active && (
                        <span className="text-yellow-600 dark:text-yellow-400">
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveCampus(campus.Project_Campus_ID)}
                    title="Remove campus"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Add Campus Dialog */}
          <Dialog open={showAddCampus} onOpenChange={setShowAddCampus}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Add Campus</DialogTitle>
                <DialogDescription>
                  Select a campus to add to this project.
                </DialogDescription>
              </DialogHeader>
              <div>
                <Label htmlFor="campus-select">Campus</Label>
                <select
                  id="campus-select"
                  value={newCampusCongregationId}
                  onChange={(e) => setNewCampusCongregationId(e.target.value)}
                  className="w-full h-9 rounded-md border bg-background px-3 text-sm"
                >
                  <option value="">Select campus...</option>
                  {lookups?.congregations.map((c) => (
                    <option
                      key={c.Congregation_ID}
                      value={c.Congregation_ID}
                    >
                      {c.Congregation_Name}
                    </option>
                  ))}
                </select>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowAddCampus(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddCampus}
                  disabled={!newCampusCongregationId}
                  className="bg-[#61BC47] hover:bg-[#4fa037] text-white"
                >
                  Add Campus
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}
