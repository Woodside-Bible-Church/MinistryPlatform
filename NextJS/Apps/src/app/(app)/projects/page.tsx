"use client";

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
  ChevronUp,
  AlertCircle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useProjects } from "@/hooks/useProjects";
import type { Project } from "@/types/projects";
import { getProjectUrl } from "@/types/projects";

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
      href={getProjectUrl(project)}
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
  const { projects, isLoading, error, refetch } = useProjects();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSeries, setExpandedSeries] = useState<Record<string, boolean>>({});

  // Filter projects based on search query
  const filteredProjects = projects.filter((project) => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    return (
      (project.title?.toLowerCase() || "").includes(query) ||
      (project.description?.toLowerCase() || "").includes(query) ||
      (project.coordinator?.displayName?.toLowerCase() || "").includes(query)
    );
  });

  // Group projects by Project_Type_ID
  // Projects without a type (typeId = 0) are kept as standalone
  const projectsByType: Record<string, Project[]> = {};
  const standaloneProjects: Project[] = [];

  filteredProjects.forEach((project) => {
    if (project.typeId === 0 || !project.typeId) {
      // Projects without a type are shown as standalone cards
      standaloneProjects.push(project);
    } else {
      // Projects with a type are grouped
      const typeKey = project.typeId.toString();
      if (!projectsByType[typeKey]) {
        projectsByType[typeKey] = [];
      }
      projectsByType[typeKey].push(project);
    }
  });

  // Sort projects within each type by startDate descending (newest first)
  Object.keys(projectsByType).forEach((typeId) => {
    projectsByType[typeId].sort((a, b) => {
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
    });
  });

  // Sort standalone projects by startDate descending
  standaloneProjects.sort((a, b) => {
    return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
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
          <Skeleton className="h-12 w-full" />
        </div>

        {/* Project Cards Skeletons */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-96" />
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
              Project Budgets
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage budgets for large events and ministry projects.
            </p>
          </div>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-600 dark:text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-red-900 dark:text-red-200 mb-2">
            Failed to Load Projects
          </h3>
          <p className="text-red-700 dark:text-red-300 mb-4">
            {error.message || "An error occurred while fetching projects."}
          </p>
          <button
            onClick={refetch}
            className="bg-[#61BC47] hover:bg-[#4fa037] text-white px-6 py-3 rounded-lg font-semibold transition-colors shadow-sm hover:shadow-md"
          >
            Try Again
          </button>
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
        <div className="relative">
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Projects grouped by type */}
          {Object.entries(projectsByType).map(([typeId, typeProjects]) => {
            // Safety check: ensure typeProjects is an array with at least one item
            if (!Array.isArray(typeProjects) || typeProjects.length === 0) {
              return null;
            }

            // Show the newest project (first in array after sorting)
            const newestProject = typeProjects[0];

            return (
              <div key={typeId} className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-all">
                <div className="p-6">
                  {/* Title with integrated dropdown for multiple projects of same type */}
                  {typeProjects.length > 1 ? (
                    <div className="relative mb-3">
                      <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-bold text-foreground">
                          {newestProject.title}
                        </h2>
                        <ChevronDown className="w-5 h-5 text-foreground" />
                      </div>
                      <select
                        value={newestProject.slug}
                        onChange={(e) => {
                          const selectedProject = typeProjects.find(p => p.slug === e.target.value);
                          if (selectedProject) {
                            window.location.href = getProjectUrl(selectedProject);
                          }
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full"
                      >
                        {typeProjects.map((typeProject) => (
                          <option key={typeProject.id} value={typeProject.slug}>
                            {typeProject.title} ({typeProject.status})
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <Link href={getProjectUrl(newestProject)}>
                      <h2 className="text-2xl font-bold text-foreground mb-3 hover:text-[#61BC47] transition-colors cursor-pointer">
                        {newestProject.title}
                      </h2>
                    </Link>
                  )}

                  {/* Status Badges */}
                  <div className="mb-4 flex gap-2 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                        newestProject.status
                      )}`}
                    >
                      {newestProject.status.replace("-", " ")}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold border ${getBudgetStatusColor(
                        newestProject.budgetStatus
                      )}`}
                    >
                      {getBudgetStatusIcon(newestProject.budgetStatus)}
                      {getBudgetStatusText(newestProject.budgetStatus)}
                    </span>
                  </div>

                  {/* Project Details - Clickable Link */}
                  <Link href={getProjectUrl(newestProject)} className="block space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                        <User className="w-4 h-4" />
                        <span>{newestProject.coordinator.displayName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {formatDate(newestProject.startDate)} -{" "}
                          {formatDate(newestProject.endDate)}
                        </span>
                      </div>
                    </div>

                    {/* Budget Summary */}
                    <div className="pt-4 border-t border-border">
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Budget</div>
                          <div className="text-lg font-bold text-foreground">
                            {formatCurrency(newestProject.totalEstimated)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Actual</div>
                          <div className="text-lg font-bold text-foreground">
                            {formatCurrency(newestProject.totalActual)}
                          </div>
                        </div>
                      </div>

                      {/* Budget Progress Bar */}
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            calculateBudgetUtilization(newestProject) < 90
                              ? "bg-[#61bc47]"
                              : calculateBudgetUtilization(newestProject) < 100
                                ? "bg-yellow-500"
                                : "bg-red-500"
                          }`}
                          style={{
                            width: `${Math.min(calculateBudgetUtilization(newestProject), 100)}%`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-muted-foreground">
                          {calculateBudgetUtilization(newestProject).toFixed(1)}% utilized
                        </span>
                        <span
                          className={`text-xs font-semibold ${
                            newestProject.totalActual - newestProject.totalEstimated < 0
                              ? "text-green-600 dark:text-green-400"
                              : newestProject.totalActual - newestProject.totalEstimated > 0
                                ? "text-red-600 dark:text-red-400"
                                : "text-muted-foreground"
                          }`}
                        >
                          {newestProject.totalActual - newestProject.totalEstimated >= 0 ? "+" : ""}
                          {formatCurrency(newestProject.totalActual - newestProject.totalEstimated)}
                        </span>
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            );
          })}

          {/* Standalone projects (no type) - shown as individual cards */}
          {standaloneProjects.map((project) => (
            <div key={project.id} className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-all">
              <div className="p-6">
                {/* Title - clickable link */}
                <Link href={getProjectUrl(project)}>
                  <h2 className="text-2xl font-bold text-foreground mb-3 hover:text-[#61BC47] transition-colors cursor-pointer">
                    {project.title}
                  </h2>
                </Link>

                {/* Status Badges */}
                <div className="mb-4 flex gap-2 flex-wrap">
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                      project.status
                    )}`}
                  >
                    {project.status.replace("-", " ")}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold border ${getBudgetStatusColor(
                      project.budgetStatus
                    )}`}
                  >
                    {getBudgetStatusIcon(project.budgetStatus)}
                    {getBudgetStatusText(project.budgetStatus)}
                  </span>
                </div>

                {/* Project Details - Clickable Link */}
                <Link href={getProjectUrl(project)} className="block space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                      <User className="w-4 h-4" />
                      <span>{project.coordinator.displayName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {formatDate(project.startDate)} -{" "}
                        {formatDate(project.endDate)}
                      </span>
                    </div>
                  </div>

                  {/* Budget Summary */}
                  <div className="pt-4 border-t border-border">
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Budget</div>
                        <div className="text-lg font-bold text-foreground">
                          {formatCurrency(project.totalEstimated)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Actual</div>
                        <div className="text-lg font-bold text-foreground">
                          {formatCurrency(project.totalActual)}
                        </div>
                      </div>
                    </div>

                    {/* Budget Progress Bar */}
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          calculateBudgetUtilization(project) < 90
                            ? "bg-[#61bc47]"
                            : calculateBudgetUtilization(project) < 100
                              ? "bg-yellow-500"
                              : "bg-red-500"
                        }`}
                        style={{
                          width: `${Math.min(calculateBudgetUtilization(project), 100)}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-muted-foreground">
                        {calculateBudgetUtilization(project).toFixed(1)}% utilized
                      </span>
                      <span
                        className={`text-xs font-semibold ${
                          project.totalActual - project.totalEstimated < 0
                            ? "text-green-600 dark:text-green-400"
                            : project.totalActual - project.totalEstimated > 0
                              ? "text-red-600 dark:text-red-400"
                              : "text-muted-foreground"
                        }`}
                      >
                        {project.totalActual - project.totalEstimated >= 0 ? "+" : ""}
                        {formatCurrency(project.totalActual - project.totalEstimated)}
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
