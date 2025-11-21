"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import Link from "next/link";
import { useCampus } from "@/contexts/CampusContext";
import {
  Calendar,
  Users,
  Activity,
  ChevronLeft,
  Settings,
  List,
  CheckCircle2,
  XCircle,
  Pencil,
  Clock,
  Baby,
  Music,
  Heart,
  MapPin,
  Info,
  Search,
  X,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

type Project = {
  Project_ID: number;
  Project_Title: string;
  RSVP_Title: string | null;
  RSVP_Description: string | null;
  RSVP_Start_Date: string | null;
  RSVP_End_Date: string | null;
  RSVP_Is_Active: boolean | null;
  RSVP_Slug: string | null;
  RSVP_Require_Contact_Lookup: boolean | null;
  RSVP_Allow_Guest_Submission: boolean | null;
  RSVP_Primary_Color: string | null;
  RSVP_Secondary_Color: string | null;
  RSVP_Accent_Color: string | null;
  RSVP_Background_Color: string | null;
  RSVP_Confirmation_Email_Template_ID: number | null;
  RSVP_Confirmation_Template_ID: number | null;
  RSVP_BG_Image_URL: string | null;
  RSVP_Image_URL: string | null;
};

type ProjectEventWithDetails = {
  Project_Event_ID: number;
  Project_ID: number;
  Event_ID: number;
  Include_In_RSVP: boolean | null;
  RSVP_Capacity_Modifier: number | null;
  Event_Title: string;
  Event_Start_Date: string | null;
  Event_End_Date: string | null;
  Congregation_Name: string | null;
  Congregation_ID: number | null;
  Event_Type: string | null;
  RSVP_Count: number;
  Total_Attendees: number;
  Capacity: number | null;
  Available_Capacity: number | null;
};

type ProjectRSVP = {
  Event_RSVP_ID: number;
  Event_ID: number;
  Contact_ID: number | null;
  First_Name: string;
  Last_Name: string;
  Email_Address: string | null;
  Phone_Number: string | null;
  Party_Size: number | null;
  Is_New_Visitor: boolean | null;
  RSVP_Date: string;
  Event_Title: string | null;
  Event_Start_Date: string | null;
  Campus_Name: string | null;
  Answer_Summary: string | null;
};

type ProjectCampus = {
  Congregation_ID: number;
  Campus_Name: string;
  Public_Event_ID: number | null;
  Public_Event_Title: string | null;
  Meeting_Instructions: string | null;
  Public_Event_Image_URL: string | null;
  Is_Active: boolean | null;
  Display_Order: number | null;
  Events: ProjectEventWithDetails[];
  Confirmation_Cards: ConfirmationCard[];
};

type ConfirmationCard = {
  Card_ID: number;
  Card_Type_ID: number;
  Card_Type_Name: string;
  Component_Name: string;
  Icon_Name: string | null;
  Display_Order: number;
  Congregation_ID: number | null;
  Campus_Name: string | null;
  Is_Global: boolean;
  Configuration: string | null;
};

function formatDate(dateString: string | null) {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(dateString: string | null) {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// Helper to get icon component by name
function getIconComponent(iconName: string | null): LucideIcon {
  const iconMap: Record<string, LucideIcon> = {
    Clock,
    Baby,
    Music,
    Heart,
    MapPin,
    Info,
    Calendar,
    Users,
    Activity,
  };
  return iconMap[iconName || "Info"] || Info;
}

// Parse Answer_Summary field into key-value pairs
function parseAnswerSummary(answerSummary: string | null): Record<string, string> {
  if (!answerSummary) return {};
  const answers: Record<string, string> = {};
  const lines = answerSummary.split(/\r?\n|<br>/gi).filter((line) => line.trim());
  lines.forEach((line) => {
    const colonIndex = line.indexOf(":");
    if (colonIndex > 0) {
      const question = line.substring(0, colonIndex).trim();
      const answer = line.substring(colonIndex + 1).trim();
      if (question && answer) {
        answers[question] = answer;
      }
    }
  });
  return answers;
}

// Get all unique questions from all RSVPs
function getAllQuestions(rsvps: ProjectRSVP[]): string[] {
  const questionsSet = new Set<string>();
  rsvps.forEach((rsvp) => {
    const answers = parseAnswerSummary(rsvp.Answer_Summary);
    Object.keys(answers).forEach((question) => questionsSet.add(question));
  });
  return Array.from(questionsSet).sort();
}

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  // Get selected campus from context
  const { selectedCampus } = useCampus();

  const [project, setProject] = useState<Project | null>(null);
  const [campuses, setCampuses] = useState<ProjectCampus[]>([]);
  const [rsvps, setRsvps] = useState<ProjectRSVP[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter states
  const [searchText, setSearchText] = useState("");
  const [columnFilters, setColumnFilters] = useState<Record<string, string[]>>({});
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Tab state
  const [activeTab, setActiveTab] = useState<"details" | "campuses" | "rsvps">("details");

  useEffect(() => {
    async function loadData() {
      try {
        // Load all project details in one call using stored procedure
        const response = await fetch(`/api/rsvp/projects/details/${slug}`);
        if (!response.ok) {
          const errorData = await response.json();
          console.error("API Error:", errorData);
          throw new Error(`Failed to fetch project details: ${response.status}`);
        }
        const data = await response.json();

        console.log("Project details loaded:", data);

        setProject(data.Project);
        setCampuses(data.Campuses || []);
        setRsvps(data.RSVPs || []);
      } catch (error) {
        console.error("Error loading project data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [slug]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (openDropdown) {
        const target = event.target as HTMLElement;
        if (!target.closest(".filter-dropdown")) {
          setOpenDropdown(null);
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDropdown]);

  // Filter campuses and RSVPs by selected congregation
  // Church Wide (ID = 1) shows all, specific campus shows only that campus
  const isChurchWide = !selectedCampus || selectedCampus.Congregation_ID === 1;

  const filteredCampuses = campuses.filter((campus) => {
    if (isChurchWide) return true;
    return campus.Congregation_ID === selectedCampus.Congregation_ID;
  });

  const filteredRsvps = rsvps.filter((r) => {
    if (isChurchWide) return true;
    // Match by campus name since RSVPs have Campus_Name
    return r.Campus_Name === selectedCampus.Congregation_Name;
  });

  const totalRSVPs = filteredRsvps.length;
  const totalAttendees = filteredRsvps.reduce(
    (sum, r) => sum + (r.Party_Size || 0),
    0
  );

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 max-w-[1600px]">
        <Skeleton className="h-10 w-64 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 max-w-[1600px]">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Project not found
          </h2>
          <Link href="/rsvp">
            <Button variant="outline">Back to Project RSVPs</Button>
          </Link>
        </div>
      </div>
    );
  }

  const displayTitle = project.RSVP_Title || project.Project_Title;

  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 max-w-[1600px]">
      {/* Back Button */}
      <Link
        href="/rsvp"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Project RSVPs
      </Link>

      {/* Project Title */}
      <h1 className="text-3xl font-bold text-primary dark:text-foreground mb-6">
        {project.Project_Title}
      </h1>

      {/* Tabs */}
      <div className="border-b border-border mb-8">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("details")}
            className={`pb-4 px-6 py-2 font-semibold transition-all relative rounded-t-lg ${
              activeTab === "details"
                ? "text-[#61bc47]"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            Details
            {activeTab === "details" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#61bc47]" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("campuses")}
            className={`pb-4 px-6 py-2 font-semibold transition-all relative rounded-t-lg ${
              activeTab === "campuses"
                ? "text-[#61bc47]"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            {isChurchWide ? "Campuses" : selectedCampus.Congregation_Name}
            {activeTab === "campuses" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#61bc47]" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("rsvps")}
            className={`pb-4 px-6 py-2 font-semibold transition-all relative rounded-t-lg ${
              activeTab === "rsvps"
                ? "text-[#61bc47]"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            Who's Coming?
            {activeTab === "rsvps" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#61bc47]" />
            )}
          </button>
        </div>
      </div>

      {/* Details Tab */}
      {activeTab === "details" && (
        <div className="mb-12 space-y-6">
          {/* Project Information Card */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-xl font-semibold text-foreground">Project Information</h2>
              <button
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                onClick={() => {
                  // TODO: Open edit project info modal/dialog
                  console.log('Edit project info:', project.Project_ID);
                }}
                title="Edit project information"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* RSVP Title */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  RSVP Title
                </label>
                <p className="text-sm text-foreground mt-1">
                  {displayTitle}
                </p>
              </div>

              {/* Description */}
              {project.RSVP_Description && (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Description
                  </label>
                  <div
                    className="text-sm text-foreground mt-1"
                    dangerouslySetInnerHTML={{ __html: project.RSVP_Description }}
                  />
                </div>
              )}

              {/* Date Range */}
              {project.RSVP_Start_Date && project.RSVP_End_Date && (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Date Range
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <p className="text-sm text-foreground">
                      {formatDate(project.RSVP_Start_Date)} - {formatDate(project.RSVP_End_Date)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* General Settings Card */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-xl font-semibold text-foreground">General Settings</h2>
              <button
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                onClick={() => {
                  // TODO: Open edit project modal/dialog
                  console.log('Edit project:', project.Project_ID);
                }}
                title="Edit general settings"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Status
                </label>
                <p className="text-sm text-foreground mt-1">
                  {project.RSVP_Is_Active ? 'Active' : 'Inactive'}
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Require Contact Lookup
                </label>
                <p className="text-sm text-foreground mt-1">
                  {project.RSVP_Require_Contact_Lookup ? 'Yes' : 'No'}
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Allow Guest Submission
                </label>
                <p className="text-sm text-foreground mt-1">
                  {project.RSVP_Allow_Guest_Submission ? 'Yes' : 'No'}
                </p>
              </div>
            </div>
          </div>

          {/* Template Configuration Card */}
          {(project.RSVP_Confirmation_Email_Template_ID || project.RSVP_Confirmation_Template_ID) && (
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-semibold text-foreground">Template Configuration</h2>
                <button
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                  onClick={() => {
                    // TODO: Open edit template modal/dialog
                    console.log('Edit templates:', project.Project_ID);
                  }}
                  title="Edit template configuration"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {project.RSVP_Confirmation_Email_Template_ID && (
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Confirmation Email Template ID
                    </label>
                    <p className="text-sm text-foreground mt-1 font-mono">
                      {project.RSVP_Confirmation_Email_Template_ID}
                    </p>
                  </div>
                )}

                {project.RSVP_Confirmation_Template_ID && (
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Confirmation Template ID
                    </label>
                    <p className="text-sm text-foreground mt-1 font-mono">
                      {project.RSVP_Confirmation_Template_ID}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Colors Card */}
          {(project.RSVP_Primary_Color || project.RSVP_Secondary_Color || project.RSVP_Accent_Color || project.RSVP_Background_Color) && (
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-semibold text-foreground">Colors</h2>
                <button
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                  onClick={() => {
                    // TODO: Open edit colors modal/dialog
                    console.log('Edit colors:', project.Project_ID);
                  }}
                  title="Edit colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {project.RSVP_Primary_Color && (
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded border border-border"
                      style={{ backgroundColor: project.RSVP_Primary_Color }}
                    />
                    <div>
                      <p className="text-xs text-muted-foreground">Primary</p>
                      <p className="text-sm font-mono text-foreground">{project.RSVP_Primary_Color}</p>
                    </div>
                  </div>
                )}
                {project.RSVP_Secondary_Color && (
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded border border-border"
                      style={{ backgroundColor: project.RSVP_Secondary_Color }}
                    />
                    <div>
                      <p className="text-xs text-muted-foreground">Secondary</p>
                      <p className="text-sm font-mono text-foreground">{project.RSVP_Secondary_Color}</p>
                    </div>
                  </div>
                )}
                {project.RSVP_Accent_Color && (
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded border border-border"
                      style={{ backgroundColor: project.RSVP_Accent_Color }}
                    />
                    <div>
                      <p className="text-xs text-muted-foreground">Accent</p>
                      <p className="text-sm font-mono text-foreground">{project.RSVP_Accent_Color}</p>
                    </div>
                  </div>
                )}
                {project.RSVP_Background_Color && (
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded border border-border"
                      style={{ backgroundColor: project.RSVP_Background_Color }}
                    />
                    <div>
                      <p className="text-xs text-muted-foreground">Background</p>
                      <p className="text-sm font-mono text-foreground">{project.RSVP_Background_Color}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Images Card */}
          {(project.RSVP_Image_URL || project.RSVP_BG_Image_URL) && (
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-semibold text-foreground">Images</h2>
                <button
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                  onClick={() => {
                    // TODO: Open edit images modal/dialog
                    console.log('Edit images:', project.Project_ID);
                  }}
                  title="Edit images"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {project.RSVP_Image_URL && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Image</p>
                    <img
                      src={project.RSVP_Image_URL}
                      alt="RSVP Image"
                      className="w-full h-auto rounded border border-border"
                    />
                  </div>
                )}
                {project.RSVP_BG_Image_URL && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Background Image</p>
                    <img
                      src={project.RSVP_BG_Image_URL}
                      alt="Background Image"
                      className="w-full h-auto rounded border border-border"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Campuses Section - Campus-specific configuration */}
      {activeTab === "campuses" && (
      <div className="mb-12">
        {filteredCampuses.length === 0 ? (
          <div className="bg-card border-2 border-dashed border-border rounded-lg p-12 text-center">
            <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No campuses found
            </h3>
            <p className="text-muted-foreground">
              Add campuses to this project in MinistryPlatform.
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Iterate through each campus */}
            {filteredCampuses.map((campus) => (
              <div key={campus.Congregation_ID}>
                {/* Campus Header - Only show when Church Wide */}
                {isChurchWide && (
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-foreground">{campus.Campus_Name}</h3>
                    <div className="h-1 w-20 bg-[#61bc47] rounded mt-2" />
                  </div>
                )}

                {/* Public Event Info */}
                {campus.Public_Event_ID ? (
                  <div className={`bg-card border border-border rounded-lg overflow-hidden max-w-md relative ${isChurchWide ? 'mt-4' : 'mb-6'}`}>
                    {/* Edit Button */}
                    <button
                      className="absolute top-2 right-2 p-2 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-md transition-colors z-10 backdrop-blur-sm"
                      onClick={() => {
                        // TODO: Open edit meeting instructions modal/dialog
                        console.log('Edit meeting instructions for event:', campus.Public_Event_ID);
                      }}
                      title="Edit meeting instructions"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    {/* Public Event Image */}
                    {campus.Public_Event_Image_URL && (
                      <div className="w-full bg-muted">
                        <img
                          src={campus.Public_Event_Image_URL}
                          alt="Additional Meeting Information"
                          className="w-full h-auto"
                        />
                      </div>
                    )}

                    {/* Public Event Text Content */}
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Info className="w-4 h-4 text-[#61bc47]" />
                        <h4 className="font-semibold text-foreground">Additional Meeting Information</h4>
                      </div>
                      {campus.Meeting_Instructions && (
                        <p className="text-sm text-muted-foreground pl-6">{campus.Meeting_Instructions}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className={`bg-card border border-dashed border-border rounded-lg p-6 text-center max-w-md ${isChurchWide ? 'mt-4' : 'mb-6'}`}>
                    <p className="text-sm text-muted-foreground">No public-facing event configured</p>
                  </div>
                )}

                {/* Check if campus has events */}
                {!campus.Events || campus.Events.length === 0 ? (
                  <div className="bg-card border border-dashed border-border rounded-lg p-8 text-center mb-8">
                    <p className="text-muted-foreground">No events for this campus</p>
                  </div>
                ) : (
                  <div className="space-y-8 mb-8">
                    {/* Group campus events by date */}
                    {Object.entries(
                      campus.Events.reduce((dateGroups, event) => {
                        const date = event.Event_Start_Date
                          ? new Date(event.Event_Start_Date).toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })
                          : "No Date";
                        if (!dateGroups[date]) dateGroups[date] = [];
                        dateGroups[date].push(event);
                        return dateGroups;
                      }, {} as Record<string, ProjectEventWithDetails[]>)
                    ).map(([date, dateEvents]) => (
                      <div key={date}>
                        {/* Date Header */}
                        <div className="flex items-center gap-2 mb-4">
                          <Calendar className="w-5 h-5 text-[#61bc47]" />
                          <h4 className="text-lg font-semibold text-foreground">{date}</h4>
                        </div>

                        {/* Event Cards - Horizontal Scroll */}
                        <div className="overflow-x-auto pb-4 -mx-4 px-4">
                          <div className="flex gap-4" style={{ minWidth: "min-content" }}>
                            {dateEvents.map((event) => (
                            <div
                              key={event.Event_ID}
                              className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow flex-shrink-0 relative"
                              style={{ width: "320px" }}
                            >
                        {/* Edit Button */}
                        <button
                          className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                          onClick={() => {
                            // TODO: Open edit modal/dialog
                            console.log('Edit event:', event.Event_ID);
                          }}
                          title="Edit event settings"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>

                        {/* Time */}
                        <div className="flex items-center gap-2 mb-4">
                          <Clock className="w-5 h-5 text-[#61bc47]" />
                          <span className="text-2xl font-bold text-foreground">
                            {event.Event_Start_Date
                              ? new Date(event.Event_Start_Date).toLocaleTimeString("en-US", {
                                  hour: "numeric",
                                  minute: "2-digit",
                                })
                              : "N/A"}
                          </span>
                        </div>

                        {/* Campus Name */}
                        {event.Congregation_Name && (
                          <div className="text-sm text-muted-foreground mb-4 uppercase tracking-wide">
                            {event.Congregation_Name}
                          </div>
                        )}

                        {/* Capacity Bar */}
                        <div className="mb-4">
                          {(() => {
                            const modifier = event.RSVP_Capacity_Modifier ?? 0;
                            const effectiveAttendees = event.Total_Attendees + modifier;
                            const capacityPercentage = event.Capacity
                              ? Math.round((effectiveAttendees / event.Capacity) * 100)
                              : 0;

                            // Get color based on percentage (matching widget)
                            const getCapacityColor = (pct: number): string => {
                              if (pct <= 50) return "#10B981"; // green-500
                              if (pct <= 75) return "#EAB308"; // yellow-500
                              if (pct <= 90) return "#F97316"; // orange-500
                              return "#EF4444"; // red-500
                            };

                            // Get status text (matching widget)
                            const getCapacityText = (pct: number): string => {
                              if (pct === 0) return "Plenty of space";
                              if (pct <= 50) return "Plenty of space";
                              if (pct <= 75) return "Good availability";
                              if (pct <= 90) return "Filling up";
                              if (pct < 100) return "Near capacity";
                              return "Overflow";
                            };

                            return (
                              <>
                                <div className="flex items-center justify-between text-sm mb-2">
                                  <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-muted-foreground" />
                                    <span className="font-medium uppercase text-xs tracking-wide text-muted-foreground">
                                      {getCapacityText(capacityPercentage)}
                                    </span>
                                  </div>
                                  {event.Capacity && (
                                    <span className="font-bold text-lg text-foreground">
                                      {capacityPercentage}%
                                    </span>
                                  )}
                                </div>
                                <div className="w-full bg-muted rounded-full h-2">
                                  <div
                                    className="h-2 rounded-full transition-all"
                                    style={{
                                      width: event.Capacity
                                        ? `${Math.min(capacityPercentage, 100)}%`
                                        : "0%",
                                      backgroundColor: getCapacityColor(capacityPercentage),
                                    }}
                                  />
                                </div>
                                {!event.Capacity && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    No capacity limit
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>

                        {/* Stats */}
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">RSVPs:</span>
                            <span className="font-semibold text-foreground">
                              {event.RSVP_Count}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total Attendees:</span>
                            <span className="font-semibold text-foreground">
                              {event.Total_Attendees}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Capacity:</span>
                            <span className="font-semibold text-foreground">
                              {event.Capacity ?? 'Unlimited'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Capacity Modifier:</span>
                            <span className="font-semibold text-foreground">
                              {event.RSVP_Capacity_Modifier != null && event.RSVP_Capacity_Modifier > 0 ? '+' : ''}{event.RSVP_Capacity_Modifier ?? 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
                  </div>
                )}

                {/* Confirmation Cards for this campus */}
                {campus.Confirmation_Cards && campus.Confirmation_Cards.length > 0 && (
                  <div className="mt-8">
                    {/* Confirmation Cards Heading */}
                    <div className="flex items-center gap-2 mb-6">
                      <CheckCircle2 className="w-5 h-5 text-[#61bc47]" />
                      <h4 className="text-lg font-semibold text-foreground">
                        Confirmation Cards
                      </h4>
                    </div>
                    <div className="flex flex-wrap gap-6">
                      {campus.Confirmation_Cards.map((card) => {
                          // Parse configuration JSON if it exists
                          let config: { title?: string; bullets?: Array<{ icon?: string; text?: string }> } = {};
                          try {
                            if (card.Configuration) {
                              config = JSON.parse(card.Configuration);
                            }
                          } catch (e) {
                            console.error("Failed to parse card configuration:", e);
                          }

                          // Check if card is global (null or 1)
                          const isGlobal = card.Congregation_ID === null || card.Congregation_ID === 1;

                          return (
                            <div key={card.Card_ID} className="bg-card border border-border rounded-lg p-6 w-fit max-w-md relative">
                              {/* Edit Button */}
                              <button
                                className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                                onClick={() => {
                                  // TODO: Open edit confirmation card modal/dialog
                                  console.log('Edit confirmation card:', card.Card_ID);
                                }}
                                title="Edit confirmation card"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>

                              <div className="flex items-center gap-4 mb-6">
                                <h4 className="text-xl font-semibold text-foreground">
                                  {config.title || card.Card_Type_Name}
                                </h4>
                                {isGlobal && (
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#61bc47]/10 text-[#61bc47] border border-[#61bc47]/20 whitespace-nowrap">
                                    All campuses
                                  </span>
                                )}
                              </div>
                              {config.bullets && config.bullets.length > 0 && (
                                <div className="space-y-4">
                                  {config.bullets.map((bullet, index) => {
                                    const IconComponent = getIconComponent(bullet.icon || null);
                                    return (
                                      <div
                                        key={index}
                                        className="flex items-center gap-4"
                                      >
                                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#61bc47]/10 border border-[#61bc47]/20 flex items-center justify-center">
                                          <IconComponent className="w-5 h-5 text-[#61bc47]" />
                                        </div>
                                        <div className="flex-1">
                                          <p className="text-sm text-muted-foreground leading-relaxed">
                                            {bullet.text}
                                          </p>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
              </div>
            ))}
          </div>
        )}
      </div>
      )}

      {/* RSVP Submissions Section */}
      {activeTab === "rsvps" && (
      <div className="mb-12">
          <div className="space-y-4">
            {filteredRsvps.length === 0 ? (
              <div className="bg-card border-2 border-dashed border-border rounded-lg p-12 text-center">
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  No RSVPs yet
                </h3>
                <p className="text-muted-foreground">
                  RSVPs submitted for this project will appear here.
                </p>
              </div>
            ) : (
              <>
                {/* Filter Controls */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder={isChurchWide ? "Search by name, event, or campus..." : "Search by name or event..."}
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#61bc47] focus:border-transparent"
                    />
                  </div>
                  {(searchText || Object.keys(columnFilters).length > 0) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchText("");
                        setColumnFilters({});
                      }}
                      className="flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Clear Filters
                    </Button>
                  )}
                </div>

                <div className="overflow-x-auto border border-border rounded-lg">
                  {(() => {
                    // Get all unique questions from filtered RSVPs (respecting congregation filter)
                    const questions = getAllQuestions(filteredRsvps);

                    // Apply search and column filters to already congregation-filtered RSVPs
                    const searchFilteredRsvps = filteredRsvps.filter((rsvp) => {
                      // Search text filter (name, event, campus)
                      if (searchText) {
                        const searchLower = searchText.toLowerCase();
                        const fullName = `${rsvp.First_Name} ${rsvp.Last_Name}`.toLowerCase();
                        const event = (rsvp.Event_Title || "").toLowerCase();
                        const campus = (rsvp.Campus_Name || "").toLowerCase();

                        if (!fullName.includes(searchLower) &&
                            !event.includes(searchLower) &&
                            !campus.includes(searchLower)) {
                          return false;
                        }
                      }

                      // Column-specific filters
                      const answers = parseAnswerSummary(rsvp.Answer_Summary);
                      for (const [question, filterValues] of Object.entries(columnFilters)) {
                        if (filterValues && filterValues.length > 0) {
                          if (!filterValues.includes(answers[question])) {
                            return false;
                          }
                        }
                      }

                      return true;
                    });

                    return (
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b border-border bg-muted/50">
                            <th className="text-left py-3 px-4 text-sm font-semibold text-foreground whitespace-nowrap">
                              Name
                            </th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-foreground whitespace-nowrap">
                              Event
                            </th>
                            {isChurchWide && (
                              <th className="text-left py-3 px-4 text-sm font-semibold text-foreground whitespace-nowrap">
                                Campus
                              </th>
                            )}
                            {questions.map((question) => {
                              // Get unique values for this question from congregation-filtered RSVPs
                              const uniqueValues = Array.from(new Set(
                                filteredRsvps.map(r => parseAnswerSummary(r.Answer_Summary)[question]).filter(Boolean)
                              )).sort();

                              const selectedValues = columnFilters[question] || [];
                              const isOpen = openDropdown === question;

                              return (
                                <th
                                  key={question}
                                  className="text-left py-3 px-4 text-sm font-semibold text-foreground whitespace-nowrap"
                                >
                                  <div className="flex flex-col gap-2">
                                    <span>{question}</span>
                                    {uniqueValues.length > 0 && uniqueValues.length <= 10 && (
                                      <div className="relative filter-dropdown">
                                        <button
                                          onClick={() => setOpenDropdown(isOpen ? null : question)}
                                          className="w-full text-xs font-normal border border-border rounded px-2 py-1 bg-background text-foreground flex items-center justify-between hover:bg-muted transition-colors"
                                        >
                                          <span className="truncate">
                                            {selectedValues.length === 0
                                              ? "All"
                                              : selectedValues.length === 1
                                              ? selectedValues[0]
                                              : `${selectedValues.length} selected`}
                                          </span>
                                          <ChevronDown className="w-3 h-3 flex-shrink-0 ml-1" />
                                        </button>
                                        {isOpen && (
                                          <div className="absolute z-10 mt-1 w-full min-w-[200px] bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                                            {uniqueValues.map((value) => {
                                              const isSelected = selectedValues.includes(value);
                                              return (
                                                <label
                                                  key={value}
                                                  className="flex items-center gap-2 px-3 py-2 hover:bg-muted cursor-pointer text-xs"
                                                >
                                                  <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={(e) => {
                                                      setColumnFilters((prev) => {
                                                        const next = { ...prev };
                                                        const current = next[question] || [];
                                                        if (e.target.checked) {
                                                          next[question] = [...current, value];
                                                        } else {
                                                          next[question] = current.filter(
                                                            (v) => v !== value
                                                          );
                                                          if (next[question].length === 0) {
                                                            delete next[question];
                                                          }
                                                        }
                                                        return next;
                                                      });
                                                    }}
                                                    className="rounded border-border text-[#61bc47] focus:ring-[#61bc47]"
                                                  />
                                                  <span className="flex-1">{value}</span>
                                                </label>
                                              );
                                            })}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </th>
                              );
                            })}
                            <th className="text-left py-3 px-4 text-sm font-semibold text-foreground whitespace-nowrap">
                              Submitted
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {searchFilteredRsvps.length === 0 ? (
                            <tr>
                              <td colSpan={questions.length + (isChurchWide ? 4 : 3)} className="py-8 text-center text-muted-foreground">
                                No RSVPs match your filters
                              </td>
                            </tr>
                          ) : (
                            <>
                              {searchFilteredRsvps.map((rsvp) => {
                                const answers = parseAnswerSummary(rsvp.Answer_Summary);

                                return (
                                  <tr
                                    key={rsvp.Event_RSVP_ID}
                                    className="border-b border-border hover:bg-muted/50 transition-colors"
                                  >
                                    <td className="py-3 px-4 text-sm text-foreground whitespace-nowrap">
                                      {rsvp.First_Name} {rsvp.Last_Name}
                                    </td>
                                    <td className="py-3 px-4 text-sm text-muted-foreground whitespace-nowrap">
                                      {rsvp.Event_Title || "N/A"}
                                    </td>
                                    {isChurchWide && (
                                      <td className="py-3 px-4 text-sm text-muted-foreground whitespace-nowrap">
                                        {rsvp.Campus_Name || "N/A"}
                                      </td>
                                    )}
                                    {questions.map((question) => (
                                      <td
                                        key={question}
                                        className="py-3 px-4 text-sm text-foreground whitespace-nowrap"
                                      >
                                        {answers[question] || "-"}
                                      </td>
                                    ))}
                                    <td className="py-3 px-4 text-sm text-muted-foreground whitespace-nowrap">
                                      {formatDate(rsvp.RSVP_Date)}
                                    </td>
                                  </tr>
                                );
                              })}
                              {/* Summary Row */}
                              <tr className="bg-muted/50 font-semibold border-t-2 border-border">
                                <td className="py-3 px-4 text-sm text-foreground whitespace-nowrap">
                                  Total: {searchFilteredRsvps.length}
                                </td>
                                <td className="py-3 px-4 text-sm text-muted-foreground whitespace-nowrap">
                                  -
                                </td>
                                {isChurchWide && (
                                  <td className="py-3 px-4 text-sm text-muted-foreground whitespace-nowrap">
                                    -
                                  </td>
                                )}
                                {questions.map((question) => {
                                  // Collect all values for this question
                                  const values = searchFilteredRsvps
                                    .map(r => parseAnswerSummary(r.Answer_Summary)[question])
                                    .filter(Boolean);

                                  // Check if numeric
                                  const numericValues = values.map(v => parseFloat(v)).filter(n => !isNaN(n));
                                  if (numericValues.length > 0 && numericValues.length === values.length) {
                                    // All values are numeric - show sum
                                    const sum = numericValues.reduce((a, b) => a + b, 0);
                                    return (
                                      <td key={question} className="py-3 px-4 text-sm text-foreground whitespace-nowrap">
                                        {sum}
                                      </td>
                                    );
                                  }

                                  // For non-numeric, show count of unique values
                                  const uniqueCount = new Set(values).size;
                                  if (uniqueCount <= 3) {
                                    // Show value counts if few unique values (boolean-like)
                                    const counts = values.reduce((acc, val) => {
                                      acc[val] = (acc[val] || 0) + 1;
                                      return acc;
                                    }, {} as Record<string, number>);

                                    return (
                                      <td key={question} className="py-3 px-4 text-sm text-foreground whitespace-nowrap">
                                        {Object.entries(counts).map(([val, count]) => `${val}: ${count}`).join(", ")}
                                      </td>
                                    );
                                  }

                                  return (
                                    <td key={question} className="py-3 px-4 text-sm text-muted-foreground whitespace-nowrap">
                                      -
                                    </td>
                                  );
                                })}
                                <td className="py-3 px-4 text-sm text-muted-foreground whitespace-nowrap">
                                  -
                                </td>
                              </tr>
                            </>
                          )}
                        </tbody>
                      </table>
                    );
                  })()}
                </div>
              </>
            )}
          </div>
      </div>
      )}
    </div>
  );
}
