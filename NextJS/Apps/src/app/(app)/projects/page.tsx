"use client";

import { mockProjects, type Project } from "@/data/mockProjects";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  DollarSign,
  User,
  ChevronRight,
} from "lucide-react";

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

export default function ProjectsPage() {
  const projects = mockProjects;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-primary dark:text-foreground">
            Project Budgets
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage budgets for large events and ministry projects.
          </p>
        </div>
        <Link
          href="/projects/new"
          className="bg-[#61BC47] hover:bg-[#4fa037] text-white px-6 py-3 rounded-lg font-semibold transition-colors shadow-sm hover:shadow-md"
        >
          + New Project
        </Link>
      </div>

      {projects.length === 0 ? (
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
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {projects.map((project) => {
            const utilization = calculateBudgetUtilization(project);
            const variance = project.totalActual - project.totalEstimated;
            const variancePercent =
              project.totalEstimated > 0
                ? (variance / project.totalEstimated) * 100
                : 0;

            return (
              <Link
                key={project.id}
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
          })}
        </div>
      )}
    </div>
  );
}
