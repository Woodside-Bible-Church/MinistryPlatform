"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TrendingUp, Search, ChevronDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

type RSVPProject = {
  Project_ID: number;
  Project_Title: string;
  Project_Type_ID: number | null;
  Project_Type: string | null;
  RSVP_Title: string | null;
  RSVP_Description: string | null;
  RSVP_Start_Date: string | null;
  RSVP_End_Date: string | null;
  RSVP_Is_Active: boolean | null;
  RSVP_Slug: string | null;
  RSVP_Image_URL: string | null;
  Event_Count: number;
  RSVP_Count: number;
};

function ProjectCard({ project, typeProjects }: { project: RSVPProject; typeProjects?: RSVPProject[] }) {
  const router = useRouter();
  const displayTitle = project.RSVP_Title || project.Project_Title;
  const hasMultipleInType = typeProjects && typeProjects.length > 1;

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-all">
      <Link href={`/rsvp/${project.RSVP_Slug}`} className="block">
        <div className="p-6">
          {/* Project Title with dropdown if multiple in same type */}
          {hasMultipleInType ? (
            <div className="relative inline-block mb-3 group">
              <label className="flex items-center gap-2 cursor-pointer">
                <h2 className="text-2xl font-bold text-foreground group-hover:text-[#61bc47] transition-colors">
                  {project.Project_Title}
                </h2>
                <ChevronDown className="w-5 h-5 text-foreground group-hover:text-[#61bc47] transition-colors" />
                <select
                  value={project.Project_ID}
                  onChange={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const selectedProject = typeProjects.find(p => p.Project_ID === parseInt(e.target.value));
                    if (selectedProject?.RSVP_Slug) {
                      window.location.href = `/rsvp/${selectedProject.RSVP_Slug}`;
                    }
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                >
                  {typeProjects.map((p) => (
                    <option key={p.Project_ID} value={p.Project_ID}>
                      {p.Project_Title}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ) : (
            <h2 className="text-2xl font-bold text-foreground mb-3 hover:text-[#61bc47] transition-colors">
              {project.Project_Title}
            </h2>
          )}

          {/* RSVP Image */}
          {project.RSVP_Image_URL && (
            <div className="mb-4 rounded-lg overflow-hidden">
              <img
                src={project.RSVP_Image_URL}
                alt={displayTitle}
                className="w-full h-auto object-cover"
              />
            </div>
          )}

          {/* RSVP Title */}
          {project.RSVP_Title && (
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {project.RSVP_Title}
            </h3>
          )}

          {/* RSVP Description */}
          {project.RSVP_Description && (
            <div
              className="text-sm text-muted-foreground line-clamp-3"
              dangerouslySetInnerHTML={{ __html: project.RSVP_Description }}
            />
          )}
        </div>
      </Link>
    </div>
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
        console.log("RSVP Projects loaded:", data);
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
      (p.RSVP_Slug?.toLowerCase() || "").includes(query) ||
      (p.Project_Title?.toLowerCase() || "").includes(query)
    );
  });

  // Group projects by Project_Type_ID
  const projectsByType: Record<string, RSVPProject[]> = {};
  const standaloneProjects: RSVPProject[] = [];

  filteredProjects.forEach((project) => {
    if (project.Project_Type_ID) {
      const typeKey = project.Project_Type_ID.toString();
      if (!projectsByType[typeKey]) {
        projectsByType[typeKey] = [];
      }
      projectsByType[typeKey].push(project);
    } else {
      standaloneProjects.push(project);
    }
  });

  // Sort projects within each type by start date descending (most recent first)
  Object.keys(projectsByType).forEach((typeId) => {
    projectsByType[typeId].sort((a, b) => {
      const dateA = a.RSVP_Start_Date ? new Date(a.RSVP_Start_Date).getTime() : 0;
      const dateB = b.RSVP_Start_Date ? new Date(b.RSVP_Start_Date).getTime() : 0;
      return dateB - dateA;
    });
  });

  // Convert to array and sort by the most recent project's date in each group
  const sortedProjectGroups = Object.entries(projectsByType)
    .map(([typeId, typeProjects]) => ({
      typeId,
      projects: typeProjects,
      mostRecentDate: typeProjects[0]?.RSVP_Start_Date
        ? new Date(typeProjects[0].RSVP_Start_Date).getTime()
        : 0,
    }))
    .sort((a, b) => b.mostRecentDate - a.mostRecentDate);

  console.log("Sorted project groups:", sortedProjectGroups.map(g => ({
    type: g.typeId,
    mostRecent: g.projects[0]?.Project_Title,
    date: g.projects[0]?.RSVP_Start_Date,
    allProjects: g.projects.map(p => ({ title: p.Project_Title, date: p.RSVP_Start_Date }))
  })));

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
          {/* Projects grouped by type - show most recent with dropdown */}
          {sortedProjectGroups.map((group) => {
            const mostRecentProject = group.projects[0]; // Already sorted by date desc
            return (
              <ProjectCard
                key={mostRecentProject.Project_ID}
                project={mostRecentProject}
                typeProjects={group.projects}
              />
            );
          })}

          {/* Standalone projects without a type */}
          {standaloneProjects.map((project) => (
            <ProjectCard key={project.Project_ID} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
