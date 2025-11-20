"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar, Users, TrendingUp, Plus, Search, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

type RSVPProject = {
  Project_ID: number;
  Project_Title: string;
  RSVP_Title: string | null;
  RSVP_Description: string | null;
  RSVP_Start_Date: string | null;
  RSVP_End_Date: string | null;
  RSVP_Is_Active: boolean | null;
  RSVP_Slug: string | null;
  Event_Count: number;
  RSVP_Count: number;
};

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function ProjectCard({ project }: { project: RSVPProject }) {
  const now = new Date();
  const startDate = project.RSVP_Start_Date ? new Date(project.RSVP_Start_Date) : null;
  const endDate = project.RSVP_End_Date ? new Date(project.RSVP_End_Date) : null;

  const isUpcoming = startDate && startDate > now;
  const isOngoing = startDate && endDate && startDate <= now && endDate >= now;
  const isPast = endDate && endDate < now;

  const getStatusColor = () => {
    if (isPast) return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
    if (isOngoing) return "bg-[#61bc47]/10 text-[#61bc47] border border-[#61bc47]/20";
    return "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400";
  };

  const getStatusText = () => {
    if (isPast) return "Past";
    if (isOngoing) return "Active";
    return "Upcoming";
  };

  const displayTitle = project.RSVP_Title || project.Project_Title;

  return (
    <Link
      href={`/rsvp/${project.RSVP_Slug}`}
      className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-xl hover:border-primary/50 dark:hover:border-[#61bc47]/50 transition-all group"
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl font-semibold text-foreground flex-1 pr-2 group-hover:text-[#61bc47] transition-colors">
            {displayTitle}
          </h3>
        </div>

        {/* Status Badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()}`}
          >
            {getStatusText()}
          </span>
          {project.Event_Count > 0 && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
              <Calendar className="w-4 h-4" />
              {project.Event_Count} {project.Event_Count === 1 ? "event" : "events"}
            </span>
          )}
          {project.RSVP_Count > 0 && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400">
              <Activity className="w-4 h-4" />
              {project.RSVP_Count} {project.RSVP_Count === 1 ? "RSVP" : "RSVPs"}
            </span>
          )}
        </div>

        {/* Description */}
        {project.RSVP_Description && (
          <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
            {project.RSVP_Description}
          </p>
        )}

        {/* Date Range */}
        {startDate && endDate && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>
              {formatDate(project.RSVP_Start_Date!)} - {formatDate(project.RSVP_End_Date!)}
            </span>
          </div>
        )}

        {/* Slug Badge (for reference) */}
        {project.RSVP_Slug && (
          <div className="mt-3 pt-3 border-t border-border">
            <span className="text-xs text-muted-foreground font-mono">
              /{project.RSVP_Slug}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}

export default function RSVPPage() {
  const [projects, setProjects] = useState<RSVPProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadProjects() {
      try {
        const response = await fetch("/api/rsvp/projects");
        if (!response.ok) throw new Error("Failed to fetch RSVP projects");
        const data = await response.json();
        setProjects(data);
      } catch (error) {
        console.error("Error loading RSVP projects:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadProjects();
  }, []);

  // Filter projects based on search query
  const filteredProjects = projects.filter((p) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const displayTitle = p.RSVP_Title || p.Project_Title;
    return (
      (displayTitle?.toLowerCase() || "").includes(query) ||
      (p.RSVP_Description?.toLowerCase() || "").includes(query) ||
      (p.RSVP_Slug?.toLowerCase() || "").includes(query)
    );
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 max-w-[1600px]">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <Skeleton className="h-9 w-48 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>
          <Skeleton className="h-12 w-40" />
        </div>

        {/* Search Bar Skeleton */}
        <div className="mb-6">
          <Skeleton className="h-12 w-full" />
        </div>

        {/* Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
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
            Project RSVPs
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage RSVP configuration for projects and track event submissions
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search RSVP projects by title, description, or slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#61bc47]"
          />
        </div>
        {searchQuery && (
          <p className="text-sm text-muted-foreground mt-2">
            Found {filteredProjects.length} {filteredProjects.length === 1 ? "project" : "projects"}
          </p>
        )}
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 && searchQuery ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <h3 className="text-xl font-semibold text-foreground mb-2">
            No RSVP projects found
          </h3>
          <p className="text-muted-foreground mb-6">
            Try adjusting your search query or clear the search to see all projects.
          </p>
          <button
            onClick={() => setSearchQuery("")}
            className="inline-block border border-border bg-background hover:bg-gray-50 dark:hover:bg-gray-800 text-foreground px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Clear Search
          </button>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-card border-2 border-dashed border-border rounded-lg p-12 text-center">
          <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">
            No active RSVP projects
          </h3>
          <p className="text-muted-foreground mb-6">
            Projects with RSVP functionality enabled will appear here. Configure RSVP settings on projects in MinistryPlatform to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProjects.map((p) => (
            <ProjectCard key={p.Project_ID} project={p} />
          ))}
        </div>
      )}
    </div>
  );
}
