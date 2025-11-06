"use client";

import { mockProjects, mockProjectSeries, getProjectsBySeries, type Project } from "@/data/mockProjects";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  DollarSign,
  User,
  ChevronRight,
  ChevronDown,
  Search,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

function getBudgetStatusColor(status: Project["budgetStatus"]) {
  switch (status) {
    case "under":
      return "text-green-600 bg-green-50 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800";
    case "on-track":
      return "text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800";
    case "over":
      return "text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800";
  }
}

function getBudgetStatusIcon(status: Project["budgetStatus"]) {
  switch (status) {
    case "under":
      return <TrendingDown className="w-4 h-4" />;
    case "on-track":
      return <Minus className="w-4 h-4" />;
    case "over":
      return <TrendingUp className="w-4 h-4" />;
  }
}

function getBudgetStatusText(status: Project["budgetStatus"]) {
  switch (status) {
    case "under":
      return "Under Budget";
    case "on-track":
      return "On Track";
    case "over":
      return "Over Budget";
  }
}

function getStatusColor(status: Project["status"]) {
  switch (status) {
    case "draft":
      return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
    case "pending":
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400";
    case "approved":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400";
    case "in-progress":
      return "bg-[#61bc47]/10 text-[#61bc47] border border-[#61bc47]/20";
    case "completed":
      return "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400";
    case "closed":
      return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
  }
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function calculateBudgetUtilization(project: Project) {
  if (project.totalEstimated === 0) return 0;
  return (project.totalActual / project.totalEstimated) * 100;
}

function ProjectCard({ project }: { project: Project }) {
  const utilization = calculateBudgetUtilization(project);
  const variance = project.totalActual - project.totalEstimated;
  const variancePercent =
    project.totalEstimated > 0
      ? (variance / project.totalEstimated) * 100
      : 0;

  return (
    <Link
      href={`/projects/${project.id}`}
      className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-xl hover:border-primary/50 dark:hover:border-[#61bc47]/50 transition-all group"
    >
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl font-semibold text-foreground flex-1 pr-2 group-hover:text-[#61bc47] transition-colors">
            {project.title}
          </h3>
          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-[#61bc47] group-hover:translate-x-1 transition-all" />
        </div>

        <div className="flex gap-2 flex-wrap">
          <span
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
              project.status
            )}`}
          >
            {project.status.replace("-", " ")}
          </span>
          <span
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border ${getBudgetStatusColor(
              project.budgetStatus
            )}`}
          >
            {getBudgetStatusIcon(project.budgetStatus)}
            {getBudgetStatusText(project.budgetStatus)}
          </span>
        </div>
      </div>

      {/* Budget Summary */}
      <div className="p-6 space-y-4">
        {/* Progress Bar */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-muted-foreground">
              Budget Utilization
            </span>
            <span className="text-sm font-bold text-foreground">
              {utilization.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                utilization < 90
                  ? "bg-[#61bc47]"
                  : utilization < 100
                    ? "bg-yellow-500"
                    : "bg-red-500"
              }`}
              style={{ width: `${Math.min(utilization, 100)}%` }}
            />
          </div>
        </div>

        {/* Budget Numbers */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-muted-foreground mb-1">
              Estimated
            </div>
            <div className="text-lg font-bold text-foreground">
              {formatCurrency(project.totalEstimated)}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">
              Actual
            </div>
            <div className="text-lg font-bold text-foreground">
              {formatCurrency(project.totalActual)}
            </div>
          </div>
        </div>

        {/* Variance */}
        <div className="pt-3 border-t border-border">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              Variance
            </span>
            <span
              className={`text-sm font-semibold ${
                variance < 0
                  ? "text-green-600 dark:text-green-400"
                  : variance > 0
                    ? "text-red-600 dark:text-red-400"
                    : "text-muted-foreground"
              }`}
            >
              {variance >= 0 ? "+" : ""}
              {formatCurrency(variance)}{" "}
              <span className="text-xs">
                ({variancePercent >= 0 ? "+" : ""}
                {variancePercent.toFixed(1)}%)
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 pb-6 space-y-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4" />
          <span>{project.coordinator.displayName}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <span>
            {formatDate(project.startDate)} -{" "}
            {formatDate(project.endDate)}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function ProjectsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSeries, setExpandedSeries] = useState<Record<string, boolean>>({});

  // Simulate loading for better UX
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      // Expand all series by default
      const defaultExpanded: Record<string, boolean> = {};
      mockProjectSeries.forEach((series) => {
        defaultExpanded[series.id] = true;
      });
      setExpandedSeries(defaultExpanded);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Filter projects based on search query
  const filteredProjects = mockProjects.filter((project) => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    return (
      (project.title?.toLowerCase() || "").includes(query) ||
      (project.description?.toLowerCase() || "").includes(query) ||
      (project.coordinator?.displayName?.toLowerCase() || "").includes(query)
    );
  });

  // Group projects by series
  const projectsBySeries: Record<string, Project[]> = {};
  const standaloneProjects: Project[] = [];

  filteredProjects.forEach((project) => {
    if (project.seriesId) {
      if (!projectsBySeries[project.seriesId]) {
        projectsBySeries[project.seriesId] = [];
      }
      projectsBySeries[project.seriesId].push(project);
    } else {
      standaloneProjects.push(project);
    }
  });

  // Sort projects within each series by year descending
  Object.keys(projectsBySeries).forEach((seriesId) => {
    projectsBySeries[seriesId].sort((a, b) => (b.year || 0) - (a.year || 0));
  });

  const toggleSeries = (seriesId: string) => {
    setExpandedSeries((prev) => ({
      ...prev,
      [seriesId]: !prev[seriesId],
    }));
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 max-w-[1600px]">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <Skeleton className="h-9 w-48 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-12 w-32" />
            <Skeleton className="h-12 w-40" />
          </div>
        </div>

        {/* Search Bar Skeleton */}
        <div className="mb-6">
          <Skeleton className="h-12 w-full max-w-md" />
        </div>

        {/* Series Skeletons */}
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card border border-border rounded-lg p-6">
              <Skeleton className="h-8 w-64 mb-4" />
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3].map((j) => (
                  <Skeleton key={j} className="h-64" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 max-w-[1600px]">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-primary dark:text-foreground">
            Project Budgets
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage budgets for large events and ministry projects.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/projects/overview"
            className="border border-border bg-card hover:bg-gray-50 dark:hover:bg-gray-800 text-foreground px-6 py-3 rounded-lg font-semibold transition-colors shadow-sm"
          >
            Overview
          </Link>
          <Link
            href="/projects/new"
            className="bg-[#61BC47] hover:bg-[#4fa037] text-white px-6 py-3 rounded-lg font-semibold transition-colors shadow-sm hover:shadow-md"
          >
            + New Project
          </Link>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search projects by name, description, or coordinator..."
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

      {filteredProjects.length === 0 && searchQuery ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <h3 className="text-xl font-semibold text-foreground mb-2">
            No projects found
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
          <h3 className="text-xl font-semibold text-foreground mb-2">
            No projects yet
          </h3>
          <p className="text-muted-foreground mb-6">
            Create your first project to start tracking budgets and expenses.
          </p>
          <Link
            href="/projects/new"
            className="inline-block bg-[#61BC47] hover:bg-[#4fa037] text-white px-6 py-3 rounded-lg font-semibold transition-colors shadow-sm hover:shadow-md"
          >
            Create Project
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Series Sections */}
          {mockProjectSeries.map((series) => {
            const seriesProjects = projectsBySeries[series.id] || [];
            if (seriesProjects.length === 0) return null;

            const isExpanded = expandedSeries[series.id];

            return (
              <div key={series.id} className="bg-card border border-border rounded-lg overflow-hidden">
                {/* Series Header */}
                <button
                  onClick={() => toggleSeries(series.id)}
                  className="w-full px-6 py-4 bg-zinc-50 dark:bg-zinc-900 border-b border-border hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className={`transform transition-transform ${isExpanded ? 'rotate-0' : '-rotate-90'}`}>
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="text-left">
                      <h2 className="text-2xl font-bold text-foreground">
                        {series.name}
                      </h2>
                      {series.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {series.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {seriesProjects.length} {seriesProjects.length === 1 ? "project" : "projects"}
                  </div>
                </button>

                {/* Series Projects */}
                {isExpanded && (
                  <div className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                      {seriesProjects.map((project) => (
                        <ProjectCard key={project.id} project={project} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Standalone Projects */}
          {standaloneProjects.length > 0 && (
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-900 border-b border-border">
                <h2 className="text-2xl font-bold text-foreground">
                  Other Projects
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Projects not part of a recurring series
                </p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {standaloneProjects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
