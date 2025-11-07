"use client";

import { mockProjects, getProjectsBySeries, getSeriesById, type BudgetCategory } from "@/data/mockProjects";
import { use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  User,
  DollarSign,
  PieChart as PieChartIcon,
  Receipt,
  Plus,
  ChevronDown,
  ChevronRight,
  List,
  BarChart3,
} from "lucide-react";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { PieChart, Pie, Cell, ResponsiveContainer, Label, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from "recharts";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function CategorySection({ category, projectId }: { category: BudgetCategory; projectId: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const variance = category.actual - category.estimated;
  const variancePercent =
    category.estimated > 0 ? (variance / category.estimated) * 100 : 0;

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Category Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 bg-zinc-300 dark:bg-black border-b border-border hover:bg-zinc-400 dark:hover:bg-zinc-900 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isExpanded ? (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            )}
            <h3 className="text-lg font-semibold text-foreground">
              {category.name}
            </h3>
            <span
              className={`text-xs px-2 py-1 rounded-full font-medium ${
                category.type === "revenue"
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
              }`}
            >
              {category.type === "revenue" ? "Revenue" : "Expense"}
            </span>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Total</div>
              <div className="font-bold text-foreground">
                {formatCurrency(category.actual)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Budgeted</div>
              <div className="font-semibold text-muted-foreground">
                {formatCurrency(category.estimated)}
              </div>
            </div>
            <div className="text-right min-w-[100px]">
              <div className="text-xs text-muted-foreground">Variance</div>
              <div
                className={`font-semibold ${
                  category.type === "revenue"
                    ? variance >= 0
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                    : variance <= 0
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                }`}
              >
                {variance >= 0 ? "+" : ""}
                {formatCurrency(variance)}
              </div>
            </div>
          </div>
        </div>
      </button>

      {/* Line Items Table */}
      {isExpanded && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-zinc-200 dark:bg-zinc-900 border-b border-border">
                <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">
                  Estimated
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">
                  Actual
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">
                  Variance
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {category.lineItems.map((item) => {
                const itemVariance = item.actual - item.estimated;
                const itemVariancePercent =
                  item.estimated > 0 ? (itemVariance / item.estimated) * 100 : 0;

                return (
                  <tr key={item.id} className="bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                    <Link
                      href={`/projects/${projectId}/items/${item.id}`}
                      className="contents cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-foreground">
                            {item.name}
                          </div>
                          {item.description && (
                            <div className="text-sm text-muted-foreground mt-1">
                              {item.description}
                            </div>
                          )}
                          {item.vendor && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Vendor: {item.vendor}
                            </div>
                          )}
                          {item.quantity && item.unitPrice !== undefined && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {item.quantity} × {formatCurrency(item.unitPrice)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-gray-700 dark:text-gray-300">
                        {formatCurrency(item.estimated)}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-foreground">
                        {formatCurrency(item.actual)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div
                          className={`font-medium ${
                            category.type === "revenue"
                              ? itemVariance >= 0
                                ? "text-green-600 dark:text-green-400"
                                : "text-red-600 dark:text-red-400"
                              : itemVariance <= 0
                                ? "text-green-600 dark:text-green-400"
                                : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {itemVariance >= 0 ? "+" : ""}
                          {formatCurrency(itemVariance)}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          ({itemVariance >= 0 ? "+" : ""}
                          {itemVariancePercent.toFixed(1)}%)
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                            item.status === "paid"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : item.status === "ordered"
                                ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                                : item.status === "pending"
                                  ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                  : item.status === "received"
                                    ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                                    : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </Link>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const project = mockProjects.find((p) => p.id === id);

  const [isLoading, setIsLoading] = useState(true);
  const [isAddLineItemOpen, setIsAddLineItemOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"expenses" | "income">("expenses");
  const [lineItemFormData, setLineItemFormData] = useState({
    name: "",
    description: "",
    category: "",
    estimated: "",
    quantity: "",
    unitPrice: "",
    vendor: "",
    status: "pending" as const,
  });

  // Simulate loading for better UX
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 max-w-[1600px]">
        {/* Header Skeleton */}
        <div className="mb-8">
          <Skeleton className="h-4 w-32 mb-4" />
          <div className="flex justify-between items-start">
            <div>
              <Skeleton className="h-10 w-96 mb-2" />
              <div className="flex items-center gap-4">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
            <div className="flex gap-3">
              <Skeleton className="h-12 w-32" />
              <Skeleton className="h-12 w-40" />
            </div>
          </div>
        </div>

        {/* Toggle Skeleton */}
        <div className="mb-6 flex justify-between items-center">
          <div className="flex-1" />
          <Skeleton className="h-12 w-64" />
          <div className="flex-1 flex justify-end">
            <Skeleton className="h-12 w-40" />
          </div>
        </div>

        {/* Summary Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-5 rounded-full" />
              </div>
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-3 w-40" />
            </div>
          ))}
        </div>

        {/* Category Skeletons */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card border border-border rounded-lg overflow-hidden">
              <Skeleton className="h-20 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 max-w-[1600px]">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Project Not Found
          </h2>
          <p className="text-muted-foreground mb-6">
            The project you're looking for doesn't exist.
          </p>
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 text-[#61bc47] hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  const expenseCategories = project.categories.filter((c) => c.type === "expense");
  const revenueCategories = project.categories.filter((c) => c.type === "revenue");

  // Get series info and related years if project is part of a series
  const series = project.seriesId ? getSeriesById(project.seriesId) : undefined;
  const seriesProjects = project.seriesId ? getProjectsBySeries(project.seriesId) : [];

  const totalExpensesEstimated = expenseCategories.reduce(
    (sum, c) => sum + c.estimated,
    0
  );
  const totalExpensesActual = expenseCategories.reduce(
    (sum, c) => sum + c.actual,
    0
  );

  const totalRevenueEstimated = revenueCategories.reduce(
    (sum, c) => sum + c.estimated,
    0
  );
  const totalRevenueActual = revenueCategories.reduce((sum, c) => sum + c.actual, 0);

  const profitLossEstimated = totalRevenueEstimated - totalExpensesEstimated;
  const profitLossActual = totalRevenueActual - totalExpensesActual;

  const budgetUtilization =
    totalExpensesEstimated > 0
      ? (totalExpensesActual / totalExpensesEstimated) * 100
      : 0;

  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 max-w-[1600px]">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-[#61bc47] mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </Link>

        <div className="flex justify-between items-start">
          <div>
            {/* Title with integrated series dropdown */}
            {series && seriesProjects.length > 1 ? (
              <div className="relative inline-block mb-2 group">
                <label className="flex items-center gap-3 cursor-pointer">
                  <h1 className="text-4xl font-bold text-primary dark:text-foreground group-hover:text-[#61BC47] transition-colors">
                    {project.title}
                  </h1>
                  <ChevronDown className="w-6 h-6 text-primary dark:text-foreground group-hover:text-[#61BC47] transition-colors" />
                  <select
                    value={id}
                    onChange={(e) => {
                      window.location.href = `/projects/${e.target.value}`;
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  >
                    {seriesProjects.map((seriesProject) => (
                      <option key={seriesProject.id} value={seriesProject.id}>
                        {seriesProject.title} ({seriesProject.status})
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            ) : (
              <h1 className="text-4xl font-bold text-primary dark:text-foreground mb-2">
                {project.title}
              </h1>
            )}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>{project.coordinator.displayName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>
                  {formatDate(project.startDate)} - {formatDate(project.endDate)}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 w-[360px]">
            <Link
              href={`/projects/${id}/reports`}
              className="border border-border bg-card hover:bg-gray-50 dark:hover:bg-gray-800 text-foreground px-4 py-3 rounded-lg font-semibold transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              <BarChart3 className="w-5 h-5" />
              <span>Reports</span>
            </Link>
            <Link
              href={`/projects/${id}/transactions`}
              className="border border-border bg-card hover:bg-gray-50 dark:hover:bg-gray-800 text-foreground px-4 py-3 rounded-lg font-semibold transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              <List className="w-5 h-5" />
              <span>Transactions</span>
            </Link>
          </div>
        </div>
      </div>

      {/* View Toggle and Add Button */}
      <div className="mb-6 flex justify-between items-center">
        <div className="flex-1" /> {/* Spacer for centering */}
        <button
          onClick={() => setViewMode(viewMode === "expenses" ? "income" : "expenses")}
          className="relative inline-flex rounded-xl bg-zinc-100 dark:bg-zinc-800 p-1 shadow-inner cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
        >
          {/* Sliding background indicator */}
          <div
            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-[#61BC47] rounded-lg shadow-md transition-all duration-300 ease-in-out pointer-events-none ${
              viewMode === "expenses" ? "left-1" : "left-[calc(50%+4px-1px)]"
            }`}
          />

          {/* Labels */}
          <div
            className={`relative z-10 px-8 py-2.5 rounded-lg font-medium transition-all duration-300 pointer-events-none ${
              viewMode === "expenses"
                ? "text-white"
                : "text-muted-foreground"
            }`}
          >
            Expenses
          </div>
          <div
            className={`relative z-10 px-8 py-2.5 rounded-lg font-medium transition-all duration-300 pointer-events-none ${
              viewMode === "income"
                ? "text-white"
                : "text-muted-foreground"
            }`}
          >
            Income
          </div>
        </button>
        <div className="flex-1 flex justify-end">
          <button
            onClick={() => setIsAddLineItemOpen(true)}
            className="bg-[#61BC47] hover:bg-[#4fa037] text-white px-6 py-3 rounded-lg font-semibold transition-colors shadow-sm hover:shadow-md flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {viewMode === "expenses" ? "Add Expense" : "Add Income"}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {viewMode === "expenses" ? (
        <>
          {/* Single Row: 2 Cards - Radar Chart + Budget Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Card 1: Radar Chart */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Spending by Category
                </h3>
                <PieChartIcon className="w-5 h-5 text-muted-foreground" />
              </div>
              {expenseCategories.filter(cat => cat.estimated > 0 || cat.actual > 0).length < 2 ? (
                <div className="h-[360px] flex items-center justify-center">
                  <p className="text-muted-foreground text-sm">No data to show</p>
                </div>
              ) : (
                <ChartContainer
                  config={{
                    estimated: {
                      label: "Budget",
                      color: "hsl(217, 91%, 60%)",
                    },
                    actual: {
                      label: "Actual",
                      color: "hsl(142, 76%, 36%)",
                    },
                  } satisfies ChartConfig}
                  className="h-[360px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart
                      data={expenseCategories.map((cat) => ({
                        category: cat.name.length > 20 ? cat.name.substring(0, 18) + "..." : cat.name,
                        estimated: cat.estimated,
                        actual: cat.actual,
                      }))}
                    >
                      <PolarGrid stroke="hsl(240, 5%, 84%)" />
                      <PolarAngleAxis
                        dataKey="category"
                        tick={{ fill: "hsl(240, 4%, 46%)", fontSize: 11 }}
                      />
                      <PolarRadiusAxis angle={90} domain={[0, 'dataMax']} tick={{ fontSize: 10 }} />
                      <Radar
                        name="Budget"
                        dataKey="estimated"
                        stroke="hsl(217, 91%, 60%)"
                        fill="hsl(217, 91%, 60%)"
                        fillOpacity={0.3}
                      />
                      <Radar
                        name="Actual"
                        dataKey="actual"
                        stroke="hsl(142, 76%, 36%)"
                        fill="hsl(142, 76%, 36%)"
                        fillOpacity={0.5}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: "12px" }}
                        iconType="circle"
                      />
                      <ChartTooltip
                        content={<ChartTooltipContent
                          formatter={(value) => formatCurrency(value as number)}
                        />}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </div>

            {/* Card 2: Budget Summary - Combined Total Spent + Top Categories */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Budget Summary
                </h3>
                <DollarSign className="w-5 h-5 text-red-500" />
              </div>

              {/* Total Spent Section */}
              <div className="mb-6">
                <div className="text-3xl font-bold text-foreground mb-4">
                  {formatCurrency(totalExpensesActual)}
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Budget</span>
                    <span className="font-medium">{formatCurrency(totalExpensesEstimated)}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        budgetUtilization < 90
                          ? "bg-green-500"
                          : budgetUtilization < 100
                            ? "bg-yellow-500"
                            : "bg-red-500"
                      }`}
                      style={{ width: `${Math.min(budgetUtilization, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Remaining</span>
                    <span className={`font-medium ${totalExpensesEstimated - totalExpensesActual >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                      {formatCurrency(totalExpensesEstimated - totalExpensesActual)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-border my-6"></div>

              {/* Top Categories Section */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Receipt className="w-4 h-4 text-purple-500" />
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Top Categories
                  </h4>
                </div>
                <div className="space-y-4">
                  {expenseCategories
                    .sort((a, b) => b.actual - a.actual)
                    .slice(0, 3)
                    .map((category) => {
                      const catUtilization = category.estimated > 0 ? (category.actual / category.estimated) * 100 : 0;
                      return (
                        <div key={category.id}>
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-sm font-medium text-foreground truncate pr-2">
                              {category.name}
                            </span>
                            <span className="text-sm font-bold text-foreground whitespace-nowrap">
                              {formatCurrency(category.actual)}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className={`h-full rounded-full ${
                                catUtilization < 90 ? "bg-green-500" : catUtilization < 100 ? "bg-yellow-500" : "bg-red-500"
                              }`}
                              style={{ width: `${Math.min(catUtilization, 100)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

          </div>
        </>
      ) : (
        <>
          {/* Income View - 2 Card Layout matching Expenses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Card 1: Radar Chart for Income by Source */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Income by Source
                </h3>
                <PieChartIcon className="w-5 h-5 text-muted-foreground" />
              </div>
              {revenueCategories.filter(cat => cat.estimated > 0 || cat.actual > 0).length < 2 ? (
                <div className="h-[360px] flex items-center justify-center">
                  <p className="text-muted-foreground text-sm">No data to show</p>
                </div>
              ) : (
                <ChartContainer
                  config={{
                    estimated: {
                      label: "Projected",
                      color: "hsl(217, 91%, 60%)",
                    },
                    actual: {
                      label: "Actual",
                      color: "hsl(142, 76%, 36%)",
                    },
                  } satisfies ChartConfig}
                  className="h-[360px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart
                      data={revenueCategories.map((cat) => ({
                        category: cat.name.length > 20 ? cat.name.substring(0, 18) + "..." : cat.name,
                        estimated: cat.estimated,
                        actual: cat.actual,
                      }))}
                    >
                      <PolarGrid stroke="hsl(240, 5%, 84%)" />
                      <PolarAngleAxis
                        dataKey="category"
                        tick={{ fill: "hsl(240, 4%, 46%)", fontSize: 11 }}
                      />
                      <PolarRadiusAxis angle={90} domain={[0, 'dataMax']} tick={{ fontSize: 10 }} />
                      <Radar
                        name="Projected"
                        dataKey="estimated"
                        stroke="hsl(217, 91%, 60%)"
                        fill="hsl(217, 91%, 60%)"
                        fillOpacity={0.3}
                      />
                      <Radar
                        name="Actual"
                        dataKey="actual"
                        stroke="hsl(142, 76%, 36%)"
                        fill="hsl(142, 76%, 36%)"
                        fillOpacity={0.5}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: "12px" }}
                        iconType="circle"
                      />
                      <ChartTooltip
                        content={<ChartTooltipContent
                          formatter={(value) => formatCurrency(value as number)}
                        />}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </div>

            {/* Card 2: Income Summary - Combined Total Income + Top Sources */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Income Summary
                </h3>
                <DollarSign className="w-5 h-5 text-green-500" />
              </div>

              {/* Total Income Section */}
              <div className="mb-6">
                <div className="text-3xl font-bold text-foreground mb-4">
                  {formatCurrency(totalRevenueActual)}
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Projected</span>
                    <span className="font-medium">{formatCurrency(totalRevenueEstimated)}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-green-500 transition-all"
                      style={{ width: `${Math.min((totalRevenueActual / totalRevenueEstimated) * 100, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Remaining</span>
                    <span className={`font-medium ${totalRevenueEstimated - totalRevenueActual >= 0 ? "text-yellow-600 dark:text-yellow-400" : "text-green-600 dark:text-green-400"}`}>
                      {formatCurrency(totalRevenueEstimated - totalRevenueActual)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-border my-6"></div>

              {/* Top Income Sources Section */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Receipt className="w-4 h-4 text-teal-500" />
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Top Sources
                  </h4>
                </div>
                <div className="space-y-4">
                  {revenueCategories
                    .sort((a, b) => b.actual - a.actual)
                    .slice(0, 3)
                    .map((category) => {
                      const incomeProgress = category.estimated > 0 ? (category.actual / category.estimated) * 100 : 0;
                      return (
                        <div key={category.id}>
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-sm font-medium text-foreground truncate pr-2">
                              {category.name}
                            </span>
                            <span className="text-sm font-bold text-foreground whitespace-nowrap">
                              {formatCurrency(category.actual)}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="h-full rounded-full bg-green-500"
                              style={{ width: `${Math.min(incomeProgress, 100)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Expense Categories */}
      {expenseCategories.length > 0 && viewMode === "expenses" && (
        <div className="mb-8 space-y-4">
          {expenseCategories.map((category) => (
            <CategorySection key={category.id} category={category} projectId={id} />
          ))}
        </div>
      )}

      {/* Revenue Categories */}
      {revenueCategories.length > 0 && viewMode === "income" && (
        <div className="mb-8 space-y-4">
          {revenueCategories.map((category) => (
            <CategorySection key={category.id} category={category} projectId={id} />
          ))}
        </div>
      )}

      {/* Add Line Item Dialog */}
      <Dialog open={isAddLineItemOpen} onOpenChange={setIsAddLineItemOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Line Item</DialogTitle>
            <DialogDescription>
              Add a new expense or revenue line item to this project
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              console.log("Adding line item:", lineItemFormData);
              // TODO: Add to mock data or API call
              setIsAddLineItemOpen(false);
              setLineItemFormData({
                name: "",
                description: "",
                category: "",
                estimated: "",
                quantity: "",
                unitPrice: "",
                vendor: "",
                status: "pending",
              });
            }}
            className="space-y-4"
          >
            {/* Category Selection */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Category *
              </label>
              <select
                required
                value={lineItemFormData.category}
                onChange={(e) =>
                  setLineItemFormData({ ...lineItemFormData, category: e.target.value })
                }
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-[#61bc47] focus:border-transparent"
              >
                <option value="">Select a category...</option>
                {project.categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({cat.type})
                  </option>
                ))}
              </select>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Item Name *
              </label>
              <input
                type="text"
                required
                value={lineItemFormData.name}
                onChange={(e) =>
                  setLineItemFormData({ ...lineItemFormData, name: e.target.value })
                }
                placeholder="e.g., T-shirts for volunteers"
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-[#61bc47] focus:border-transparent"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Description
              </label>
              <textarea
                value={lineItemFormData.description}
                onChange={(e) =>
                  setLineItemFormData({ ...lineItemFormData, description: e.target.value })
                }
                placeholder="Additional details about this line item"
                rows={3}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-[#61bc47] focus:border-transparent"
              />
            </div>

            {/* Estimated Amount or Quantity/Unit Price */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Estimated Amount *
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0"
                  value={lineItemFormData.estimated}
                  onChange={(e) =>
                    setLineItemFormData({ ...lineItemFormData, estimated: e.target.value })
                  }
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-[#61bc47] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={lineItemFormData.quantity}
                  onChange={(e) =>
                    setLineItemFormData({ ...lineItemFormData, quantity: e.target.value })
                  }
                  placeholder="Optional"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-[#61bc47] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Unit Price
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={lineItemFormData.unitPrice}
                  onChange={(e) =>
                    setLineItemFormData({ ...lineItemFormData, unitPrice: e.target.value })
                  }
                  placeholder="Optional"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-[#61bc47] focus:border-transparent"
                />
              </div>
            </div>

            {/* Vendor and Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Vendor
                </label>
                <input
                  type="text"
                  value={lineItemFormData.vendor}
                  onChange={(e) =>
                    setLineItemFormData({ ...lineItemFormData, vendor: e.target.value })
                  }
                  placeholder="Vendor name"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-[#61bc47] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Status *
                </label>
                <select
                  required
                  value={lineItemFormData.status}
                  onChange={(e) =>
                    setLineItemFormData({
                      ...lineItemFormData,
                      status: e.target.value as typeof lineItemFormData.status,
                    })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-[#61bc47] focus:border-transparent"
                >
                  <option value="pending">Pending</option>
                  <option value="ordered">Ordered</option>
                  <option value="received">Received</option>
                  <option value="paid">Paid</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsAddLineItemOpen(false);
                  setLineItemFormData({
                    name: "",
                    description: "",
                    category: "",
                    estimated: "",
                    quantity: "",
                    unitPrice: "",
                    vendor: "",
                    status: "pending",
                  });
                }}
                className="px-4 py-2 border border-border rounded-lg text-foreground hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#61BC47] hover:bg-[#4fa037] text-white rounded-lg font-medium transition-colors"
              >
                Add Line Item
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
