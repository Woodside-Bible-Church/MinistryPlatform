"use client";

import { mockProjects } from "@/data/mockProjects";
import { use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart as PieChartIcon,
  Download,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function ReportsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const project = mockProjects.find((p) => p.id === id);

  if (!project) {
    return (
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 max-w-[1600px]">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Project Not Found
          </h2>
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

  // Calculate data for charts
  const expenseCategories = project.categories.filter((c) => c.type === "expense");
  const revenueCategories = project.categories.filter((c) => c.type === "revenue");

  // Expense breakdown data for pie chart
  const expensePieData = expenseCategories.map((cat) => ({
    name: cat.name,
    value: cat.actual,
    fill: `hsl(${Math.random() * 360}, 70%, 50%)`,
  }));

  // Budget vs Actual comparison for bar chart
  const categoryComparisonData = expenseCategories.map((cat) => ({
    category: cat.name.length > 20 ? cat.name.substring(0, 20) + "..." : cat.name,
    estimated: cat.estimated,
    actual: cat.actual,
  }));

  // Summary data for horizontal bar chart
  const totalExpensesEstimated = expenseCategories.reduce((sum, c) => sum + c.estimated, 0);
  const totalExpensesActual = expenseCategories.reduce((sum, c) => sum + c.actual, 0);
  const totalRevenueEstimated = revenueCategories.reduce((sum, c) => sum + c.estimated, 0);
  const totalRevenueActual = revenueCategories.reduce((sum, c) => sum + c.actual, 0);

  const summaryData = [
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

  const profitLossData = [
    {
      type: "Estimated",
      revenue: totalRevenueEstimated,
      expenses: totalExpensesEstimated,
      profit: totalRevenueEstimated - totalExpensesEstimated,
    },
    {
      type: "Actual",
      revenue: totalRevenueActual,
      expenses: totalExpensesActual,
      profit: totalRevenueActual - totalExpensesActual,
    },
  ];

  const chartConfig = {
    estimated: {
      label: "Estimated",
      color: "hsl(var(--chart-1))",
    },
    actual: {
      label: "Actual",
      color: "hsl(var(--chart-2))",
    },
  } satisfies ChartConfig;

  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 max-w-[1600px]">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/projects/${id}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-[#61bc47] mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {project.title}
        </Link>

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-primary dark:text-foreground mb-2">
              Budget Reports & Analytics
            </h1>
            <p className="text-muted-foreground">
              Visual analysis of budget performance for {project.title}
            </p>
          </div>

          <button className="border border-border bg-card hover:bg-gray-50 dark:hover:bg-gray-800 text-foreground px-4 py-2 rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Utilization</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalExpensesEstimated > 0
                ? ((totalExpensesActual / totalExpensesEstimated) * 100).toFixed(1)
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(totalExpensesActual)} of{" "}
              {formatCurrency(totalExpensesEstimated)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalRevenueEstimated > 0
                ? ((totalRevenueActual / totalRevenueEstimated) * 100).toFixed(1)
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(totalRevenueActual)} of{" "}
              {formatCurrency(totalRevenueEstimated)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit/Loss</CardTitle>
            {totalRevenueActual - totalExpensesActual >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                totalRevenueActual - totalExpensesActual >= 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {formatCurrency(totalRevenueActual - totalExpensesActual)}
            </div>
            <p className="text-xs text-muted-foreground">Actual performance</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        {/* Expense Breakdown Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Expense Breakdown</CardTitle>
            <CardDescription>Actual spending by category</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expensePieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(entry) => `${entry.name}: ${formatCurrency(entry.value)}`}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => formatCurrency(value as number)}
                      />
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Budget vs Actual by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Budget vs Actual by Category</CardTitle>
            <CardDescription>Estimated vs actual spending comparison</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryComparisonData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="category"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => formatCurrency(value)}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => formatCurrency(value as number)}
                      />
                    }
                  />
                  <Legend />
                  <Bar
                    dataKey="estimated"
                    fill="hsl(var(--chart-1))"
                    name="Estimated"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="actual"
                    fill="hsl(var(--chart-2))"
                    name="Actual"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Profit/Loss Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Profit & Loss Summary</CardTitle>
            <CardDescription>Estimated vs actual financial performance</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={profitLossData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tickFormatter={(value) => formatCurrency(value)} />
                  <YAxis dataKey="type" type="category" />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => formatCurrency(value as number)}
                      />
                    }
                  />
                  <Legend />
                  <Bar dataKey="revenue" fill="#10b981" name="Revenue" />
                  <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
                  <Bar dataKey="profit" fill="#3b82f6" name="Profit/Loss" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Revenue vs Expenses Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Overview</CardTitle>
            <CardDescription>Total revenue and expenses comparison</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summaryData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="category" />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => formatCurrency(value as number)}
                      />
                    }
                  />
                  <Legend />
                  <Bar
                    dataKey="estimated"
                    fill="hsl(var(--chart-1))"
                    name="Estimated"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="actual"
                    fill="hsl(var(--chart-2))"
                    name="Actual"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Key Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Key Insights</CardTitle>
          <CardDescription>Analysis of budget performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-2">
                <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Budget Status</h4>
                <p className="text-sm text-muted-foreground">
                  You have spent {formatCurrency(totalExpensesActual)} of your{" "}
                  {formatCurrency(totalExpensesEstimated)} budget (
                  {((totalExpensesActual / totalExpensesEstimated) * 100).toFixed(1)}%
                  utilization).
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-2">
                <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Top Spending Category</h4>
                <p className="text-sm text-muted-foreground">
                  {expenseCategories.sort((a, b) => b.actual - a.actual)[0]?.name} is
                  your largest expense at{" "}
                  {formatCurrency(
                    expenseCategories.sort((a, b) => b.actual - a.actual)[0]?.actual || 0
                  )}
                  .
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div
                className={`rounded-full p-2 ${
                  totalRevenueActual - totalExpensesActual >= 0
                    ? "bg-green-100 dark:bg-green-900/30"
                    : "bg-red-100 dark:bg-red-900/30"
                }`}
              >
                {totalRevenueActual - totalExpensesActual >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                )}
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Profit/Loss Projection</h4>
                <p className="text-sm text-muted-foreground">
                  Based on current actuals, your project is{" "}
                  {totalRevenueActual - totalExpensesActual >= 0
                    ? "profitable"
                    : "operating at a loss"}{" "}
                  by {formatCurrency(Math.abs(totalRevenueActual - totalExpensesActual))}.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
