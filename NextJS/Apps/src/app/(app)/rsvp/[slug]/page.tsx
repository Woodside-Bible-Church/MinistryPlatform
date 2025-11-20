"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import Link from "next/link";
import {
  Calendar,
  Users,
  Activity,
  ChevronLeft,
  Settings,
  List,
  CheckCircle2,
  XCircle,
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        // Load project by slug
        const projectResponse = await fetch(`/api/rsvp/projects/by-slug/${slug}`);
        if (!projectResponse.ok) throw new Error("Failed to fetch project");
        const projectData = await projectResponse.json();
        setProject(projectData);

        // Load events using project ID
        const eventsResponse = await fetch(
          `/api/rsvp/projects/${projectData.Project_ID}/events`
        );
        if (!eventsResponse.ok) throw new Error("Failed to fetch events");
        const eventsData = await eventsResponse.json();
        setEvents(eventsData);

        // Load RSVPs using project ID
        const rsvpsResponse = await fetch(
          `/api/rsvp/projects/${projectData.Project_ID}/rsvps`
        );
        if (!rsvpsResponse.ok) throw new Error("Failed to fetch RSVPs");
        const rsvpsData = await rsvpsResponse.json();
        setRsvps(rsvpsData);
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
              <p className="text-muted-foreground max-w-3xl">
                {project.RSVP_Description}
              </p>
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

      {/* Project Events Section */}
      <div className="mb-12">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
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
              <div className="space-y-3">
                {events.map((event) => (
                  <div
                    key={event.Event_ID}
                    className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-foreground">
                            {event.Event_Title}
                          </h3>
                          {event.Include_In_RSVP ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-[#61bc47]/10 text-[#61bc47] border border-[#61bc47]/20">
                              <CheckCircle2 className="w-3 h-3" />
                              RSVP Enabled
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                              <XCircle className="w-3 h-3" />
                              RSVP Disabled
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDateTime(event.Event_Start_Date)}
                          </div>
                          {event.Congregation_Name && (
                            <div>{event.Congregation_Name}</div>
                          )}
                          {event.Event_Type && (
                            <div className="text-xs font-mono">
                              {event.Event_Type}
                            </div>
                          )}
                        </div>
                        {event.Include_In_RSVP && (
                          <div className="mt-2 flex gap-4 text-sm">
                            <span className="text-foreground">
                              <strong>{event.RSVP_Count}</strong> RSVPs
                            </span>
                            <span className="text-foreground">
                              <strong>{event.Total_Attendees}</strong> Attendees
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
      </div>

      {/* RSVP Submissions Section */}
      <div className="mb-12">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              RSVP Submissions
            </h2>

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
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">
                        Name
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">
                        Event
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">
                        Party Size
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">
                        Contact
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">
                        Campus
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">
                        Submitted
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rsvps.map((rsvp) => (
                      <tr
                        key={rsvp.Event_RSVP_ID}
                        className="border-b border-border hover:bg-muted/50 transition-colors"
                      >
                        <td className="py-3 px-4 text-sm text-foreground">
                          <div>
                            {rsvp.First_Name} {rsvp.Last_Name}
                            {rsvp.Is_New_Visitor && (
                              <span className="ml-2 text-xs font-medium text-[#61bc47]">
                                New Visitor
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {rsvp.Event_Title || "N/A"}
                        </td>
                        <td className="py-3 px-4 text-sm text-foreground">
                          {rsvp.Party_Size || 1}
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          <div className="space-y-1">
                            {rsvp.Email_Address && (
                              <div className="text-xs">{rsvp.Email_Address}</div>
                            )}
                            {rsvp.Phone_Number && (
                              <div className="text-xs">{rsvp.Phone_Number}</div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {rsvp.Campus_Name || "N/A"}
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {formatDate(rsvp.RSVP_Date)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
      </div>
    </div>
  );
}
