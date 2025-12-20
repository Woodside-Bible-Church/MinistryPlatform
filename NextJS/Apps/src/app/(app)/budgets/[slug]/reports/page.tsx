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
  const [isExportingPdf, setIsExportingPdf] = useState(false);

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

  // PDF Export handler
  const handleExportPdf = async () => {
    try {
      setIsExportingPdf(true);

      const response = await fetch(
        `/api/projects/budgets/${encodeURIComponent(slug)}/export-pdf`
      );

      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }

      // Get the PDF blob
      const blob = await response.blob();

      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `budget-report-${slug}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("PDF export error:", err);
      alert("Failed to export PDF. Please try again.");
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 print:py-0 max-w-[1600px]">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page {
            margin: 0.3in 0.5in 0.5in 0.5in;
          }

          * {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          /* Force light mode and remove all top spacing */
          html, body {
            background: white !important;
            color: #1a1a1a !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          body {
            padding-top: 0 !important;
            margin-top: 0 !important;
          }

          /* Remove spacing from layout elements */
          main, header, nav, div[class*="layout"] {
            margin-top: 0 !important;
            padding-top: 0 !important;
          }

          /* Override all dark mode backgrounds and text */
          .bg-card,
          .chart-card,
          .kpi-grid > div,
          .key-insights-section {
            background: white !important;
            color: #1a1a1a !important;
            border: 1px solid #e5e5e5 !important;
          }

          h1, h2, h3, h4, h5, h6, p, span, div {
            color: #1a1a1a !important;
          }

          .text-muted-foreground,
          .text-foreground {
            color: #333 !important;
          }

          /* Container adjustments */
          .container {
            max-width: 100% !important;
            padding: 0 !important;
            background: white !important;
          }

          /* Header styling */
          h1 {
            font-size: 1.5rem !important;
            color: #1a1a1a !important;
            margin-bottom: 0.15rem !important;
          }

          /* Subtitle - project title with extra space below */
          h1 + p {
            margin-bottom: 1rem !important;
          }

          /* Subtitle spacing and header section */
          .mb-8.print\\:mb-4 {
            margin-bottom: 0.75rem !important;
            margin-top: 0 !important;
            padding-top: 0 !important;
          }

          /* Ensure first header section has no top spacing */
          .mb-8.print\\:mb-4:first-of-type,
          .mb-8.print\\:mb-4:first-child {
            margin-top: 0 !important;
            padding-top: 0 !important;
          }

          /* KPI Cards - compact spacing, force 3 columns */
          .kpi-grid,
          .kpi-grid.grid,
          .kpi-grid.grid.grid-cols-1,
          .grid.grid-cols-1.md\\:grid-cols-3.kpi-grid,
          div.grid.grid-cols-1.md\\:grid-cols-3 {
            display: grid !important;
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 0.5rem !important;
            page-break-inside: avoid !important;
            margin-bottom: 0.75rem !important;
          }

          .kpi-grid > div {
            padding: 0.4rem !important;
            background: white !important;
            border: 1px solid #e5e5e5 !important;
            border-radius: 6px !important;
          }

          /* Make KPI card text smaller in print */
          .kpi-grid h3 {
            font-size: 0.65rem !important;
          }

          .kpi-grid .text-4xl {
            font-size: 1.5rem !important;
          }

          .kpi-grid .text-sm {
            font-size: 0.65rem !important;
          }

          .kpi-grid .flex.items-center.gap-2 {
            margin-bottom: 0.25rem !important;
          }

          .kpi-grid .w-4.h-4 {
            width: 0.75rem !important;
            height: 0.75rem !important;
          }

          /* Charts Grid - compact layout */
          .charts-grid,
          .charts-grid.grid,
          div.grid.grid-cols-1.lg\\:grid-cols-2 {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 0.5rem !important;
            margin-bottom: 0.75rem !important;
          }

          /* Force ALL non-KPI chart grids to be 2 columns in print */
          div.grid.grid-cols-1.lg\\:grid-cols-2:not(.kpi-grid) {
            grid-template-columns: repeat(2, 1fr) !important;
            margin-bottom: 0.75rem !important;
            gap: 0.5rem !important;
          }

          .chart-card {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            background: white !important;
            border: 1px solid #e5e5e5 !important;
            padding: 0.4rem !important;
            border-radius: 6px !important;
          }

          /* Compact chart heights for print */
          .chart-card > div:last-child {
            height: 195px !important;
          }

          /* Key Insights - compact */
          .key-insights-section {
            background: white !important;
            border: 1px solid #e5e5e5 !important;
            padding: 0.5rem !important;
            border-radius: 6px !important;
            page-break-inside: avoid !important;
            margin-bottom: 0 !important;
          }

          .key-insights-section .space-y-4 {
            gap: 0.35rem !important;
          }

          .key-insights-section h3 {
            margin-bottom: 0.35rem !important;
            font-size: 0.95rem !important;
          }

          .key-insights-section p {
            margin-bottom: 0.25rem !important;
          }

          .key-insights-section h4 {
            font-size: 0.85rem !important;
          }

          /* Chart titles - smaller */
          .chart-card h3 {
            font-size: 0.9rem !important;
            font-weight: 600 !important;
            color: #1a1a1a !important;
            margin-bottom: 0.2rem !important;
          }

          .chart-card p {
            font-size: 0.7rem !important;
            margin-bottom: 0.2rem !important;
          }

          /* Ensure chart backgrounds are white */
          svg {
            background: white !important;
          }

          /* Improve legend readability and centering */
          .recharts-legend-wrapper {
            width: 100% !important;
            text-align: center !important;
          }

          .recharts-default-legend {
            text-align: center !important;
            display: flex !important;
            justify-content: center !important;
            width: 100% !important;
          }

          .recharts-legend-item-text {
            font-size: 9px !important;
            color: #1a1a1a !important;
            white-space: normal !important;
            word-wrap: break-word !important;
          }

          .recharts-legend-item {
            margin-right: 8px !important;
          }

          /* Chart axis text - larger for readability */
          .recharts-cartesian-axis-tick-value {
            font-size: 13px !important;
            color: #1a1a1a !important;
            font-weight: 500 !important;
          }

          /* Reduce overall vertical spacing */
          .print\\:py-0 {
            padding-top: 0 !important;
            padding-bottom: 0 !important;
          }

          .print\\:py-1,
          .print\\:py-4 {
            padding-top: 0.25rem !important;
            padding-bottom: 0.25rem !important;
          }

          .print\\:mb-4,
          .print\\:mb-6 {
            margin-bottom: 0.75rem !important;
          }

          /* Ensure container starts at very top */
          .container.print\\:py-0 {
            padding-top: 0 !important;
            margin-top: 0 !important;
          }

          /* Prevent legend overlap */
          .recharts-legend-wrapper {
            margin-top: 0.5rem !important;
          }

          .chart-card .recharts-wrapper {
            padding-bottom: 0.5rem !important;
          }
        }
      `}} />

        {/* Header */}
        <div className="mb-8 print:mb-4">
        <div className="print:hidden flex items-center justify-between mb-4">
          <BackButton
            fallbackUrl={`/budgets/${slug}`}
            label="Back"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-[#61bc47] transition-colors"
          />

          <button
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-700 text-zinc-800 dark:text-white border border-zinc-300 dark:border-zinc-600 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExportingPdf ? (
              <>
                <div className="w-4 h-4 border-2 border-zinc-800 dark:border-white border-t-transparent rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                EXPORT PDF
              </>
            )}
          </button>
        </div>

        <div>
          <h1 className="text-4xl font-bold text-primary dark:text-foreground mb-2">
            budget reports & analytics
          </h1>
          <p className="text-muted-foreground">
            {project?.Project_Title}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid flex md:grid md:grid-cols-3 gap-4 md:gap-6 mb-8 print:mb-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide md:overflow-visible">
        {/* Budget Utilization */}
        <div className="bg-card border border-border rounded-lg p-6 flex-none w-[85%] md:w-auto snap-start">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Budget Utilization
            </h3>
          </div>
          <div className="text-4xl font-bold text-foreground mb-2">
            {budgetUtilization.toFixed(1)}%
          </div>
          <div className="text-sm text-muted-foreground dark:text-zinc-400">
            {formatCurrency(totalExpensesActual)} of{" "}
            {formatCurrency(totalExpensesEstimated)}
          </div>
        </div>

        {/* Revenue Progress */}
        <div className="bg-card border border-border rounded-lg p-6 flex-none w-[85%] md:w-auto snap-start">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Revenue Progress
            </h3>
          </div>
          <div className="text-4xl font-bold text-foreground mb-2">
            {revenueProgress.toFixed(1)}%
          </div>
          <div className="text-sm text-muted-foreground dark:text-zinc-400">
            {formatCurrency(totalRevenueActual)} of{" "}
            {formatCurrency(totalRevenueEstimated)}
          </div>
        </div>

        {/* Net Profit/Loss */}
        <div className="bg-card border border-border rounded-lg p-6 flex-none w-[85%] md:w-auto snap-start">
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
          <div className="text-sm text-muted-foreground dark:text-zinc-400">
            Actual performance
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="charts-grid grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 print:mb-6">
        {/* Expense Breakdown */}
        <div className="chart-card bg-card border border-border rounded-lg p-4 md:p-6 print:p-4">
          <h3 className="text-base md:text-lg font-semibold text-foreground mb-1 md:mb-2">
            Expense Breakdown
          </h3>
          <p className="text-xs md:text-sm text-muted-foreground dark:text-zinc-400 mb-4 md:mb-6">
            Actual spending by category
          </p>
          <div className="h-[300px] md:h-[450px] print:h-[195px]">
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
                  outerRadius={95}
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
                  height={45}
                  align="center"
                  formatter={(value, entry: any) => (
                    <span className="text-foreground">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Budget vs Actual by Category */}
        <div className="chart-card bg-card border border-border rounded-lg p-4 md:p-6 print:p-4">
          <h3 className="text-base md:text-lg font-semibold text-foreground mb-1 md:mb-2">
            Budget vs Actual by Category
          </h3>
          <p className="text-xs md:text-sm text-muted-foreground dark:text-zinc-400 mb-4 md:mb-6">
            Estimated vs actual spending comparison
          </p>
          <div className="h-[300px] md:h-[450px] print:h-[195px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={budgetVsActualData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" tick={{ fill: "currentColor", fontSize: 14 }} className="text-foreground" />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={110}
                  tick={{ fill: "currentColor", fontSize: 13 }}
                  className="text-foreground"
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
                  align="center"
                  formatter={(value) => (
                    <span className="text-foreground capitalize">{value}</span>
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 print:mb-6">
        {/* Profit & Loss Summary */}
        <div className="chart-card bg-card border border-border rounded-lg p-4 md:p-6 print:p-4">
          <h3 className="text-base md:text-lg font-semibold text-foreground mb-1 md:mb-2">
            Profit & Loss Summary
          </h3>
          <p className="text-xs md:text-sm text-muted-foreground dark:text-zinc-400 mb-4 md:mb-6">
            Estimated vs actual financial performance
          </p>
          <div className="h-[300px] md:h-[450px] print:h-[195px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={profitLossData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" tick={{ fill: "currentColor", fontSize: 14 }} className="text-foreground" />
                <YAxis
                  dataKey="category"
                  type="category"
                  width={65}
                  tick={{ fill: "currentColor", fontSize: 13 }}
                  className="text-foreground"
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
                  align="center"
                  formatter={(value) => (
                    <span className="text-foreground capitalize">{value}</span>
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
        <div className="chart-card bg-card border border-border rounded-lg p-4 md:p-6 print:p-4">
          <h3 className="text-base md:text-lg font-semibold text-foreground mb-1 md:mb-2">
            Financial Overview
          </h3>
          <p className="text-xs md:text-sm text-muted-foreground dark:text-zinc-400 mb-4 md:mb-6">
            Total revenue and expenses comparison
          </p>
          <div className="h-[300px] md:h-[450px] print:h-[195px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financialOverviewData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="category"
                  tick={{ fill: "currentColor", fontSize: 13 }}
                  className="text-foreground"
                />
                <YAxis tick={{ fill: "currentColor", fontSize: 13 }} className="text-foreground" />
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
                  align="center"
                  formatter={(value) => (
                    <span className="text-foreground capitalize">{value}</span>
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
      <div className="key-insights-section bg-card border border-border rounded-lg p-4 md:p-6 print:p-4">
        <h3 className="text-base md:text-lg font-semibold text-foreground mb-4 md:mb-6">
          Key Insights
        </h3>
        <p className="text-xs md:text-sm text-muted-foreground dark:text-zinc-400 mb-4 md:mb-6">
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
              <p className="text-sm text-muted-foreground dark:text-zinc-300">
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
                <p className="text-sm text-muted-foreground dark:text-zinc-300">
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
              <p className="text-sm text-muted-foreground dark:text-zinc-300">
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
