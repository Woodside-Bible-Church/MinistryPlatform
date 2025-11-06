"use client";

import { mockProjects, type BudgetCategory } from "@/data/mockProjects";
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
  PieChart,
  Receipt,
  Plus,
  ChevronDown,
  ChevronRight,
  List,
  BarChart3,
} from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const [isExpanded, setIsExpanded] = useState(true);
  const variance = category.actual - category.estimated;
  const variancePercent =
    category.estimated > 0 ? (variance / category.estimated) * 100 : 0;

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Category Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 bg-blue-50 dark:bg-blue-900/10 border-b border-border hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isExpanded ? (
              <ChevronDown className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            )}
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
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
              <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-border">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Estimated
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Actual
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Variance
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
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
                  <tr key={item.id}>
                    <Link
                      href={`/projects/${projectId}/items/${item.id}`}
                      className="contents hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors cursor-pointer"
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
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
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
            <h1 className="text-4xl font-bold text-primary dark:text-foreground mb-2">
              {project.title}
            </h1>
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

          <div className="flex gap-3">
            <Link
              href={`/projects/${id}/reports`}
              className="border border-border bg-card hover:bg-gray-50 dark:hover:bg-gray-800 text-foreground px-6 py-3 rounded-lg font-semibold transition-colors shadow-sm flex items-center gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              Reports
            </Link>
            <Link
              href={`/projects/${id}/transactions`}
              className="border border-border bg-card hover:bg-gray-50 dark:hover:bg-gray-800 text-foreground px-6 py-3 rounded-lg font-semibold transition-colors shadow-sm flex items-center gap-2"
            >
              <List className="w-4 h-4" />
              Transactions
            </Link>
            <button
              onClick={() => setIsAddLineItemOpen(true)}
              className="bg-[#61BC47] hover:bg-[#4fa037] text-white px-6 py-3 rounded-lg font-semibold transition-colors shadow-sm hover:shadow-md flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Expense
            </button>
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="mb-6 flex justify-center">
        <div className="inline-flex rounded-lg border border-border bg-card p-1">
          <button
            onClick={() => setViewMode("expenses")}
            className={`px-8 py-2.5 rounded-md font-medium transition-all ${
              viewMode === "expenses"
                ? "bg-[#61BC47] text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Expenses
          </button>
          <button
            onClick={() => setViewMode("income")}
            className={`px-8 py-2.5 rounded-md font-medium transition-all ${
              viewMode === "income"
                ? "bg-[#61BC47] text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Income
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {viewMode === "expenses" ? (
          <>
            {/* Expenses View Cards */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Total Spent
                </h3>
                <DollarSign className="w-5 h-5 text-red-500" />
              </div>
              <div className="text-2xl font-bold text-foreground">
                {formatCurrency(totalExpensesActual)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                of {formatCurrency(totalExpensesEstimated)} budgeted
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-3">
                <div
                  className={`h-full rounded-full ${
                    budgetUtilization < 90
                      ? "bg-green-500"
                      : budgetUtilization < 100
                        ? "bg-yellow-500"
                        : "bg-red-500"
                  }`}
                  style={{ width: `${Math.min(budgetUtilization, 100)}%` }}
                />
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Budget Remaining
                </h3>
                <DollarSign className="w-5 h-5 text-green-500" />
              </div>
              <div className="text-2xl font-bold text-foreground">
                {formatCurrency(totalExpensesEstimated - totalExpensesActual)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {((1 - budgetUtilization / 100) * 100).toFixed(1)}% remaining
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Budget Utilization
                </h3>
                <Receipt className="w-5 h-5 text-blue-500" />
              </div>
              <div className="text-2xl font-bold text-foreground">
                {budgetUtilization.toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                of total budget
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Expense Categories
                </h3>
                <Receipt className="w-5 h-5 text-purple-500" />
              </div>
              <div className="text-2xl font-bold text-foreground">
                {expenseCategories.length}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {expenseCategories.reduce((sum, c) => sum + c.lineItems.length, 0)} line items
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Income View Cards */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Total Income
                </h3>
                <DollarSign className="w-5 h-5 text-green-500" />
              </div>
              <div className="text-2xl font-bold text-foreground">
                {formatCurrency(totalRevenueActual)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                of {formatCurrency(totalRevenueEstimated)} projected
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Income Progress
                </h3>
                <TrendingUp className="w-5 h-5 text-blue-500" />
              </div>
              <div className="text-2xl font-bold text-foreground">
                {totalRevenueEstimated > 0
                  ? ((totalRevenueActual / totalRevenueEstimated) * 100).toFixed(1)
                  : 0}%
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                of projected income
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Expected Remaining
                </h3>
                <DollarSign className="w-5 h-5 text-purple-500" />
              </div>
              <div className="text-2xl font-bold text-foreground">
                {formatCurrency(totalRevenueEstimated - totalRevenueActual)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                still to be collected
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Income Sources
                </h3>
                <PieChart className="w-5 h-5 text-teal-500" />
              </div>
              <div className="text-2xl font-bold text-foreground">
                {revenueCategories.length}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {revenueCategories.reduce((sum, c) => sum + c.lineItems.length, 0)} line items
              </div>
            </div>
          </>
        )}
      </div>

      {/* Expense Categories */}
      {expenseCategories.length > 0 && viewMode === "expenses" && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Receipt className="w-6 h-6 text-[#61bc47]" />
            Expense Details
          </h2>
          <div className="space-y-4">
            {expenseCategories.map((category) => (
              <CategorySection key={category.id} category={category} projectId={id} />
            ))}
          </div>
        </div>
      )}

      {/* Revenue Categories */}
      {revenueCategories.length > 0 && viewMode === "income" && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
            <PieChart className="w-6 h-6 text-[#61bc47]" />
            Income Details
          </h2>
          <div className="space-y-4">
            {revenueCategories.map((category) => (
              <CategorySection key={category.id} category={category} projectId={id} />
            ))}
          </div>
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
