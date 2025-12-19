"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  DollarSign,
  Search,
  Plus,
  TrendingUp,
  TrendingDown,
  List as ListIcon,
  Edit,
  Trash2,
} from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { Skeleton } from "@/components/ui/skeleton";
import { useBudgetPermissions } from "@/hooks/useBudgetPermissions";

interface LineItem {
  lineItemId: string;
  name: string;
  vendor: string | null;
  estimated: number;
  actual: number;
  description: string | null;
  categoryId: string;
  categoryName: string;
  categoryType: "expense" | "revenue";
}

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

interface ProjectBudget {
  Project_ID: number;
  Project_Title: string;
  Slug: string;
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

export default function LineItemsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [projectTitle, setProjectTitle] = useState<string>("");
  const [projectId, setProjectId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Permissions
  const permissions = useBudgetPermissions();

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"expense" | "revenue">("expense");
  const [sortBy, setSortBy] = useState<"name" | "budget" | "spent" | "remaining">("name");

  // Delete line item handler
  async function handleDeleteLineItem(lineItemId: string, lineItemName: string) {
    try {
      const response = await fetch(`/api/line-items/${lineItemId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete line item");
      }

      toast.success(`"${lineItemName}" deleted successfully`);

      // Remove from local state
      setLineItems(prev => prev.filter(item => item.lineItemId !== lineItemId));
    } catch (error) {
      console.error("Error deleting line item:", error);
      toast.error("Failed to delete line item");
    }
  }

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch project budget data which includes all line items
        const projectResponse = await fetch(`/api/projects/budgets/${encodeURIComponent(slug)}`);
        if (!projectResponse.ok) {
          throw new Error("Failed to fetch project data");
        }
        const projectData: ProjectBudget = await projectResponse.json();
        setProjectTitle(projectData.Project_Title);
        setProjectId(projectData.Project_ID);

        // Flatten all line items from all categories
        const allLineItems: LineItem[] = [];

        // Add expense line items
        if (projectData.expenseCategories) {
          projectData.expenseCategories.forEach((category) => {
            if (category.lineItems && Array.isArray(category.lineItems)) {
              category.lineItems.forEach((item) => {
                allLineItems.push({
                  ...item,
                  categoryId: category.categoryId,
                  categoryName: category.name,
                  categoryType: "expense",
                });
              });
            }
          });
        }

        // Add income line items from custom categories
        if (projectData.incomeLineItemsCategories) {
          projectData.incomeLineItemsCategories.forEach((category) => {
            if (category.lineItems && Array.isArray(category.lineItems)) {
              category.lineItems.forEach((item) => {
                allLineItems.push({
                  ...item,
                  categoryId: category.categoryId,
                  categoryName: category.name,
                  categoryType: "revenue",
                });
              });
            }
          });
        }

        // Add registration income line items
        if (projectData.registrationIncomeCategory?.lineItems && Array.isArray(projectData.registrationIncomeCategory.lineItems)) {
          projectData.registrationIncomeCategory.lineItems.forEach((item) => {
            allLineItems.push({
              ...item,
              categoryId: projectData.registrationIncomeCategory.categoryId,
              categoryName: projectData.registrationIncomeCategory.name,
              categoryType: "revenue",
            });
          });
        }

        // Add registration discounts line items
        if (projectData.registrationDiscountsCategory?.lineItems && Array.isArray(projectData.registrationDiscountsCategory.lineItems)) {
          projectData.registrationDiscountsCategory.lineItems.forEach((item) => {
            allLineItems.push({
              ...item,
              categoryId: projectData.registrationDiscountsCategory.categoryId,
              categoryName: projectData.registrationDiscountsCategory.name,
              categoryType: "expense",
            });
          });
        }

        setLineItems(allLineItems);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [slug]);

  // Filter and sort line items
  const filteredLineItems = lineItems.filter((item) => {
    // Category filter
    if (item.categoryType !== categoryFilter) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(query) ||
        item.categoryName.toLowerCase().includes(query) ||
        item.vendor?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query)
      );
    }

    return true;
  }).sort((a, b) => {
    if (sortBy === "name") {
      return a.name.localeCompare(b.name);
    } else if (sortBy === "budget") {
      return Math.abs(b.estimated) - Math.abs(a.estimated);
    } else if (sortBy === "spent") {
      return Math.abs(b.actual) - Math.abs(a.actual);
    } else if (sortBy === "remaining") {
      const aRemaining = a.estimated - a.actual;
      const bRemaining = b.estimated - b.actual;
      return Math.abs(bRemaining) - Math.abs(aRemaining);
    }
    return 0;
  });

  // Calculate stats
  const totalBudget = lineItems.reduce((sum, item) => sum + item.estimated, 0);
  const totalSpent = lineItems.reduce((sum, item) => sum + item.actual, 0);
  const totalRemaining = totalBudget - totalSpent;
  const expenseCount = lineItems.filter(item => item.categoryType === "expense").length;
  const revenueCount = lineItems.filter(item => item.categoryType === "revenue").length;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 max-w-[1600px]">
        <Skeleton className="h-8 w-64 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 max-w-[1600px]">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Error Loading Line Items
          </h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <BackButton
            fallbackUrl={`/budgets/${slug}`}
            label="Back"
            className="inline-flex items-center gap-2 text-[#61bc47] hover:underline"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 max-w-[1600px]">
      {/* Header */}
      <div className="mb-8">
        <BackButton
          fallbackUrl={`/budgets/${slug}`}
          label="Back"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-[#61bc47] mb-4 transition-colors"
        />

        <div>
          <h1 className="text-4xl font-bold text-primary dark:text-foreground mb-2">
            line items
          </h1>
          <p className="text-muted-foreground">
            All budget line items for {projectTitle}
          </p>
        </div>
      </div>

      {/* View Toggle */}
      <div className="mb-6 flex justify-center">
        <button
          onClick={() => setCategoryFilter(categoryFilter === "expense" ? "revenue" : "expense")}
          className="relative inline-flex rounded-xl bg-zinc-100 dark:bg-zinc-800 p-1 shadow-inner cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
        >
          {/* Sliding background indicator */}
          <div
            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-[#61BC47] rounded-lg shadow-md transition-all duration-300 ease-in-out pointer-events-none ${
              categoryFilter === "expense"
                ? "left-1"
                : "left-[calc(50%+2px)]"
            }`}
          />

          {/* Labels */}
          <div
            className={`relative z-10 px-8 py-2.5 rounded-lg font-medium transition-all duration-300 pointer-events-none ${
              categoryFilter === "expense"
                ? "text-white"
                : "text-muted-foreground"
            }`}
          >
            Expenses
          </div>
          <div
            className={`relative z-10 px-8 py-2.5 rounded-lg font-medium transition-all duration-300 pointer-events-none ${
              categoryFilter === "revenue"
                ? "text-white"
                : "text-muted-foreground"
            }`}
          >
            Revenue
          </div>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Budget */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Total Budget
            </h3>
            <DollarSign className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-3xl font-bold text-foreground">
            {formatCurrency(totalBudget)}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {expenseCount} expenses, {revenueCount} revenue
          </p>
        </div>

        {/* Total Spent */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Total Spent
            </h3>
            <TrendingUp className="w-5 h-5 text-orange-500" />
          </div>
          <div className="text-3xl font-bold text-foreground">
            {formatCurrency(totalSpent)}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Across {lineItems.length} line {lineItems.length === 1 ? "item" : "items"}
          </p>
        </div>

        {/* Remaining */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Remaining
            </h3>
            <TrendingDown className={`w-5 h-5 ${totalRemaining >= 0 ? "text-green-500" : "text-red-500"}`} />
          </div>
          <div className={`text-3xl font-bold ${
            totalRemaining >= 0
              ? "text-green-600 dark:text-green-400"
              : "text-red-600 dark:text-red-400"
          }`}>
            {formatCurrency(totalRemaining)}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {totalRemaining >= 0 ? "Under budget" : "Over budget"}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name, category, vendor, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-zinc-100 dark:bg-zinc-800 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#61bc47] text-foreground"
              />
            </div>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-4 py-2 bg-zinc-100 dark:bg-zinc-800 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#61bc47] text-foreground"
            >
              <option value="name">Name</option>
              <option value="budget">Budget Amount</option>
              <option value="spent">Spent Amount</option>
              <option value="remaining">Remaining Amount</option>
            </select>
          </div>
        </div>
      </div>

      {/* Line Items Cards */}
      <div className="space-y-4">
        {filteredLineItems.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-12 text-center">
            <p className="text-muted-foreground">No line items found</p>
          </div>
        ) : (
          filteredLineItems.map((item) => {
            const remaining = item.estimated - item.actual;
            const isOverBudget = remaining < 0;
            const percentSpent = item.estimated !== 0
              ? (item.actual / item.estimated) * 100
              : 0;

            return (
              <Link
                key={item.lineItemId}
                href={`/budgets/${slug}/line-items/${item.lineItemId}`}
                prefetch={true}
                className="block bg-card border border-border rounded-lg p-6 hover:shadow-lg hover:border-[#61bc47]/30 transition-all"
              >
                {/* Header */}
                <div className="space-y-2 mb-4">
                  {/* Category and pill on same line */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider leading-tight">
                      {item.categoryName}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      item.categoryType === "expense"
                        ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                        : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                    }`}>
                      {item.categoryType === "expense" ? "EXPENSE" : "REVENUE"}
                    </span>
                  </div>

                  {/* Title full-width */}
                  <h3 className="text-xl font-bold text-foreground leading-tight">
                    {item.name}
                  </h3>
                </div>

                {/* Details Row */}
                <div className="space-y-3">
                  <div className="space-y-2">
                    {item.vendor && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Vendor:</span>
                        <span className="text-foreground font-medium">{item.vendor}</span>
                      </div>
                    )}

                    {item.description && (
                      <p className="text-sm text-muted-foreground italic">
                        {item.description}
                      </p>
                    )}

                    {/* Compact bar chart - only show for items with a budget */}
                    {item.estimated !== 0 && (
                      <div className="mt-3 space-y-2">
                        {/* Labels row */}
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{item.categoryType === "revenue" ? "Received" : "Spent"}</span>
                          <span>{item.categoryType === "revenue" ? "Expected" : "Budgeted"}</span>
                        </div>

                        {/* Progress bar */}
                        <div className="relative h-8 bg-zinc-200 dark:bg-zinc-700 rounded-lg overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              item.categoryType === "revenue"
                                ? (item.actual >= item.estimated ? "bg-green-500" : "bg-yellow-500")
                                : (item.actual <= item.estimated ? "bg-green-500" : "bg-red-500")
                            }`}
                            style={{
                              width: item.estimated > 0
                                ? `${Math.min((item.actual / item.estimated) * 100, 100)}%`
                                : '0%'
                            }}
                          />
                          <div className="absolute inset-0 flex items-center justify-between px-2 text-xs font-semibold">
                            <span className={item.actual > item.estimated * 0.3 ? "text-white" : "text-foreground"}>
                              {formatCurrency(item.actual)}
                            </span>
                            <span className="text-foreground">{formatCurrency(item.estimated)}</span>
                          </div>
                        </div>

                        {/* Remaining */}
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Remaining:</span>
                          <span className={`font-semibold ${
                            remaining >= 0
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }`}>
                            {formatCurrency(remaining)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* For zero-budget items, show amount earned/spent based on type */}
                    {item.estimated === 0 && item.actual > 0 && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {item.categoryType === "revenue" ? "Received:" : "Spent:"}
                          </span>
                          <span className={`font-semibold ${
                            item.categoryType === "revenue"
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }`}>
                            {formatCurrency(item.actual)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action buttons on separate line */}
                  {permissions.canManageLineItems && (
                    <div className="flex items-center justify-end gap-2 pt-2">
                      {item.categoryType === "expense" && permissions.canManagePurchaseRequests && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            router.push(`/budgets/${slug}/purchase-requests?lineItemId=${item.lineItemId}`);
                          }}
                          className="p-2 hover:bg-green-100 dark:hover:bg-green-900/30 rounded transition-colors"
                          title="Create purchase request"
                        >
                          <Plus className="w-5 h-5 text-[#61bc47]" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          router.push(`/budgets/${slug}/line-items/${item.lineItemId}`);
                        }}
                        className="p-2 hover:bg-zinc-300 dark:hover:bg-zinc-600 rounded transition-colors"
                        title="Edit line item"
                      >
                        <Edit className="w-5 h-5 text-muted-foreground" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          if (confirm(`Are you sure you want to delete "${item.name}"?`)) {
                            handleDeleteLineItem(item.lineItemId, item.name);
                          }
                        }}
                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                        title="Delete line item"
                      >
                        <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                      </button>
                    </div>
                  )}
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
