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
  RSVP_Allow_Guest_Submission: boolean | null;
  RSVP_Primary_Color: string | null;
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
  Project_Campus_ID: number;
  Congregation_ID: number;
  Campus_Name: string;
  Public_Event_ID: number | null;
  Public_Event_Title: string | null;
  Meeting_Instructions: string | null;
  Is_Active: boolean | null;
  Display_Order: number | null;
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

  const [project, setProject] = useState<Project | null>(null);
  const [events, setEvents] = useState<ProjectEventWithDetails[]>([]);
  const [rsvps, setRsvps] = useState<ProjectRSVP[]>([]);
  const [projectCampuses, setProjectCampuses] = useState<ProjectCampus[]>([]);
  const [confirmationCards, setConfirmationCards] = useState<ConfirmationCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter states
  const [searchText, setSearchText] = useState("");
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});

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
        setEvents(data.Events || []);
        setRsvps(data.RSVPs || []);
        setProjectCampuses(data.Project_Campuses || []);
        setConfirmationCards(data.Confirmation_Cards || []);
      } catch (error) {
        console.error("Error loading project data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [slug]);

  const includedEvents = events.filter((e) => e.Include_In_RSVP);
  const totalRSVPs = rsvps.length;
  const totalAttendees = rsvps.reduce(
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

      {/* Project Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold text-primary dark:text-foreground mb-2">
              {displayTitle}
            </h1>
            {project.RSVP_Description && (
              <p
                className="text-muted-foreground max-w-3xl"
                dangerouslySetInnerHTML={{ __html: project.RSVP_Description }}
              />
            )}
          </div>
          <div className="flex gap-2">
            {project.RSVP_Is_Active ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-[#61bc47]/10 text-[#61bc47] border border-[#61bc47]/20">
                <CheckCircle2 className="w-4 h-4" />
                Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                <XCircle className="w-4 h-4" />
                Inactive
              </span>
            )}
          </div>
        </div>

        {/* Project Metadata */}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {project.RSVP_Start_Date && project.RSVP_End_Date && (
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {formatDate(project.RSVP_Start_Date)} -{" "}
              {formatDate(project.RSVP_End_Date)}
            </div>
          )}
          {project.RSVP_Slug && (
            <div className="font-mono text-xs">/{project.RSVP_Slug}</div>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground mb-1">
                RSVP Events
              </div>
              <div className="text-3xl font-bold text-foreground">
                {includedEvents.length}
              </div>
            </div>
            <Calendar className="w-10 h-10 text-[#61bc47]" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground mb-1">
                Total RSVPs
              </div>
              <div className="text-3xl font-bold text-foreground">
                {totalRSVPs}
              </div>
            </div>
            <Activity className="w-10 h-10 text-[#61bc47]" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground mb-1">
                Total Attendees
              </div>
              <div className="text-3xl font-bold text-foreground">
                {totalAttendees}
              </div>
            </div>
            <Users className="w-10 h-10 text-[#61bc47]" />
          </div>
        </div>
      </div>

      {/* Project Events Section - Grouped by Campus */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold text-foreground mb-6">
          Project Events
        </h2>

        {events.length === 0 ? (
          <div className="bg-card border-2 border-dashed border-border rounded-lg p-12 text-center">
            <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No events in this project
            </h3>
            <p className="text-muted-foreground">
              Add events to this project in MinistryPlatform.
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Group events by campus, then by date */}
            {Object.entries(
              includedEvents.reduce((campusGroups, event) => {
                const campus = event.Congregation_Name || "No Campus";
                if (!campusGroups[campus]) campusGroups[campus] = [];
                campusGroups[campus].push(event);
                return campusGroups;
              }, {} as Record<string, typeof includedEvents>)
            )
            .sort(([campusA], [campusB]) => campusA.localeCompare(campusB))
            .map(([campus, campusEvents]) => (
              <div key={campus}>
                {/* Campus Header */}
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-foreground">{campus}</h3>
                  <div className="h-1 w-20 bg-[#61bc47] rounded mt-2" />
                </div>

                <div className="space-y-8">
                  {/* Group campus events by date */}
                  {Object.entries(
                    campusEvents.reduce((dateGroups, event) => {
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
                    }, {} as Record<string, typeof campusEvents>)
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
                          <Activity className="w-5 h-5 text-[#61bc47]" />
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

                  {/* Confirmation Cards for this campus */}
                  {(() => {
                    // Get the Congregation_ID for this campus to filter cards
                    const campusEvent = campusEvents[0];
                    const congregationId = campusEvent?.Congregation_ID;

                    // Filter cards for this campus (campus-specific + global cards)
                    const campusCards = confirmationCards.filter(
                      (card) =>
                        card.Is_Global ||
                        (congregationId && card.Congregation_ID === congregationId)
                    );

                    if (campusCards.length === 0) return null;

                    return (
                      <div className="mt-8 flex flex-wrap gap-6">
                        {campusCards.map((card) => {
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
                            <div key={card.Card_ID} className="bg-card border border-border rounded-lg p-6 w-fit max-w-md">
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
                                    const IconComponent = getIconComponent(bullet.icon);
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
                    );
                  })()}
          </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RSVP Submissions Section */}
      <div className="mb-12">
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-foreground">
                Who's Coming?
              </h2>
            </div>

            {rsvps.length === 0 ? (
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
                      placeholder="Search by name, event, or campus..."
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
                    // Get all unique questions from RSVPs
                    const questions = getAllQuestions(rsvps);

                    // Filter RSVPs
                    const filteredRsvps = rsvps.filter((rsvp) => {
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
                      for (const [question, filterValue] of Object.entries(columnFilters)) {
                        if (filterValue && answers[question] !== filterValue) {
                          return false;
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
                            <th className="text-left py-3 px-4 text-sm font-semibold text-foreground whitespace-nowrap">
                              Campus
                            </th>
                            {questions.map((question) => {
                              // Get unique values for this question
                              const uniqueValues = Array.from(new Set(
                                rsvps.map(r => parseAnswerSummary(r.Answer_Summary)[question]).filter(Boolean)
                              )).sort();

                              return (
                                <th
                                  key={question}
                                  className="text-left py-3 px-4 text-sm font-semibold text-foreground whitespace-nowrap"
                                >
                                  <div className="flex flex-col gap-2">
                                    <span>{question}</span>
                                    {uniqueValues.length > 0 && uniqueValues.length <= 10 && (
                                      <select
                                        value={columnFilters[question] || ""}
                                        onChange={(e) => {
                                          setColumnFilters(prev => {
                                            const next = { ...prev };
                                            if (e.target.value) {
                                              next[question] = e.target.value;
                                            } else {
                                              delete next[question];
                                            }
                                            return next;
                                          });
                                        }}
                                        className="text-xs font-normal border border-border rounded px-2 py-1 bg-background text-foreground"
                                      >
                                        <option value="">All</option>
                                        {uniqueValues.map(value => (
                                          <option key={value} value={value}>{value}</option>
                                        ))}
                                      </select>
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
                          {filteredRsvps.length === 0 ? (
                            <tr>
                              <td colSpan={questions.length + 4} className="py-8 text-center text-muted-foreground">
                                No RSVPs match your filters
                              </td>
                            </tr>
                          ) : (
                            filteredRsvps.map((rsvp) => {
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
                                  <td className="py-3 px-4 text-sm text-muted-foreground whitespace-nowrap">
                                    {rsvp.Campus_Name || "N/A"}
                                  </td>
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
                            })
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
    </div>
  );
}
