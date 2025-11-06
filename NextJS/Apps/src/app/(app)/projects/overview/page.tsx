"use client";

import { mockProjects } from "@/data/mockProjects";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function BudgetOverviewPage() {
  // Calculate overall statistics
  const totalProjects = mockProjects.length;

  const projectStats = mockProjects.map((project) => {
    const expenseCategories = project.categories.filter((c) => c.type === "expense");
    const revenueCategories = project.categories.filter((c) => c.type === "revenue");

    const totalExpensesEstimated = expenseCategories.reduce((sum, c) => sum + c.estimated, 0);
    const totalExpensesActual = expenseCategories.reduce((sum, c) => sum + c.actual, 0);
    const totalRevenueEstimated = revenueCategories.reduce((sum, c) => sum + c.estimated, 0);
    const totalRevenueActual = revenueCategories.reduce((sum, c) => sum + c.actual, 0);

    const budgetUtilization = totalExpensesEstimated > 0
      ? (totalExpensesActual / totalExpensesEstimated) * 100
      : 0;

    const profitLoss = totalRevenueActual - totalExpensesActual;

    return {
      ...project,
      totalExpensesEstimated,
      totalExpensesActual,
      totalRevenueEstimated,
      totalRevenueActual,
      budgetUtilization,
      profitLoss,
    };
  });

  const totalBudget = projectStats.reduce((sum, p) => sum + p.totalExpensesEstimated, 0);
  const totalSpent = projectStats.reduce((sum, p) => sum + p.totalExpensesActual, 0);
  const totalRevenue = projectStats.reduce((sum, p) => sum + p.totalRevenueActual, 0);
  const overallUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  // Count projects by status
  const activeProjects = projectStats.filter((p) => p.status === "in-progress").length;
  const completedProjects = projectStats.filter((p) => p.status === "completed").length;

  // Projects at risk (over 90% budget utilization or over budget)
  const atRiskProjects = projectStats.filter(
    (p) => p.budgetUtilization > 90 || p.totalExpensesActual > p.totalExpensesEstimated
  );

  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 max-w-[1600px]">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-primary dark:text-foreground mb-2">
              Budget Overview
            </h1>
            <p className="text-muted-foreground">
              Organization-wide budget health and project status
            </p>
          </div>
          <Link
            href="/projects"
            className="border border-border bg-card hover:bg-gray-50 dark:hover:bg-gray-800 text-foreground px-6 py-3 rounded-lg font-semibold transition-colors shadow-sm"
          >
            View All Projects
          </Link>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              {activeProjects} active, {completedProjects} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalBudget)}</div>
            <p className="text-xs text-muted-foreground">
              Across all projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSpent)}</div>
            <p className="text-xs text-muted-foreground">
              {overallUtilization.toFixed(1)}% utilization
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">At Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {atRiskProjects.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Projects over 90% budget
            </p>
          </CardContent>
        </Card>
      </div>

      {/* At Risk Projects Alert */}
      {atRiskProjects.length > 0 && (
        <div className="mb-8 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5" />
            <div>
              <h3 className="font-semibold text-orange-900 dark:text-orange-200">
                {atRiskProjects.length} {atRiskProjects.length === 1 ? "Project" : "Projects"} Need Attention
              </h3>
              <p className="text-sm text-orange-800 dark:text-orange-300 mt-1">
                The following projects have exceeded 90% of their budget or are over budget
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Projects List */}
      <div className="grid grid-cols-1 gap-6">
        {projectStats.map((project) => {
          const isOverBudget = project.totalExpensesActual > project.totalExpensesEstimated;
          const isAtRisk = project.budgetUtilization > 90 && !isOverBudget;
          const isOnTrack = project.budgetUtilization <= 90;

          return (
            <Card key={project.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{project.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {project.description}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                        project.status === "in-progress"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          : project.status === "completed"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                      }`}
                    >
                      {project.status}
                    </span>
                    {isOverBudget && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        <AlertTriangle className="w-3 h-3" />
                        Over Budget
                      </span>
                    )}
                    {isAtRisk && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                        <AlertTriangle className="w-3 h-3" />
                        At Risk
                      </span>
                    )}
                    {isOnTrack && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        <CheckCircle className="w-3 h-3" />
                        On Track
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Budget</div>
                    <div className="text-lg font-semibold text-foreground">
                      {formatCurrency(project.totalExpensesEstimated)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Spent</div>
                    <div className="text-lg font-semibold text-foreground">
                      {formatCurrency(project.totalExpensesActual)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Remaining</div>
                    <div
                      className={`text-lg font-semibold ${
                        project.totalExpensesEstimated - project.totalExpensesActual >= 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {formatCurrency(project.totalExpensesEstimated - project.totalExpensesActual)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Profit/Loss</div>
                    <div
                      className={`text-lg font-semibold ${
                        project.profitLoss >= 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {formatCurrency(project.profitLoss)}
                    </div>
                  </div>
                </div>

                {/* Budget Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-foreground">
                      Budget Utilization
                    </span>
                    <span
                      className={`text-sm font-semibold ${
                        isOverBudget
                          ? "text-red-600 dark:text-red-400"
                          : isAtRisk
                            ? "text-orange-600 dark:text-orange-400"
                            : "text-green-600 dark:text-green-400"
                      }`}
                    >
                      {project.budgetUtilization.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full transition-all ${
                        isOverBudget
                          ? "bg-red-600"
                          : isAtRisk
                            ? "bg-orange-500"
                            : "bg-green-500"
                      }`}
                      style={{
                        width: `${Math.min(project.budgetUtilization, 100)}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Link
                    href={`/projects/${project.id}`}
                    className="border border-border bg-background hover:bg-gray-50 dark:hover:bg-gray-800 text-foreground px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                  >
                    View Budget
                  </Link>
                  <Link
                    href={`/projects/${project.id}/reports`}
                    className="border border-border bg-background hover:bg-gray-50 dark:hover:bg-gray-800 text-foreground px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                  >
                    View Reports
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
