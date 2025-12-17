"use client";

import { use, useState, useEffect } from "react";
import {
  Download,
  TrendingUp,
  TrendingDown,
  BarChart3,
  AlertCircle,
} from "lucide-react";
import { BackButton } from "@/components/BackButton";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

interface BudgetLineItem {
  lineItemId: string;
  name: string;
  vendor: string | null;
  estimated: number;
  actual: number;
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

const COLORS = [
  "hsl(142, 76%, 36%)", // Green
  "hsl(39, 100%, 57%)", // Yellow/Orange
  "hsl(271, 91%, 65%)", // Purple
  "hsl(0, 84%, 60%)", // Red
  "hsl(204, 86%, 53%)", // Blue
  "hsl(168, 76%, 42%)", // Teal
  "hsl(348, 83%, 47%)", // Pink/Red
  "hsl(31, 97%, 72%)", // Light Orange
];

export default function ReportsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [project, setProject] = useState<ProjectBudgetDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProjectDetails() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(
          `/api/projects/budgets/${encodeURIComponent(slug)}`
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || "Failed to fetch project details"
          );
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
        <div className="mb-8">
          <Skeleton className="h-4 w-32 mb-4" />
          <div className="flex justify-between items-start">
            <div>
              <Skeleton className="h-10 w-96 mb-2" />
              <Skeleton className="h-5 w-64" />
            </div>
            <Skeleton className="h-10 w-40" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
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
            {error ? "Error Loading Reports" : "Budget Not Found"}
          </h2>
          <p className="text-muted-foreground mb-6">
            {error || "The budget you're looking for doesn't exist."}
          </p>
          <BackButton
            fallbackUrl="/budgets"
            label="Back"
            className="inline-flex items-center gap-2 text-[#61bc47] hover:underline"
          />
        </div>
      </div>
    );
  }

  // Combine all categories
  const expenseCategories = [
    ...(project?.expenseCategories || []),
    ...(project?.registrationDiscountsCategory
      ? [project.registrationDiscountsCategory]
      : []),
  ];
  const revenueCategories = [
    ...(project?.registrationIncomeCategory
      ? [project.registrationIncomeCategory]
      : []),
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

  const revenueProgress =
    totalRevenueEstimated > 0
      ? (totalRevenueActual / totalRevenueEstimated) * 100
      : 0;

  const netProfitLossEstimated = totalRevenueEstimated - totalExpensesEstimated;
  const netProfitLossActual = totalRevenueActual - totalExpensesActual;

  // Prepare data for Expense Breakdown pie chart
  const expenseBreakdownData = expenseCategories
    .filter((cat) => cat.actual > 0)
    .map((cat, index) => ({
      name: cat.name,
      value: cat.actual,
      fill: COLORS[index % COLORS.length],
    }));

  // Prepare data for Budget vs Actual by Category bar chart
  const budgetVsActualData = expenseCategories
    .map((cat) => ({
      name: cat.name,
      estimated: cat.estimated,
      actual: cat.actual,
    }))
    .sort((a, b) => b.actual - a.actual);

  // Prepare data for Profit & Loss Summary
  const profitLossData = [
    {
      category: "Estimated",
      revenue: totalRevenueEstimated,
      expenses: totalExpensesEstimated,
      profit: netProfitLossEstimated,
    },
    {
      category: "Actual",
      revenue: totalRevenueActual,
      expenses: totalExpensesActual,
      profit: netProfitLossActual,
    },
  ];

  // Prepare data for Financial Overview
  const financialOverviewData = [
    {
      category: "Total Expenses",
      estimated: totalExpensesEstimated,
      actual: totalExpensesActual,
    },
    {
      category: "Total Revenue",
      estimated: totalRevenueEstimated,
      actual: totalRevenueActual,
    },
  ];

  // Key Insights
  const topSpendingCategory = expenseCategories.reduce(
    (max, cat) => (cat.actual > max.actual ? cat : max),
    expenseCategories[0]
  );

  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 max-w-[1600px]">
      {/* Header */}
      <div className="mb-8">
        <BackButton
          fallbackUrl={`/budgets/${slug}`}
          label="Back"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-[#61bc47] mb-4 transition-colors"
        />

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-primary dark:text-foreground mb-2">
              budget reports & analytics
            </h1>
            <p className="text-muted-foreground">
              Visual analysis of budget performance for {project?.Project_Title}
            </p>
          </div>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 dark:bg-zinc-700 text-white rounded-lg hover:bg-zinc-700 dark:hover:bg-zinc-600 transition-colors"
          >
            <Download className="w-4 h-4" />
            EXPORT PDF
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Budget Utilization */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Budget Utilization
            </h3>
          </div>
          <div className="text-4xl font-bold text-foreground mb-2">
            {budgetUtilization.toFixed(1)}%
          </div>
          <div className="text-sm text-muted-foreground">
            {formatCurrency(totalExpensesActual)} of{" "}
            {formatCurrency(totalExpensesEstimated)}
          </div>
        </div>

        {/* Revenue Progress */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Revenue Progress
            </h3>
          </div>
          <div className="text-4xl font-bold text-foreground mb-2">
            {revenueProgress.toFixed(1)}%
          </div>
          <div className="text-sm text-muted-foreground">
            {formatCurrency(totalRevenueActual)} of{" "}
            {formatCurrency(totalRevenueEstimated)}
          </div>
        </div>

        {/* Net Profit/Loss */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            {netProfitLossActual >= 0 ? (
              <TrendingUp className="w-4 h-4 text-green-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500" />
            )}
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Net Profit/Loss
            </h3>
          </div>
          <div
            className={`text-4xl font-bold mb-2 ${
              netProfitLossActual >= 0
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {formatCurrency(netProfitLossActual)}
          </div>
          <div className="text-sm text-muted-foreground">
            Actual performance
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Expense Breakdown */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Expense Breakdown
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            Actual spending by category
          </p>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseBreakdownData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({
                    cx,
                    cy,
                    midAngle,
                    innerRadius,
                    outerRadius,
                    percent,
                  }) => {
                    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                    const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                    const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));

                    return percent > 0.05 ? (
                      <text
                        x={x}
                        y={y}
                        fill="white"
                        textAnchor={x > cx ? "start" : "end"}
                        dominantBaseline="central"
                        className="text-xs font-semibold"
                      >
                        {`${(percent * 100).toFixed(0)}%`}
                      </text>
                    ) : null;
                  }}
                  outerRadius={120}
                  dataKey="value"
                >
                  {expenseBreakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white dark:bg-zinc-800 border border-border rounded-lg shadow-lg p-3">
                          <p className="font-medium text-foreground">
                            {payload[0].name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(payload[0].value as number)}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value, entry: any) => (
                    <span className="text-sm text-foreground">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Budget vs Actual by Category */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Budget vs Actual by Category
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            Estimated vs actual spending comparison
          </p>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={budgetVsActualData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={150}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                />
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white dark:bg-zinc-800 border border-border rounded-lg shadow-lg p-3">
                          <p className="font-medium text-foreground mb-2">
                            {payload[0].payload.name}
                          </p>
                          {payload.map((entry: any, index: number) => (
                            <p key={index} className="text-sm" style={{ color: entry.color }}>
                              {entry.name}: {formatCurrency(entry.value)}
                            </p>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  formatter={(value) => (
                    <span className="text-sm text-foreground capitalize">{value}</span>
                  )}
                />
                <Bar dataKey="estimated" fill="hsl(142, 76%, 36%)" name="Estimated" />
                <Bar dataKey="actual" fill="hsl(0, 84%, 60%)" name="Actual" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Profit & Loss Summary and Financial Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Profit & Loss Summary */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Profit & Loss Summary
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            Estimated vs actual financial performance
          </p>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={profitLossData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <YAxis
                  dataKey="category"
                  type="category"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white dark:bg-zinc-800 border border-border rounded-lg shadow-lg p-3">
                          <p className="font-medium text-foreground mb-2">
                            {payload[0].payload.category}
                          </p>
                          {payload.map((entry: any, index: number) => (
                            <p key={index} className="text-sm" style={{ color: entry.color }}>
                              {entry.name}: {formatCurrency(entry.value)}
                            </p>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  formatter={(value) => (
                    <span className="text-sm text-foreground capitalize">{value}</span>
                  )}
                />
                <Bar dataKey="revenue" fill="hsl(142, 76%, 36%)" name="Revenue" />
                <Bar dataKey="expenses" fill="hsl(0, 84%, 60%)" name="Expenses" />
                <Bar dataKey="profit" fill="hsl(204, 86%, 53%)" name="Profit/Loss" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Financial Overview */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Financial Overview
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            Total revenue and expenses comparison
          </p>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financialOverviewData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="category"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white dark:bg-zinc-800 border border-border rounded-lg shadow-lg p-3">
                          <p className="font-medium text-foreground mb-2">
                            {payload[0].payload.category}
                          </p>
                          {payload.map((entry: any, index: number) => (
                            <p key={index} className="text-sm" style={{ color: entry.color }}>
                              {entry.name}: {formatCurrency(entry.value)}
                            </p>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  formatter={(value) => (
                    <span className="text-sm text-foreground capitalize">{value}</span>
                  )}
                />
                <Bar dataKey="estimated" fill="hsl(142, 76%, 36%)" name="Estimated" />
                <Bar dataKey="actual" fill="hsl(211, 21%, 27%)" name="Actual" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Key Insights */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-6">
          Key Insights
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          Analysis of budget performance
        </p>
        <div className="space-y-4">
          {/* Budget Status */}
          <div className="flex items-start gap-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                budgetUtilization <= 90
                  ? "bg-green-100 dark:bg-green-900/30"
                  : budgetUtilization <= 100
                    ? "bg-yellow-100 dark:bg-yellow-900/30"
                    : "bg-red-100 dark:bg-red-900/30"
              }`}
            >
              <BarChart3
                className={`w-5 h-5 ${
                  budgetUtilization <= 90
                    ? "text-green-600 dark:text-green-400"
                    : budgetUtilization <= 100
                      ? "text-yellow-600 dark:text-yellow-400"
                      : "text-red-600 dark:text-red-400"
                }`}
              />
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-1">
                Budget Status
              </h4>
              <p className="text-sm text-muted-foreground">
                You have spent {formatCurrency(totalExpensesActual)} of your{" "}
                {formatCurrency(totalExpensesEstimated)} budget ({budgetUtilization.toFixed(1)}% utilization)
                {budgetUtilization > 100 && (
                  <span className="text-red-600 dark:text-red-400 font-semibold">
                    . You are over budget by{" "}
                    {formatCurrency(totalExpensesActual - totalExpensesEstimated)}.
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Top Spending Category */}
          {topSpendingCategory && (
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-purple-100 dark:bg-purple-900/30">
                <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-1">
                  Top Spending Category
                </h4>
                <p className="text-sm text-muted-foreground">
                  {topSpendingCategory.name} is your largest expense at{" "}
                  {formatCurrency(topSpendingCategory.actual)}.
                </p>
              </div>
            </div>
          )}

          {/* Profit/Loss Projection */}
          <div className="flex items-start gap-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                netProfitLossActual >= 0
                  ? "bg-green-100 dark:bg-green-900/30"
                  : "bg-red-100 dark:bg-red-900/30"
              }`}
            >
              {netProfitLossActual >= 0 ? (
                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
              )}
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-1">
                Profit/Loss Projection
              </h4>
              <p className="text-sm text-muted-foreground">
                Based on current actuals, your project is operating at a{" "}
                {netProfitLossActual >= 0 ? "profit" : "loss"} of{" "}
                {formatCurrency(Math.abs(netProfitLossActual))}.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
