"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  User,
  DollarSign,
  PieChart as PieChartIcon,
  Receipt,
  ChevronDown,
  ChevronRight,
  List,
  BarChart3,
  Plus,
  Edit,
  Trash2,
  MoreVertical,
} from "lucide-react";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, PieChart, Pie } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

interface BudgetLineItem {
  lineItemId: string;
  name: string;
  vendor: string | null;
  estimated: number;
  actual: number;
  status: string;
  description: string | null;
  sortOrder: number;
}

interface BudgetCategory {
  categoryId: string;
  name: string;
  type: "expense" | "revenue";
  estimated: number;
  actual: number;
  sortOrder: number;
  description?: string;
  lineItems: BudgetLineItem[];
}

interface ProjectBudgetDetails {
  Project_ID: number;
  Project_Title: string;
  Slug: string;
  Project_Start: string;
  Project_End: string;
  Expected_Registration_Revenue: number | null;
  Coordinator_Contact_ID: number;
  Coordinator_First_Name: string;
  Coordinator_Last_Name: string;
  Coordinator_Display_Name: string;
  Coordinator_Email: string;
  Total_Budget: number;
  Total_Actual_Expenses: number;
  Total_Actual_Income: number;
  Total_Expected_Income: number;
  expenseCategories: BudgetCategory[];
  incomeLineItemsCategories: BudgetCategory[];
  registrationIncomeCategory: BudgetCategory;
  registrationDiscountsCategory: BudgetCategory;
}

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

function CategorySection({ category, projectSlug }: { category: BudgetCategory; projectSlug: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const variance = category.actual - category.estimated;
  const variancePercent =
    category.estimated > 0 ? (variance / category.estimated) * 100 : 0;

  // Simplified view for registration discounts and revenue (no individual budgets per line item)
  const isSimplifiedView = category.categoryId === 'registration-discounts' || category.categoryId === 'registration-income';

  return (
    <div className={`rounded-lg overflow-hidden ${
      isSimplifiedView
        ? "bg-blue-50/30 dark:bg-blue-950/10 border-2 border-blue-100 dark:border-blue-900/30"
        : "bg-card border border-border"
    }`}>
      {/* Category Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full px-6 py-4 border-b transition-colors ${
          isSimplifiedView
            ? "bg-blue-50/50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30 hover:bg-blue-100/50 dark:hover:bg-blue-950/30"
            : "bg-zinc-300 dark:bg-black border-border hover:bg-zinc-400 dark:hover:bg-zinc-900"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isExpanded ? (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            )}
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              {category.name}
              {isSimplifiedView && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100/70 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                  Auto-tracked
                </span>
              )}
            </h3>
            {!isSimplifiedView && (
              <div className="flex items-center gap-1 ml-2" onClick={(e) => e.stopPropagation()}>
                <button
                  className="p-1.5 hover:bg-zinc-400 dark:hover:bg-zinc-700 rounded transition-colors"
                  title="Edit category"
                >
                  <Edit className="w-4 h-4 text-muted-foreground" />
                </button>
                <button
                  className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                  title="Delete category"
                >
                  <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Total</div>
              <div className="font-bold text-foreground">
                {formatCurrency(category.actual)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">
                {category.type === "revenue" ? "Expected" : "Budgeted"}
              </div>
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
      {isExpanded && category.lineItems && category.lineItems.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${
                isSimplifiedView
                  ? "bg-blue-50/50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30"
                  : "bg-zinc-200 dark:bg-zinc-900 border-border"
              }`}>
                <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">
                  Item
                </th>
                {!isSimplifiedView && (
                  <th className="px-6 py-3 text-right text-xs font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">
                    {category.type === "revenue" ? "Expected" : "Estimated"}
                  </th>
                )}
                <th className="px-6 py-3 text-right text-xs font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">
                  Actual
                </th>
                {!isSimplifiedView && (
                  <>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">
                      Variance
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">
                      Status
                    </th>
                  </>
                )}
                <th className="px-6 py-3 text-center text-xs font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {category.lineItems.map((item) => {
                const itemVariance = item.actual - item.estimated;
                const itemVariancePercent =
                  item.estimated > 0 ? (itemVariance / item.estimated) * 100 : 0;

                return (
                  <tr key={item.lineItemId} className={`transition-colors ${
                    isSimplifiedView
                      ? "bg-blue-50/20 dark:bg-blue-950/10 hover:bg-blue-50/40 dark:hover:bg-blue-950/20"
                      : "bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  }`}>
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
                      </div>
                    </td>
                    {!isSimplifiedView && (
                      <td className="px-6 py-4 text-right font-medium text-gray-700 dark:text-gray-300">
                        {formatCurrency(item.estimated)}
                      </td>
                    )}
                    <td className="px-6 py-4 text-right font-semibold text-foreground">
                      {formatCurrency(item.actual)}
                    </td>
                    {!isSimplifiedView && (
                      <>
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
                          {item.estimated > 0 && (
                            <div className="text-xs text-muted-foreground mt-1">
                              ({itemVariance >= 0 ? "+" : ""}
                              {itemVariancePercent.toFixed(1)}%)
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                              item.status === "paid" || item.status === "received" || item.status === "applied"
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : item.status === "ordered"
                                  ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                                  : item.status === "pending"
                                    ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                    : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                      </>
                    )}
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          className="p-1.5 hover:bg-zinc-300 dark:hover:bg-zinc-600 rounded transition-colors"
                          title="Edit line item"
                        >
                          <Edit className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <button
                          className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                          title="Delete line item"
                        >
                          <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Line Item Button */}
      {isExpanded && !isSimplifiedView && (
        <div className="px-6 py-4 border-t border-border">
          <button
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#61bc47] hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            title="Add new line item"
          >
            <Plus className="w-4 h-4" />
            Add Line Item
          </button>
        </div>
      )}
    </div>
  );
}

export default function BudgetDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [project, setProject] = useState<ProjectBudgetDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"expenses" | "income">("expenses");

  useEffect(() => {
    async function fetchProjectDetails() {
      try {
        setIsLoading(true);
        setError(null);

        // Call our API route which handles authentication
        const response = await fetch(`/api/projects/budgets/${encodeURIComponent(slug)}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch project details");
        }

        const projectData = await response.json();
        setProject(projectData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    }

    fetchProjectDetails();
  }, [slug]);

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
          </div>
        </div>

        {/* Toggle Skeleton */}
        <div className="mb-6 flex justify-center">
          <Skeleton className="h-12 w-64" />
        </div>

        {/* Summary Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {[1, 2].map((i) => (
            <div key={i} className="bg-card border border-border rounded-lg p-6">
              <Skeleton className="h-80" />
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

  if (error || (!isLoading && !project)) {
    return (
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 max-w-[1600px]">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {error ? "Error Loading Budget" : "Budget Not Found"}
          </h2>
          <p className="text-muted-foreground mb-6">
            {error || "The budget you're looking for doesn't exist."}
          </p>
          <Link
            href="/budgets"
            className="inline-flex items-center gap-2 text-[#61bc47] hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Budgets
          </Link>
        </div>
      </div>
    );
  }

  // Combine all categories for display
  const expenseCategories = [
    ...(project?.expenseCategories || []),
    ...(project?.registrationDiscountsCategory ? [project.registrationDiscountsCategory] : []),
  ];
  const revenueCategories = [
    ...(project?.registrationIncomeCategory ? [project.registrationIncomeCategory] : []),
    ...(project?.incomeLineItemsCategories || []),
  ];

  const totalExpensesEstimated = project?.Total_Budget || 0;
  const totalExpensesActual = project?.Total_Actual_Expenses || 0;
  const totalRevenueEstimated = project?.Total_Expected_Income || 0;
  const totalRevenueActual = project?.Total_Actual_Income || 0;

  const budgetUtilization =
    totalExpensesEstimated > 0
      ? (totalExpensesActual / totalExpensesEstimated) * 100
      : 0;

  const incomeProgress =
    totalRevenueEstimated > 0
      ? (totalRevenueActual / totalRevenueEstimated) * 100
      : 0;

  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 max-w-[1600px]">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/budgets"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-[#61bc47] mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Budgets
        </Link>

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-primary dark:text-foreground mb-2">
              {project?.Project_Title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-400 dark:text-gray-400">
              {project?.Coordinator_Display_Name && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>{project.Coordinator_Display_Name}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>
                  {project && formatDate(project.Project_Start)} - {project && formatDate(project.Project_End)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/budgets/${slug}/reports`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 dark:bg-zinc-700 text-white rounded-lg hover:bg-zinc-700 dark:hover:bg-zinc-600 transition-colors"
            >
              <BarChart3 className="w-4 h-4" />
              Reports
            </Link>
            <Link
              href={`/budgets/${slug}/transactions`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 dark:bg-zinc-700 text-white rounded-lg hover:bg-zinc-700 dark:hover:bg-zinc-600 transition-colors"
            >
              <List className="w-4 h-4" />
              Transactions
            </Link>
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="mb-6 flex justify-center">
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
      </div>

      {/* Summary Cards */}
      {viewMode === "expenses" ? (
        <>
          {/* Expenses View - Two Column */}
          <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6 mb-8">
            {/* Left: Donut Chart */}
            <div className="bg-card border border-border rounded-lg p-6 w-fit">
              <div className="flex items-center gap-2 mb-6">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Summary
                </h3>
              </div>
              <ChartContainer
                config={{
                  spent: {
                    label: "Spent",
                    color: "hsl(142, 76%, 36%)",
                  },
                  remaining: {
                    label: "Remaining",
                    color: "hsl(211, 21%, 27%)",
                  },
                } satisfies ChartConfig}
                className="h-[280px]"
              >
                <ResponsiveContainer width={280} height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Spent", value: totalExpensesActual, fill: "hsl(142, 76%, 36%)" },
                        { name: "Remaining", value: Math.max(0, totalExpensesEstimated - totalExpensesActual), fill: "hsl(211, 21%, 27%)" },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {[
                        { name: "Spent", value: totalExpensesActual },
                        { name: "Remaining", value: Math.max(0, totalExpensesEstimated - totalExpensesActual) },
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} />
                      ))}
                    </Pie>
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white dark:bg-zinc-800 border border-border rounded-lg shadow-lg p-3">
                              <p className="font-medium text-foreground">{payload[0].name}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatCurrency(payload[0].value as number)}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
              <div className="text-center mt-6 space-y-2">
                <div className="text-3xl font-bold text-foreground">
                  {formatCurrency(totalExpensesActual)}
                </div>
                <div className="text-sm text-muted-foreground">
                  of {formatCurrency(totalExpensesEstimated)}
                </div>
                <div className="text-sm font-semibold text-muted-foreground">
                  {formatCurrency(Math.abs(totalExpensesEstimated - totalExpensesActual))} {totalExpensesEstimated - totalExpensesActual >= 0 ? "remaining" : "over"}
                </div>
              </div>
            </div>

            {/* Right: Categories Grid */}
            <div className="bg-card border border-border rounded-lg p-8">
              <div className="flex items-center gap-2 mb-6">
                <Receipt className="w-4 h-4 text-purple-500" />
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Categories
                </h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {expenseCategories
                  .sort((a, b) => {
                    // Always put Registration Discounts first
                    if (a.categoryId === 'registration-discounts') return -1;
                    if (b.categoryId === 'registration-discounts') return 1;
                    // Sort others by actual amount
                    return b.actual - a.actual;
                  })
                  .map((category) => {
                    const catUtilization = category.estimated > 0 ? (category.actual / category.estimated) * 100 : 0;
                    const barColor = catUtilization < 90 ? "bg-green-500" : catUtilization < 100 ? "bg-yellow-500" : "bg-red-500";

                    return (
                      <div key={category.categoryId}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-foreground truncate pr-2">
                            {category.name}
                          </span>
                          <span className="text-sm font-bold text-foreground whitespace-nowrap">
                            {formatCurrency(category.actual)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                          <div
                            className={`h-full rounded-full ${barColor}`}
                            style={{ width: `${Math.min(catUtilization, 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-xs text-muted-foreground">
                            Budget: {formatCurrency(category.estimated)}
                          </span>
                          <span className="text-xs font-medium text-muted-foreground">
                            {catUtilization.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Income View - Two Column */}
          <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6 mb-8">
            {/* Left: Donut Chart */}
            <div className="bg-card border border-border rounded-lg p-6 w-fit">
              <div className="flex items-center gap-2 mb-6">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Summary
                </h3>
              </div>
              <ChartContainer
                config={{
                  received: {
                    label: "Received",
                    color: "hsl(142, 76%, 36%)",
                  },
                  remaining: {
                    label: "Remaining",
                    color: "hsl(211, 21%, 27%)",
                  },
                } satisfies ChartConfig}
                className="h-[280px]"
              >
                <ResponsiveContainer width={280} height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Received", value: totalRevenueActual, fill: "hsl(142, 76%, 36%)" },
                        { name: "Remaining", value: Math.max(0, totalRevenueEstimated - totalRevenueActual), fill: "hsl(211, 21%, 27%)" },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {[
                        { name: "Received", value: totalRevenueActual },
                        { name: "Remaining", value: Math.max(0, totalRevenueEstimated - totalRevenueActual) },
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} />
                      ))}
                    </Pie>
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white dark:bg-zinc-800 border border-border rounded-lg shadow-lg p-3">
                              <p className="font-medium text-foreground">{payload[0].name}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatCurrency(payload[0].value as number)}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
              <div className="text-center mt-6 space-y-2">
                <div className="text-3xl font-bold text-foreground">
                  {formatCurrency(totalRevenueActual)}
                </div>
                <div className="text-sm text-muted-foreground">
                  of {formatCurrency(totalRevenueEstimated)}
                </div>
                <div className="text-sm font-semibold text-muted-foreground">
                  {formatCurrency(Math.abs(totalRevenueEstimated - totalRevenueActual))} {totalRevenueEstimated - totalRevenueActual >= 0 ? "remaining" : "over"}
                </div>
              </div>
            </div>

            {/* Right: Income Sources Grid */}
            <div className="bg-card border border-border rounded-lg p-8">
              <div className="flex items-center gap-2 mb-6">
                <Receipt className="w-4 h-4 text-teal-500" />
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Sources
                </h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {revenueCategories
                  .sort((a, b) => {
                    // Always put Registration Revenue first
                    if (a.categoryId === 'registration-income') return -1;
                    if (b.categoryId === 'registration-income') return 1;
                    // Sort others by actual amount
                    return b.actual - a.actual;
                  })
                  .map((category) => {
                    const progress = category.estimated > 0 ? (category.actual / category.estimated) * 100 : 0;
                    return (
                      <div key={category.categoryId}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-foreground truncate pr-2">
                            {category.name}
                          </span>
                          <span className="text-sm font-bold text-foreground whitespace-nowrap">
                            {formatCurrency(category.actual)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                          <div
                            className="h-full rounded-full bg-green-500"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-xs text-muted-foreground">
                            Goal: {formatCurrency(category.estimated)}
                          </span>
                          <span className="text-xs font-medium text-muted-foreground">
                            {progress.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Categories */}
      <div className="space-y-4">
        {viewMode === "expenses"
          ? expenseCategories
              .sort((a, b) => {
                // Always put Registration Discounts first
                if (a.categoryId === 'registration-discounts') return -1;
                if (b.categoryId === 'registration-discounts') return 1;
                // Sort others by actual amount
                return b.actual - a.actual;
              })
              .map((category) => (
                <CategorySection
                  key={category.categoryId}
                  category={category}
                  projectSlug={slug}
                />
              ))
          : revenueCategories
              .sort((a, b) => {
                // Always put Registration Revenue first
                if (a.categoryId === 'registration-income') return -1;
                if (b.categoryId === 'registration-income') return 1;
                // Sort others by actual amount
                return b.actual - a.actual;
              })
              .map((category) => (
                <CategorySection
                  key={category.categoryId}
                  category={category}
                  projectSlug={slug}
                />
              ))}

        {/* Add Category Button */}
        <button
          className="w-full py-4 border-2 border-dashed border-border hover:border-[#61bc47] hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-lg transition-colors flex items-center justify-center gap-2 text-muted-foreground hover:text-[#61bc47]"
          title={`Add new ${viewMode === "expenses" ? "expense" : "income"} category`}
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">
            Add {viewMode === "expenses" ? "Expense" : "Income"} Category
          </span>
        </button>
      </div>
    </div>
  );
}
