"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import {
  Search,
  Plus,
  Calendar,
  User,
  CheckCircle2,
  Clock,
  ChevronRight,
  AlertCircle,
  CalendarDays,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { useProjectList, useProjectLookups } from "@/hooks/useProjectManagement";
import type { ProjectRecord, CreateProjectPayload, CoordinatorLookup } from "@/types/projectManagement";

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getStatusInfo(project: ProjectRecord) {
  const now = new Date();
  const start = new Date(project.Project_Start);
  const end = project.Project_End ? new Date(project.Project_End) : null;

  if (!project.Project_Approved) {
    return {
      label: "Pending",
      className:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400",
      icon: <Clock className="w-3 h-3" />,
    };
  }
  if (now < start) {
    return {
      label: "Approved",
      className:
        "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
      icon: <CheckCircle2 className="w-3 h-3" />,
    };
  }
  // No end date means it's still going; also in-progress if before end date
  if (!end || now <= end) {
    return {
      label: "In Progress",
      className:
        "bg-[#61bc47]/10 text-[#61bc47] border border-[#61bc47]/20",
      icon: <CalendarDays className="w-3 h-3" />,
    };
  }
  return {
    label: "Completed",
    className:
      "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
    icon: <CheckCircle2 className="w-3 h-3" />,
  };
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function ProjectsPage() {
  const { data: projects, isLoading, error, refetch } = useProjectList();
  const { data: lookups } = useProjectLookups();
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [coordinatorOpen, setCoordinatorOpen] = useState(false);
  const [coordinatorSearch, setCoordinatorSearch] = useState("");
  const [coordinatorResults, setCoordinatorResults] = useState<CoordinatorLookup[]>([]);
  const [coordinatorLoading, setCoordinatorLoading] = useState(false);
  const [selectedCoordinatorName, setSelectedCoordinatorName] = useState("");
  const coordinatorDebounce = useRef<ReturnType<typeof setTimeout>>(null);

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

  // Create form state
  const [newProject, setNewProject] = useState<Partial<CreateProjectPayload>>({
    Project_Title: "",
    Project_Approved: false,
  });

  const filteredProjects = projects.filter((project) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      project.Project_Title?.toLowerCase().includes(query) ||
      project.Coordinator_Name?.toLowerCase().includes(query) ||
      project.Project_Type_Name?.toLowerCase().includes(query)
    );
  });

  const handleCreate = async () => {
    if (
      !newProject.Project_Title ||
      !newProject.Project_Coordinator ||
      !newProject.Project_Start ||
      !newProject.Project_End ||
      !newProject.Project_Type_ID
    ) {
      return;
    }

    setIsCreating(true);
    try {
      const payload: CreateProjectPayload = {
        Project_Title: newProject.Project_Title,
        Project_Coordinator: newProject.Project_Coordinator,
        Project_Start: newProject.Project_Start,
        Project_End: newProject.Project_End,
        Project_Approved: newProject.Project_Approved ?? false,
        Project_Type_ID: newProject.Project_Type_ID,
        Slug: newProject.Slug || generateSlug(newProject.Project_Title),
      };

      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create project");
      }

      setShowCreateDialog(false);
      setNewProject({ Project_Title: "", Project_Approved: false });
      refetch();
    } catch (err) {
      console.error("Failed to create project:", err);
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 max-w-[1600px]">
        <div className="flex justify-between items-center mb-8">
          <div>
            <Skeleton className="h-9 w-48 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="mb-6">
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-lg overflow-hidden p-6"
            >
              <Skeleton className="h-7 w-3/4 mb-3" />
              <Skeleton className="h-5 w-24 mb-4" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 max-w-[1600px]">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-primary dark:text-foreground">
              Projects
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage projects, campuses, and linked events.
            </p>
          </div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-600 dark:text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-red-900 dark:text-red-200 mb-2">
            Failed to Load Projects
          </h3>
          <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
          <Button onClick={refetch}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 max-w-[1600px]">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-primary dark:text-foreground">
            Projects
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage projects, campuses, and linked events.
          </p>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="bg-[#61BC47] hover:bg-[#4fa037] text-white"
        >
          <Plus className="w-4 h-4" />
          New Project
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by title, coordinator, or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        {searchQuery && (
          <p className="text-sm text-muted-foreground mt-2">
            Found {filteredProjects.length}{" "}
            {filteredProjects.length === 1 ? "project" : "projects"}
          </p>
        )}
      </div>

      {/* Project Grid */}
      {filteredProjects.length === 0 && searchQuery ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <h3 className="text-xl font-semibold text-foreground mb-2">
            No projects found
          </h3>
          <p className="text-muted-foreground mb-6">
            Try adjusting your search query.
          </p>
          <Button variant="outline" onClick={() => setSearchQuery("")}>
            Clear Search
          </Button>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-card border-2 border-dashed border-border rounded-lg p-12 text-center">
          <h3 className="text-xl font-semibold text-foreground mb-2">
            No projects yet
          </h3>
          <p className="text-muted-foreground mb-6">
            Create your first project to get started.
          </p>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-[#61BC47] hover:bg-[#4fa037] text-white"
          >
            Create Project
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProjects.map((project) => {
            const status = getStatusInfo(project);
            return (
              <Link
                key={project.Project_ID}
                href={`/projects/${project.Slug}`}
                className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg hover:border-[#61bc47]/50 transition-all group"
              >
                <div className="p-6">
                  {/* Title & Status */}
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold text-foreground flex-1 pr-2 group-hover:text-[#61bc47] transition-colors">
                      {project.Project_Title}
                    </h3>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-[#61bc47] group-hover:translate-x-1 transition-all flex-shrink-0" />
                  </div>

                  <div className="flex gap-2 flex-wrap mb-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status.className}`}
                    >
                      {status.icon}
                      {status.label}
                    </span>
                    {project.Project_Type_Name && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                        {project.Project_Type_Name}
                      </span>
                    )}
                  </div>

                  {/* Details */}
                  <div className="space-y-2 text-sm text-muted-foreground">
                    {project.Coordinator_Name && (
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">
                          {project.Coordinator_Name}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      <span>
                        {formatDate(project.Project_Start)}
                        {project.Project_End &&
                          ` - ${formatDate(project.Project_End)}`}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Create Project Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Project</DialogTitle>
            <DialogDescription>
              Create a new project. You can configure campuses and events after
              creation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Project Title</Label>
              <Input
                id="title"
                value={newProject.Project_Title || ""}
                onChange={(e) =>
                  setNewProject((prev) => ({
                    ...prev,
                    Project_Title: e.target.value,
                    Slug: generateSlug(e.target.value),
                  }))
                }
                placeholder="e.g. Easter 2026"
              />
            </div>

            <div>
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={newProject.Slug || ""}
                onChange={(e) =>
                  setNewProject((prev) => ({ ...prev, Slug: e.target.value }))
                }
                placeholder="easter-2026"
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
                                setNewProject((prev) => ({
                                  ...prev,
                                  Project_Coordinator: c.User_ID,
                                }));
                                setSelectedCoordinatorName(c.Display_Name);
                                setCoordinatorOpen(false);
                                setCoordinatorSearch("");
                              }}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${
                                  newProject.Project_Coordinator === c.User_ID
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
              <Label htmlFor="type">Project Type</Label>
              <select
                id="type"
                value={newProject.Project_Type_ID || ""}
                onChange={(e) =>
                  setNewProject((prev) => ({
                    ...prev,
                    Project_Type_ID: parseInt(e.target.value, 10),
                  }))
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
                <Label htmlFor="start">Start Date</Label>
                <Input
                  id="start"
                  type="date"
                  value={newProject.Project_Start || ""}
                  onChange={(e) =>
                    setNewProject((prev) => ({
                      ...prev,
                      Project_Start: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="end">End Date</Label>
                <Input
                  id="end"
                  type="date"
                  value={newProject.Project_End || ""}
                  onChange={(e) =>
                    setNewProject((prev) => ({
                      ...prev,
                      Project_End: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="approved"
                checked={newProject.Project_Approved || false}
                onCheckedChange={(checked) =>
                  setNewProject((prev) => ({
                    ...prev,
                    Project_Approved: checked,
                  }))
                }
              />
              <Label htmlFor="approved">Approved</Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={
                isCreating ||
                !newProject.Project_Title ||
                !newProject.Project_Coordinator ||
                !newProject.Project_Start ||
                !newProject.Project_End ||
                !newProject.Project_Type_ID
              }
              className="bg-[#61BC47] hover:bg-[#4fa037] text-white"
            >
              {isCreating ? "Creating..." : "Create Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
