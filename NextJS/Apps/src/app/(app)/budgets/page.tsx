"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Calendar,
  User,
  ChevronDown,
  Search,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useProjects } from "@/hooks/useProjects";
import { usePinnedItems } from "@/hooks/usePinnedItems";
import type { Project } from "@/types/projects";
import { getBudgetUrl } from "@/types/projects";
import PinButton from "@/components/PinButton";

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

function calculateIncomePercentage(project: Project) {
  if (project.totalExpectedIncome === 0) return 0;
  return (project.totalActualIncome / project.totalExpectedIncome) * 100;
}

export default function BudgetsPage() {
  const router = useRouter();
  const { projects, isLoading, error, refetch } = useProjects();
  const { isPinned, pinItem, unpinItem } = usePinnedItems();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSeries, setExpandedSeries] = useState<Record<string, boolean>>({});
  const [selectedProjectByType, setSelectedProjectByType] = useState<Record<string, string>>({});
  const [clickedCard, setClickedCard] = useState<string | null>(null);

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

  const handleCardClick = (project: Project, e: React.MouseEvent) => {
    // Don't navigate if clicking on the pin button or select dropdown
    if ((e.target as HTMLElement).closest('[data-no-navigate]')) {
      return;
    }

    const url = getBudgetUrl(project);
    setClickedCard(project.slug);
    router.push(url);
  };

  const handleCardHover = (project: Project) => {
    const url = getBudgetUrl(project);
    router.prefetch(url);
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
              project budgets
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary dark:text-foreground">
          budgets
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage budgets for large events and ministry projects.
        </p>
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
            href="/budgets/new"
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

            // Get the selected project from state, or default to the newest project (first in array after sorting)
            const selectedSlug = selectedProjectByType[typeId];
            const displayedProject = selectedSlug
              ? typeProjects.find(p => p.slug === selectedSlug) || typeProjects[0]
              : typeProjects[0];

            return (
              <div
                key={typeId}
                className={`group bg-card border border-border rounded-lg overflow-hidden hover:shadow-xl hover:border-[#61BC47]/50 transition-all cursor-pointer active:scale-[0.98] ${
                  clickedCard === displayedProject.slug ? 'opacity-70' : ''
                }`}
                onClick={(e) => handleCardClick(displayedProject, e)}
                onMouseEnter={() => handleCardHover(displayedProject)}
              >
                <div className="p-6">
                  {/* Title with integrated dropdown for multiple projects of same type */}
                  {typeProjects.length > 1 ? (
                    <div className="relative mb-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <h2 className="text-lg font-bold text-foreground whitespace-nowrap overflow-hidden text-ellipsis">
                          {displayedProject.title}
                        </h2>
                        <ChevronDown className="w-5 h-5 text-foreground flex-shrink-0" />
                      </div>
                      <div data-no-navigate onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                        <PinButton
                          itemType="budget-project"
                          itemId={displayedProject.slug}
                          route={getBudgetUrl(displayedProject)}
                          itemData={{
                            title: displayedProject.title,
                            subtitle: displayedProject.coordinator.displayName,
                            icon: "Calendar",
                            stats: [
                              {
                                label: "Expenses",
                                actual: formatCurrency(displayedProject.totalActual),
                                expected: formatCurrency(displayedProject.totalEstimated),
                              },
                              {
                                label: "Income",
                                actual: formatCurrency(displayedProject.totalActualIncome),
                                expected: formatCurrency(displayedProject.totalExpectedIncome),
                              },
                            ],
                          }}
                          isPinned={isPinned("budget-project", displayedProject.slug)}
                          onPin={pinItem}
                          onUnpin={unpinItem}
                          className="relative z-20 flex-shrink-0"
                        />
                      </div>
                      <div data-no-navigate className="absolute inset-0" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                        <select
                          value={displayedProject.slug}
                          onChange={(e) => {
                            setSelectedProjectByType(prev => ({
                              ...prev,
                              [typeId]: e.target.value
                            }));
                          }}
                          className="opacity-0 cursor-pointer w-full h-full"
                        >
                          {typeProjects.map((typeProject) => (
                            <option key={typeProject.id} value={typeProject.slug}>
                              {typeProject.title} ({typeProject.status})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-4 flex items-center justify-between gap-4">
                      <h2 className="text-lg font-bold text-foreground whitespace-nowrap overflow-hidden text-ellipsis flex-1 min-w-0">
                        {displayedProject.title}
                      </h2>
                      <div data-no-navigate onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                        <PinButton
                          itemType="budget-project"
                          itemId={displayedProject.slug}
                          route={getBudgetUrl(displayedProject)}
                          itemData={{
                            title: displayedProject.title,
                            subtitle: displayedProject.coordinator.displayName,
                            icon: "Calendar",
                            stats: [
                              {
                                label: "Expenses",
                                actual: formatCurrency(displayedProject.totalActual),
                                expected: formatCurrency(displayedProject.totalEstimated),
                              },
                              {
                                label: "Income",
                                actual: formatCurrency(displayedProject.totalActualIncome),
                                expected: formatCurrency(displayedProject.totalExpectedIncome),
                              },
                            ],
                          }}
                          isPinned={isPinned("budget-project", displayedProject.slug)}
                          onPin={pinItem}
                          onUnpin={unpinItem}
                          className="flex-shrink-0"
                        />
                      </div>
                    </div>
                  )}

                  {/* Project Details */}
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="w-4 h-4" />
                        <span>{displayedProject.coordinator.displayName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {formatDate(displayedProject.startDate)}
                          {displayedProject.endDate && displayedProject.endDate !== displayedProject.startDate && (
                            <> - {formatDate(displayedProject.endDate)}</>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Budget Summary */}
                    <div className="pt-4 border-t border-border space-y-4">
                      {/* Expenses Section */}
                      <div className="pb-3 border-b border-border/50">
                        <div className="text-xs font-semibold text-foreground mb-2">Expenses</div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden mb-2">
                          <div
                            className={`h-full rounded-full transition-all ${
                              calculateBudgetUtilization(displayedProject) < 90
                                ? "bg-[#61bc47]"
                                : calculateBudgetUtilization(displayedProject) < 100
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                            }`}
                            style={{
                              width: `${Math.min(calculateBudgetUtilization(displayedProject), 100)}%`,
                            }}
                          />
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground">spent</span>
                            <span className="text-sm font-bold text-foreground">
                              {formatCurrency(displayedProject.totalActual)}
                            </span>
                          </div>
                          <div className="flex flex-col text-right">
                            <span className="text-xs text-muted-foreground">budgeted</span>
                            <span className="text-sm font-bold text-foreground">
                              {formatCurrency(displayedProject.totalEstimated)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Income Section */}
                      <div>
                        <div className="text-xs font-semibold text-foreground mb-2">Income</div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden mb-2">
                          <div
                            className={`h-full rounded-full transition-all ${
                              calculateIncomePercentage(displayedProject) < 90
                                ? "bg-[#61bc47]"
                                : calculateIncomePercentage(displayedProject) < 100
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                            }`}
                            style={{
                              width: `${Math.min(calculateIncomePercentage(displayedProject), 100)}%`,
                            }}
                          />
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground">received</span>
                            <span className="text-sm font-bold text-foreground">
                              {formatCurrency(displayedProject.totalActualIncome)}
                            </span>
                          </div>
                          <div className="flex flex-col text-right">
                            <span className="text-xs text-muted-foreground">goal</span>
                            <span className="text-sm font-bold text-foreground">
                              {formatCurrency(displayedProject.totalExpectedIncome)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Click indicator */}
                    <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground mt-3 group-hover:text-[#61BC47] transition-colors">
                      <span>View details</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Standalone projects (no type) - shown as individual cards */}
          {standaloneProjects.map((project) => (
            <div
              key={project.id}
              className={`group bg-card border border-border rounded-lg overflow-hidden hover:shadow-xl hover:border-[#61BC47]/50 transition-all cursor-pointer active:scale-[0.98] ${
                clickedCard === project.slug ? 'opacity-70' : ''
              }`}
              onClick={(e) => handleCardClick(project, e)}
              onMouseEnter={() => handleCardHover(project)}
            >
              <div className="p-6">
                {/* Title with Add to Homescreen button */}
                <div className="mb-4 flex items-center justify-between gap-4">
                  <h2 className="text-lg font-bold text-foreground whitespace-nowrap overflow-hidden text-ellipsis flex-1 min-w-0">
                    {project.title}
                  </h2>
                  <div data-no-navigate onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                    <PinButton
                      itemType="budget-project"
                      itemId={project.slug}
                      route={getBudgetUrl(project)}
                      itemData={{
                        title: project.title,
                        subtitle: project.coordinator.displayName,
                        icon: "Calendar",
                        stats: [
                          {
                            label: "Expenses",
                            actual: formatCurrency(project.totalActual),
                            expected: formatCurrency(project.totalEstimated),
                          },
                          {
                            label: "Income",
                            actual: formatCurrency(project.totalActualIncome),
                            expected: formatCurrency(project.totalExpectedIncome),
                          },
                        ],
                      }}
                      isPinned={isPinned("budget-project", project.slug)}
                      onPin={pinItem}
                      onUnpin={unpinItem}
                      className="flex-shrink-0"
                    />
                  </div>
                </div>

                {/* Project Details */}
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="w-4 h-4" />
                      <span>{project.coordinator.displayName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {formatDate(project.startDate)}
                        {project.endDate && project.endDate !== project.startDate && (
                          <> - {formatDate(project.endDate)}</>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Budget Summary */}
                  <div className="pt-4 border-t border-border space-y-4">
                    {/* Expenses Section */}
                    <div className="pb-3 border-b border-border/50">
                      <div className="text-xs font-semibold text-foreground mb-2">Expenses</div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden mb-2">
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
                      <div className="flex justify-between items-center">
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground">spent</span>
                          <span className="text-sm font-bold text-foreground">
                            {formatCurrency(project.totalActual)}
                          </span>
                        </div>
                        <div className="flex flex-col text-right">
                          <span className="text-xs text-muted-foreground">budgeted</span>
                          <span className="text-sm font-bold text-foreground">
                            {formatCurrency(project.totalEstimated)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Income Section */}
                    <div>
                      <div className="text-xs font-semibold text-foreground mb-2">Income</div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden mb-2">
                        <div
                          className={`h-full rounded-full transition-all ${
                            calculateIncomePercentage(project) < 90
                              ? "bg-[#61bc47]"
                              : calculateIncomePercentage(project) < 100
                                ? "bg-yellow-500"
                                : "bg-red-500"
                          }`}
                          style={{
                            width: `${Math.min(calculateIncomePercentage(project), 100)}%`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground">received</span>
                          <span className="text-sm font-bold text-foreground">
                            {formatCurrency(project.totalActualIncome)}
                          </span>
                        </div>
                        <div className="flex flex-col text-right">
                          <span className="text-xs text-muted-foreground">goal</span>
                          <span className="text-sm font-bold text-foreground">
                            {formatCurrency(project.totalExpectedIncome)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Click indicator */}
                    <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground mt-3 group-hover:text-[#61BC47] transition-colors">
                      <span>View details</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
