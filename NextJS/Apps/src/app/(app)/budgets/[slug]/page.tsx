"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useProjects } from "@/hooks/useProjects";
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
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  FileText,
  ShoppingCart,
} from "lucide-react";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, PieChart, Pie } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  Expected_Discounts_Budget: number | null;
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
  incomeCategories: BudgetCategory[];
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

function CategorySection({
  category,
  projectSlug,
  projectId,
  onEditExpectedRevenue,
  isEditingRevenue,
  revenueJustSaved,
  onEditDiscountsBudget,
  isEditingDiscounts,
  discountsJustSaved,
  onEditCategory,
  onDeleteCategory,
  isDeleting,
  onEditLineItem,
  onDeleteLineItem,
  onAddLineItem,
  onCreatePurchaseRequest,
}: {
  category: BudgetCategory;
  projectSlug: string;
  projectId: number;
  onEditExpectedRevenue?: () => void;
  isEditingRevenue?: boolean;
  revenueJustSaved?: boolean;
  onEditDiscountsBudget?: () => void;
  isEditingDiscounts?: boolean;
  discountsJustSaved?: boolean;
  onEditCategory?: () => void;
  onDeleteCategory?: () => void;
  isDeleting?: boolean;
  onEditLineItem?: (lineItemId: string) => void;
  onDeleteLineItem?: (lineItemId: string, lineItemName: string) => void;
  onAddLineItem?: () => void;
  onCreatePurchaseRequest?: (lineItemId: string, lineItemName: string, estimated: number, vendor: string | null) => void;
}) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const variance = category.actual - category.estimated;
  const variancePercent =
    category.estimated > 0 ? (variance / category.estimated) * 100 : 0;

  // Simplified view for registration discounts and revenue (no individual budgets per line item)
  const isSimplifiedView = category.categoryId === 'registration-discounts' || category.categoryId === 'registration-income';

  return (
    <div className={`rounded-lg overflow-hidden transition-opacity ${
      isSimplifiedView
        ? "bg-blue-50/30 dark:bg-blue-950/10 border-2 border-blue-100 dark:border-blue-900/30"
        : "bg-card border border-border"
    } ${isDeleting ? "opacity-50 pointer-events-none" : ""}`}>
      {/* Category Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full px-6 py-4 border-b transition-colors cursor-pointer ${
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
              <div className={`font-semibold text-muted-foreground transition-all ${
                (isEditingRevenue || isEditingDiscounts) ? 'opacity-50' : ''
              }`}>
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
            {!isSimplifiedView ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditCategory?.();
                  }}
                  className="p-1.5 hover:bg-zinc-400 dark:hover:bg-zinc-700 rounded transition-colors"
                  title="Edit category"
                >
                  <Edit className="w-4 h-4 text-muted-foreground" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteCategory?.();
                  }}
                  className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                  title="Delete category"
                >
                  <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                {category.categoryId === 'registration-income' && onEditExpectedRevenue && (
                  <>
                    {isEditingRevenue ? (
                      <div className="p-1.5">
                        <Loader2 className="w-4 h-4 text-[#61bc47] animate-spin" />
                      </div>
                    ) : revenueJustSaved ? (
                      <div className="p-1.5 animate-in zoom-in duration-300">
                        <CheckCircle2 className="w-4 h-4 text-[#61bc47]" />
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditExpectedRevenue();
                        }}
                        className="p-1.5 hover:bg-zinc-400 dark:hover:bg-zinc-700 rounded transition-colors"
                        title="Edit expected registration revenue"
                      >
                        <Edit className="w-4 h-4 text-muted-foreground" />
                      </button>
                    )}
                  </>
                )}
                {category.categoryId === 'registration-discounts' && onEditDiscountsBudget && (
                  <>
                    {isEditingDiscounts ? (
                      <div className="p-1.5">
                        <Loader2 className="w-4 h-4 text-[#61bc47] animate-spin" />
                      </div>
                    ) : discountsJustSaved ? (
                      <div className="p-1.5 animate-in zoom-in duration-300">
                        <CheckCircle2 className="w-4 h-4 text-[#61bc47]" />
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditDiscountsBudget();
                        }}
                        className="p-1.5 hover:bg-zinc-400 dark:hover:bg-zinc-700 rounded transition-colors"
                        title="Edit expected discounts budget"
                      >
                        <Edit className="w-4 h-4 text-muted-foreground" />
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

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
                  </>
                )}
                {!isSimplifiedView && (
                  <th className="px-6 py-3 text-center text-xs font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {category.lineItems.map((item) => {
                const itemVariance = item.actual - item.estimated;
                const itemVariancePercent =
                  item.estimated > 0 ? (itemVariance / item.estimated) * 100 : 0;
                const isLoading = String(item.lineItemId).startsWith('temp-');

                return (
                  <tr
                    key={item.lineItemId}
                    onClick={() => !isLoading && router.push(`/budgets/${projectSlug}/line-items/${item.lineItemId}`)}
                    className={`transition-colors ${isLoading ? 'cursor-wait animate-pulse opacity-60' : 'cursor-pointer'} ${
                      isSimplifiedView
                        ? "bg-blue-50/20 dark:bg-blue-950/10 hover:bg-blue-50/40 dark:hover:bg-blue-950/20"
                        : "bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-foreground flex items-center gap-2">
                          {item.name}
                          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
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
                      </>
                    )}
                    {!isSimplifiedView && (
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {category.type === "expense" && onCreatePurchaseRequest && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onCreatePurchaseRequest(item.lineItemId, item.name, item.estimated, item.vendor);
                              }}
                              disabled={isLoading}
                              className="p-1.5 hover:bg-green-100 dark:hover:bg-green-900/30 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Create purchase request"
                            >
                              <Plus className="w-4 h-4 text-[#61bc47] dark:text-[#61bc47]" />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditLineItem?.(item.lineItemId);
                            }}
                            disabled={isLoading}
                            className="p-1.5 hover:bg-zinc-300 dark:hover:bg-zinc-600 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Edit line item"
                          >
                            <Edit className="w-4 h-4 text-muted-foreground" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteLineItem?.(item.lineItemId, item.name);
                            }}
                            disabled={isLoading}
                            className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Delete line item"
                          >
                            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Line Item Button */}
      {isExpanded && !isSimplifiedView && (
        <button
          onClick={onAddLineItem}
          className="w-full py-3 border-t border-border hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors flex items-center justify-center gap-2 text-[#61bc47] hover:text-[#52a03c] cursor-pointer"
          title="Add new line item"
        >
          <Plus className="w-4 h-4" />
          <span className="font-medium text-sm">Add Line Item</span>
        </button>
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
  const router = useRouter();
  const { projects: allProjects } = useProjects(); // Fetch all projects for dropdown

  const [project, setProject] = useState<ProjectBudgetDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"expenses" | "income">("expenses");

  // Find projects of the same type for dropdown
  const currentProject = allProjects.find(p => p.slug === slug);
  const projectsOfSameType = currentProject?.typeId && currentProject.typeId !== 0
    ? allProjects.filter(p => p.typeId === currentProject.typeId).sort((a, b) =>
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      )
    : [];

  // Edit Expected Registration Revenue modal state
  const [isEditRevenueOpen, setIsEditRevenueOpen] = useState(false);
  const [editRevenueValue, setEditRevenueValue] = useState<string>("");
  const [isSavingRevenue, setIsSavingRevenue] = useState(false);
  const [revenueJustSaved, setRevenueJustSaved] = useState(false);

  // Edit Expected Discounts Budget modal state
  const [isEditDiscountsOpen, setIsEditDiscountsOpen] = useState(false);
  const [editDiscountsValue, setEditDiscountsValue] = useState<string>("");
  const [isSavingDiscounts, setIsSavingDiscounts] = useState(false);
  const [discountsJustSaved, setDiscountsJustSaved] = useState(false);

  // Add Category modal state
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");
  const [newCategoryExpectedAmount, setNewCategoryExpectedAmount] = useState<string>("");
  const [newCategoryType, setNewCategoryType] = useState<"expense" | "revenue">("expense");
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [availableCategoryTypes, setAvailableCategoryTypes] = useState<Array<{
    Project_Category_Type_ID: number;
    Project_Category_Type: string;
    Is_Revenue: boolean;
  }>>([]);
  const [isLoadingCategoryTypes, setIsLoadingCategoryTypes] = useState(false);

  // Edit Category modal state
  const [isEditCategoryOpen, setIsEditCategoryOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState<string>("");
  const [editCategoryBudgetValue, setEditCategoryBudgetValue] = useState<string>("");
  const [isSavingEditCategory, setIsSavingEditCategory] = useState(false);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);

  // Edit Line Item modal state
  const [isEditLineItemOpen, setIsEditLineItemOpen] = useState(false);
  const [editingLineItemId, setEditingLineItemId] = useState<string | null>(null);
  const [editingLineItemCategoryId, setEditingLineItemCategoryId] = useState<string | null>(null);
  const [editLineItemName, setEditLineItemName] = useState<string>("");
  const [editLineItemVendor, setEditLineItemVendor] = useState<string>("");
  const [editLineItemEstimated, setEditLineItemEstimated] = useState<string>("");
  const [editLineItemDescription, setEditLineItemDescription] = useState<string>("");
  const [isSavingEditLineItem, setIsSavingEditLineItem] = useState(false);

  // Add Line Item modal state
  const [isAddLineItemOpen, setIsAddLineItemOpen] = useState(false);
  const [addLineItemCategoryId, setAddLineItemCategoryId] = useState<string | null>(null);
  const [newLineItemName, setNewLineItemName] = useState<string>("");
  const [newLineItemVendor, setNewLineItemVendor] = useState<string>("");
  const [newLineItemEstimated, setNewLineItemEstimated] = useState<string>("");
  const [newLineItemDescription, setNewLineItemDescription] = useState<string>("");
  const [isSavingLineItem, setIsSavingLineItem] = useState(false);

  // Create Purchase Request modal state
  const [isCreatePurchaseRequestOpen, setIsCreatePurchaseRequestOpen] = useState(false);
  const [createPRLineItemId, setCreatePRLineItemId] = useState<string>("");
  const [createPRLineItemName, setCreatePRLineItemName] = useState<string>("");
  const [createPRAmount, setCreatePRAmount] = useState<string>("");
  const [createPRDescription, setCreatePRDescription] = useState<string>("");
  const [createPRVendorName, setCreatePRVendorName] = useState<string>("");
  const [isSavingPurchaseRequest, setIsSavingPurchaseRequest] = useState(false);

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

  // Fetch category types when modal opens (only for expense categories)
  useEffect(() => {
    async function fetchCategoryTypes() {
      if (!isAddCategoryOpen || newCategoryType === 'revenue' || !project) return;

      try {
        setIsLoadingCategoryTypes(true);
        const response = await fetch(`/api/category-types?type=${newCategoryType}`);

        if (!response.ok) {
          throw new Error("Failed to fetch category types");
        }

        const types = await response.json();

        // Filter out category types that are already in use for this project
        const existingCategoryNames = new Set(
          project.expenseCategories.map(cat => cat.name)
        );

        const filteredTypes = types.filter(
          (type: { Project_Category_Type: string }) =>
            !existingCategoryNames.has(type.Project_Category_Type)
        );

        setAvailableCategoryTypes(filteredTypes);
      } catch (err) {
        console.error("Error fetching category types:", err);
      } finally {
        setIsLoadingCategoryTypes(false);
      }
    }

    fetchCategoryTypes();
  }, [isAddCategoryOpen, newCategoryType, project]);

  async function handleSaveExpectedRevenue() {
    if (!project) return;

    const newValue = parseFloat(editRevenueValue) || 0;
    const previousValue = project.Expected_Registration_Revenue || 0;

    // Close modal immediately
    setIsEditRevenueOpen(false);
    setIsSavingRevenue(true);

    // Optimistically update UI immediately
    setProject({
      ...project,
      Expected_Registration_Revenue: newValue,
      Total_Expected_Income: (project.Total_Expected_Income - previousValue) + newValue,
      registrationIncomeCategory: {
        ...project.registrationIncomeCategory,
        estimated: newValue,
      },
    });

    try {
      // Call API to update Expected_Registration_Revenue
      const response = await fetch(`/api/projects/${project.Project_ID}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          Expected_Registration_Revenue: newValue,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update expected revenue");
      }

      // Show success indicator on the field
      setIsSavingRevenue(false);
      setRevenueJustSaved(true);
      setTimeout(() => {
        setRevenueJustSaved(false);
      }, 2000);
    } catch (err) {
      console.error("Error updating expected revenue:", err);

      // Revert optimistic update on error
      setProject({
        ...project,
        Expected_Registration_Revenue: previousValue,
        Total_Expected_Income: (project.Total_Expected_Income - newValue) + previousValue,
        registrationIncomeCategory: {
          ...project.registrationIncomeCategory,
          estimated: previousValue,
        },
      });

      setIsSavingRevenue(false);
      alert(err instanceof Error ? err.message : "Failed to update expected revenue");
    }
  }

  async function handleSaveExpectedDiscounts() {
    if (!project) return;

    const newValue = parseFloat(editDiscountsValue) || 0;
    const previousValue = project.Expected_Discounts_Budget || 0;

    // Close modal immediately
    setIsEditDiscountsOpen(false);
    setIsSavingDiscounts(true);

    // Optimistically update UI immediately
    setProject({
      ...project,
      Expected_Discounts_Budget: newValue,
      Total_Budget: (project.Total_Budget - previousValue) + newValue,
      registrationDiscountsCategory: {
        ...project.registrationDiscountsCategory,
        estimated: newValue,
      },
    });

    try {
      // Call API to update Expected_Discounts_Budget
      const response = await fetch(`/api/projects/${project.Project_ID}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          Expected_Discounts_Budget: newValue,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update expected discounts budget");
      }

      // Show success indicator on the field
      setIsSavingDiscounts(false);
      setDiscountsJustSaved(true);
      setTimeout(() => {
        setDiscountsJustSaved(false);
      }, 2000);
    } catch (err) {
      console.error("Error updating expected discounts:", err);

      // Revert optimistic update on error
      setProject({
        ...project,
        Expected_Discounts_Budget: previousValue,
        Total_Budget: (project.Total_Budget - newValue) + previousValue,
        registrationDiscountsCategory: {
          ...project.registrationDiscountsCategory,
          estimated: previousValue,
        },
      });

      setIsSavingDiscounts(false);
      alert(err instanceof Error ? err.message : "Failed to update expected discounts budget");
    }
  }

  async function handleAddCategory() {
    if (!project) return;

    // Determine the actual category name to use
    const categoryName = newCategoryName === "__NEW__" ? newCategoryDescription.trim() : newCategoryName.trim();

    if (!categoryName) {
      toast.error("Please enter a category name");
      return;
    }

    // Close modal immediately
    setIsAddCategoryOpen(false);

    // Create temporary category for optimistic update
    const budgetedAmount = parseFloat(newCategoryExpectedAmount) || 0;
    const tempCategory: BudgetCategory = {
      categoryId: `temp-${Date.now()}`,
      name: categoryName,
      type: newCategoryType,
      description: newCategoryName === "__NEW__" ? undefined : (newCategoryDescription || undefined),
      estimated: budgetedAmount,
      actual: 0,
      sortOrder: 999,
      lineItems: [],
    };

    // Optimistically update UI immediately
    const updatedProject = { ...project };
    if (newCategoryType === "expense") {
      updatedProject.expenseCategories = [...project.expenseCategories, tempCategory];
      // Update total budget
      updatedProject.Total_Budget = project.Total_Budget + budgetedAmount;
    } else {
      updatedProject.incomeCategories = [...project.incomeCategories, tempCategory];
      // Update total expected income
      updatedProject.Total_Expected_Income = project.Total_Expected_Income + tempCategory.estimated;
    }
    setProject(updatedProject);

    // Use toast.promise for automatic loading/success/error states
    toast.promise(
      (async () => {
        let createdCategory;

        if (newCategoryType === "expense") {
          // Expense categories use the categories endpoint
          const response = await fetch(`/api/projects/${project.Project_ID}/categories`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: categoryName,
              type: newCategoryType,
              description: newCategoryName === "__NEW__" ? null : (newCategoryDescription || null),
              budgetedAmount: budgetedAmount,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to create category");
          }

          createdCategory = await response.json();
        } else {
          // Income categories are actually income line items
          const response = await fetch(`/api/projects/${project.Project_ID}/income-line-items`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: newCategoryName,
              expectedAmount: parseFloat(newCategoryExpectedAmount) || 0,
              description: null,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to create income source");
          }

          createdCategory = await response.json();
        }

        // Update with real category data
        const finalProject = { ...project };
        if (newCategoryType === "expense") {
          finalProject.expenseCategories = [
            ...project.expenseCategories,
            createdCategory,
          ];
        } else {
          finalProject.incomeCategories = [
            ...project.incomeCategories,
            createdCategory,
          ];
        }
        setProject(finalProject);

        // Reset form
        setNewCategoryName("");
        setNewCategoryDescription("");
        setNewCategoryExpectedAmount("");
        setNewCategoryType("expense");

        return categoryName;
      })(),
      {
        loading: `Creating ${newCategoryType} category...`,
        success: (name) => `${name} created successfully`,
        error: (err) => {
          // Revert optimistic update on error
          const revertedProject = { ...project };
          if (newCategoryType === "expense") {
            revertedProject.expenseCategories = project.expenseCategories.filter(
              (cat) => cat.categoryId !== tempCategory.categoryId
            );
          } else {
            revertedProject.incomeCategories = project.incomeCategories.filter(
              (cat) => cat.categoryId !== tempCategory.categoryId
            );
            // Revert total expected income
            revertedProject.Total_Expected_Income = project.Total_Expected_Income - tempCategory.estimated;
          }
          setProject(revertedProject);

          return err instanceof Error ? err.message : "Failed to create category";
        },
      }
    );
  }

  async function handleEditCategory() {
    if (!project || !editingCategoryId) return;

    const newBudgetValue = parseFloat(editCategoryBudgetValue) || 0;

    // Find the category being edited to get previous values
    const allCategories = [...project.expenseCategories, ...project.incomeCategories];
    const categoryToEdit = allCategories.find(cat => cat.categoryId === editingCategoryId);

    if (!categoryToEdit) return;

    // For income categories, validate name
    const newName = editCategoryName.trim();
    if (categoryToEdit.type === "revenue" && !newName) {
      toast.error("Name is required");
      return;
    }

    const previousBudgetValue = categoryToEdit.estimated;
    const previousName = categoryToEdit.name;

    // 1. Show loading state on modal
    setIsSavingEditCategory(true);

    // 2. Create the async operation
    const updateOperation = (async () => {
      // Optimistically update UI
      const updatedProject = { ...project };
      if (categoryToEdit.type === "expense") {
        updatedProject.expenseCategories = project.expenseCategories.map(cat =>
          cat.categoryId === editingCategoryId
            ? { ...cat, name: newName, estimated: newBudgetValue }
            : cat
        );
        updatedProject.Total_Budget = (project.Total_Budget - previousBudgetValue) + newBudgetValue;
      } else {
        updatedProject.incomeCategories = project.incomeCategories.map(cat =>
          cat.categoryId === editingCategoryId
            ? { ...cat, name: newName, estimated: newBudgetValue }
            : cat
        );
        updatedProject.Total_Expected_Income = (project.Total_Expected_Income - previousBudgetValue) + newBudgetValue;
      }
      setProject(updatedProject);

      // Make API call
      let response;
      if (categoryToEdit.type === "expense") {
        response = await fetch(`/api/projects/${project.Project_ID}/categories`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            categoryId: editingCategoryId,
            budgetedAmount: newBudgetValue,
          }),
        });
      } else {
        response = await fetch(`/api/projects/${project.Project_ID}/income-line-items`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lineItemId: editingCategoryId,
            name: newName,
            expectedAmount: newBudgetValue,
          }),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();

        // Revert optimistic update on error
        const revertedProject = { ...project };
        if (categoryToEdit.type === "expense") {
          revertedProject.expenseCategories = project.expenseCategories.map(cat =>
            cat.categoryId === editingCategoryId
              ? { ...cat, name: previousName, estimated: previousBudgetValue }
              : cat
          );
          revertedProject.Total_Budget = (updatedProject.Total_Budget - newBudgetValue) + previousBudgetValue;
        } else {
          revertedProject.incomeCategories = project.incomeCategories.map(cat =>
            cat.categoryId === editingCategoryId
              ? { ...cat, name: previousName, estimated: previousBudgetValue }
              : cat
          );
          revertedProject.Total_Expected_Income = (updatedProject.Total_Expected_Income - newBudgetValue) + previousBudgetValue;
        }
        setProject(revertedProject);

        throw new Error(errorData.error || "Failed to update category");
      }

      return categoryToEdit.name;
    })();

    // 3. Toast with async operation
    toast.promise(updateOperation, {
      loading: "Updating category...",
      success: (name) => `${name} updated successfully`,
      error: (err) => err.message || "Failed to update category",
    });

    // 4. Cleanup after operation completes
    updateOperation.finally(() => {
      setIsSavingEditCategory(false);
      setIsEditCategoryOpen(false);
      setEditingCategoryId(null);
      setEditCategoryName("");
      setEditCategoryBudgetValue("");
    });
  }

  async function handleDeleteCategory(categoryId: string, categoryName: string) {
    if (!project) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete the category "${categoryName}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    // Find the category to delete
    const allCategories = [...project.expenseCategories, ...project.incomeCategories];
    const categoryToDelete = allCategories.find(cat => cat.categoryId === categoryId);

    if (!categoryToDelete) return;

    // 1. Micro-interaction - Show loading state on the category (gray it out, keep in DOM)
    setDeletingCategoryId(categoryId);

    // 2. Create the async operation
    const deleteOperation = (async () => {
      let response;

      if (categoryToDelete.type === "expense") {
        // Delete expense category
        response = await fetch(
          `/api/projects/${project.Project_ID}/categories?categoryId=${categoryId}`,
          {
            method: "DELETE",
          }
        );
      } else {
        // Delete income line item
        response = await fetch(
          `/api/projects/${project.Project_ID}/income-line-items?lineItemId=${categoryId}`,
          {
            method: "DELETE",
          }
        );
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete category");
      }

      // 3. Update UI after successful deletion (with small delay for toast to display)
      setTimeout(() => {
        setProject((prevProject) => {
          if (!prevProject) return prevProject;

          const updatedProject = { ...prevProject };
          if (categoryToDelete.type === "expense") {
            updatedProject.expenseCategories = prevProject.expenseCategories.filter(
              cat => cat.categoryId !== categoryId
            );
            // Update total budget
            updatedProject.Total_Budget = prevProject.Total_Budget - categoryToDelete.estimated;
          } else {
            updatedProject.incomeCategories = prevProject.incomeCategories.filter(
              cat => cat.categoryId !== categoryId
            );
            // Update total expected income
            updatedProject.Total_Expected_Income = prevProject.Total_Expected_Income - categoryToDelete.estimated;
          }
          return updatedProject;
        });
      }, 300); // Give toast time to render before removing from DOM

      return categoryName;
    })();

    // 3. Toast confirmation with async operation
    toast.promise(deleteOperation, {
      loading: "Deleting category...",
      success: (name) => `${name} deleted successfully`,
      error: (err) => err.message || "Failed to delete category",
    });

    // 4. Clear loading state after operation completes (success or error)
    deleteOperation.finally(() => {
      setDeletingCategoryId(null);
    });
  }

  async function handleEditLineItem() {
    if (!project || !editingLineItemId || !editingLineItemCategoryId) return;

    // Capture values before closing modal
    const newEstimated = parseFloat(editLineItemEstimated) || 0;
    const newName = editLineItemName.trim();
    const newVendor = editLineItemVendor.trim() || null;
    const newDescription = editLineItemDescription.trim() || null;

    if (!newName) {
      toast.error("Name is required");
      return;
    }

    // Find the category and line item being edited
    const allCategories = [...project.expenseCategories, ...project.incomeCategories];
    const category = allCategories.find(cat => cat.categoryId === editingLineItemCategoryId);

    if (!category) return;

    const lineItem = category.lineItems.find(item => item.lineItemId === editingLineItemId);

    if (!lineItem) return;

    const previousEstimated = lineItem.estimated;
    const previousName = lineItem.name;
    const previousVendor = lineItem.vendor;
    const previousDescription = lineItem.description;

    // Close modal immediately and reset form
    setIsEditLineItemOpen(false);
    setEditingLineItemId(null);
    setEditingLineItemCategoryId(null);
    setEditLineItemName("");
    setEditLineItemVendor("");
    setEditLineItemEstimated("");
    setEditLineItemDescription("");

    // Create async operation with optimistic update
    const updateOperation = (async () => {
      // Optimistically update UI immediately
      const updatedProject = { ...project };
    if (category.type === "expense") {
      updatedProject.expenseCategories = project.expenseCategories.map(cat =>
        cat.categoryId === editingLineItemCategoryId
          ? {
              ...cat,
              lineItems: cat.lineItems.map(item =>
                item.lineItemId === editingLineItemId
                  ? {
                      ...item,
                      name: newName,
                      vendor: newVendor,
                      estimated: newEstimated,
                      description: newDescription,
                    }
                  : item
              ),
              estimated: cat.estimated - previousEstimated + newEstimated,
            }
          : cat
      );
      // Update total budget
      updatedProject.Total_Budget = (project.Total_Budget - previousEstimated) + newEstimated;
    } else {
      // Income line items - update via income-line-items endpoint
      updatedProject.incomeCategories = project.incomeCategories.map(cat =>
        cat.categoryId === editingLineItemCategoryId
          ? {
              ...cat,
              name: newName,
              estimated: newEstimated,
              description: newDescription || undefined,
              lineItems: cat.lineItems.map(item =>
                item.lineItemId === editingLineItemId
                  ? {
                      ...item,
                      name: newName,
                      estimated: newEstimated,
                      description: newDescription,
                    }
                  : item
              ),
            }
          : cat
      );
      // Update total expected income
      updatedProject.Total_Expected_Income = (project.Total_Expected_Income - previousEstimated) + newEstimated;
    }
      setProject(updatedProject);

      // Make API call
      let response;

      if (category.type === "expense") {
        // Update expense line item
        response = await fetch(`/api/projects/${project.Project_ID}/categories/${editingLineItemCategoryId}/line-items`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            lineItemId: editingLineItemId,
            name: newName,
            vendor: newVendor,
            estimatedAmount: newEstimated,
            description: newDescription,
          }),
        });
      } else {
        // Update income line item (which is actually the income category itself)
        response = await fetch(`/api/projects/${project.Project_ID}/income-line-items`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            lineItemId: editingLineItemCategoryId,
            name: newName,
            expectedAmount: newEstimated,
            description: newDescription,
          }),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();

        // Revert optimistic update on error
        const revertedProject = { ...project };
        if (category.type === "expense") {
          revertedProject.expenseCategories = project.expenseCategories.map(cat =>
            cat.categoryId === editingLineItemCategoryId
              ? {
                  ...cat,
                  lineItems: cat.lineItems.map(item =>
                    item.lineItemId === editingLineItemId
                      ? {
                          ...item,
                          name: previousName,
                          vendor: previousVendor,
                          estimated: previousEstimated,
                          description: previousDescription,
                        }
                      : item
                  ),
                  estimated: cat.estimated - newEstimated + previousEstimated,
                }
              : cat
          );
          revertedProject.Total_Budget = (updatedProject.Total_Budget - newEstimated) + previousEstimated;
        } else {
          revertedProject.incomeCategories = project.incomeCategories;
          revertedProject.Total_Expected_Income = (updatedProject.Total_Expected_Income - newEstimated) + previousEstimated;
        }
        setProject(revertedProject);

        throw new Error(errorData.error || "Failed to update line item");
      }

      return newName;
    })();

    // Toast notifications
    toast.promise(updateOperation, {
      loading: "Updating line item...",
      success: (name) => `${name} updated successfully`,
      error: (err) => err.message || "Failed to update line item",
    });

    // Cleanup - no state to reset since modal is already closed
    updateOperation.finally(() => {
      // Nothing to clean up
    });
  }

  async function handleDeleteLineItem(categoryId: string, lineItemId: string, lineItemName: string) {
    if (!project) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete the line item "${lineItemName}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    // Find the category and line item to delete
    const allCategories = [...project.expenseCategories, ...project.incomeCategories];
    const category = allCategories.find(cat => cat.categoryId === categoryId);

    if (!category) return;

    const lineItem = category.lineItems.find(item => item.lineItemId === lineItemId);

    if (!lineItem) return;

    // Create async delete operation with optimistic update
    const deleteOperation = (async () => {
      // Optimistically update UI immediately
      const updatedProject = { ...project };
      if (category.type === "expense") {
        updatedProject.expenseCategories = project.expenseCategories.map(cat =>
          cat.categoryId === categoryId
            ? {
                ...cat,
                lineItems: cat.lineItems.filter(item => item.lineItemId !== lineItemId),
                estimated: cat.estimated - lineItem.estimated,
              }
            : cat
        );
        // Update total budget
        updatedProject.Total_Budget = project.Total_Budget - lineItem.estimated;
      } else {
        // Income line items - these are categories themselves, so delete the category
        updatedProject.incomeCategories = project.incomeCategories.filter(
          cat => cat.categoryId !== categoryId
        );
        // Update total expected income
        updatedProject.Total_Expected_Income = project.Total_Expected_Income - lineItem.estimated;
      }
      setProject(updatedProject);

      // Make API call
      let response;

      if (category.type === "expense") {
        // Delete expense line item
        response = await fetch(
          `/api/projects/${project.Project_ID}/categories/${categoryId}/line-items?lineItemId=${lineItemId}`,
          {
            method: "DELETE",
          }
        );
      } else {
        // Delete income line item (delete the category)
        response = await fetch(
          `/api/projects/${project.Project_ID}/income-line-items?lineItemId=${categoryId}`,
          {
            method: "DELETE",
          }
        );
      }

      if (!response.ok) {
        const errorData = await response.json();

        // Revert optimistic update on error
        setProject(project);

        throw new Error(errorData.error || "Failed to delete line item");
      }

      return lineItemName;
    })();

    // Toast notifications
    toast.promise(deleteOperation, {
      loading: "Deleting line item...",
      success: (name) => `${name} deleted successfully`,
      error: (err) => err.message || "Failed to delete line item",
    });

    // No cleanup needed
    deleteOperation.finally(() => {
      // Nothing to clean up
    });
  }

  async function handleAddLineItem() {
    if (!project || !addLineItemCategoryId) return;

    // Capture form values before resetting
    const newEstimated = parseFloat(newLineItemEstimated) || 0;
    const newName = newLineItemName.trim();
    const newVendor = newLineItemVendor.trim() || null;
    const newDescription = newLineItemDescription.trim() || null;

    if (!newName) {
      toast.error("Name is required");
      return;
    }

    // Find the category to add the line item to
    const category = project.expenseCategories.find(cat => cat.categoryId === addLineItemCategoryId);

    if (!category) return;

    // Create temporary line item with loading state
    const tempId = `temp-${Date.now()}`;
    const tempLineItem: BudgetLineItem = {
      lineItemId: tempId,
      name: newName,
      vendor: newVendor,
      estimated: newEstimated,
      actual: 0,
      description: newDescription,
      sortOrder: 999,
    };

    // 1. Close modal immediately and reset form
    setIsAddLineItemOpen(false);
    setNewLineItemName("");
    setNewLineItemVendor("");
    setNewLineItemEstimated("");
    setNewLineItemDescription("");

    // 2. Add temp row with loading state (optimistic update)
    const updatedProject = { ...project };
    updatedProject.expenseCategories = project.expenseCategories.map(cat =>
      cat.categoryId === addLineItemCategoryId
        ? {
            ...cat,
            lineItems: [...cat.lineItems, tempLineItem],
            estimated: cat.estimated + newEstimated,
          }
        : cat
    );
    updatedProject.Total_Budget = project.Total_Budget + newEstimated;
    setProject(updatedProject);

    // 3. Make API call
    const createOperation = (async () => {
      const requestBody = {
        name: newName,
        vendor: newVendor,
        estimatedAmount: newEstimated,
        description: newDescription,
      };

      const url = `/api/projects/${project.Project_ID}/categories/${addLineItemCategoryId}/line-items`;

      console.log("Creating line item:");
      console.log("  URL:", url);
      console.log("  Body:", requestBody);
      console.log("  Project ID:", project.Project_ID);
      console.log("  Category ID:", addLineItemCategoryId);

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
        }

        console.error("API Error:", errorData);

        // Revert optimistic update on error
        setProject((prevProject) => {
          const revertedProject = { ...prevProject };
          revertedProject.expenseCategories = prevProject.expenseCategories.map(cat =>
            cat.categoryId === addLineItemCategoryId
              ? {
                  ...cat,
                  lineItems: cat.lineItems.filter(item => item.lineItemId !== tempId),
                  estimated: cat.estimated - newEstimated,
                }
              : cat
          );
          revertedProject.Total_Budget = prevProject.Total_Budget - newEstimated;
          return revertedProject;
        });

        throw new Error(errorData.error || errorData.details || "Failed to create line item");
      }

      const createdLineItem = await response.json();
      console.log("Created line item:", createdLineItem);

      // Replace temp item with real data
      setProject((prevProject) => {
        const finalProject = { ...prevProject };
        finalProject.expenseCategories = prevProject.expenseCategories.map(cat =>
          cat.categoryId === addLineItemCategoryId
            ? {
                ...cat,
                lineItems: cat.lineItems.map(item =>
                  item.lineItemId === tempId ? createdLineItem : item
                ),
              }
            : cat
        );
        return finalProject;
      });

      return newName;
    })();

    // 4. Toast notifications
    toast.promise(createOperation, {
      loading: "Adding line item...",
      success: (name) => `${name} added successfully`,
      error: (err) => err.message || "Failed to add line item",
    });

    // 5. Cleanup
    createOperation.finally(() => {
      setAddLineItemCategoryId(null);
    });
  }

  async function handleCreatePurchaseRequest() {
    if (!project) return;

    const amount = parseFloat(createPRAmount) || 0;

    if (!createPRLineItemId) {
      alert("Line item is required");
      return;
    }

    if (amount <= 0) {
      alert("Amount must be greater than 0");
      return;
    }

    // Close modal immediately
    setIsCreatePurchaseRequestOpen(false);
    setIsSavingPurchaseRequest(true);

    try {
      const response = await fetch(`/api/projects/${project.Project_ID}/purchase-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lineItemId: createPRLineItemId,
          amount: amount,
          description: createPRDescription.trim() || null,
          vendorName: createPRVendorName.trim() || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create purchase request");
      }

      await response.json();

      setIsSavingPurchaseRequest(false);

      // Reset form
      setCreatePRLineItemId("");
      setCreatePRLineItemName("");
      setCreatePRAmount("");
      setCreatePRDescription("");
      setCreatePRVendorName("");

      alert("Purchase request created successfully! You can view it in the Purchase Requests tab.");
    } catch (err) {
      console.error("Error creating purchase request:", err);
      setIsSavingPurchaseRequest(false);
      alert(err instanceof Error ? err.message : "Failed to create purchase request");
    }
  }


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
    ...(project?.incomeCategories || []),
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
            {/* Title with dropdown for projects of the same type */}
            {projectsOfSameType.length > 1 ? (
              <div className="relative mb-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-4xl font-bold text-primary dark:text-foreground">
                    {project?.Project_Title}
                  </h1>
                  <ChevronDown className="w-6 h-6 text-foreground flex-shrink-0" />
                </div>
                <select
                  value={slug}
                  onChange={(e) => {
                    router.push(`/budgets/${e.target.value}`);
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                >
                  {projectsOfSameType.map((typeProject) => (
                    <option key={typeProject.id} value={typeProject.slug}>
                      {typeProject.title} ({typeProject.status})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <h1 className="text-4xl font-bold text-primary dark:text-foreground mb-2">
                {project?.Project_Title}
              </h1>
            )}
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
            <Link
              href={`/budgets/${slug}/purchase-requests`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              <ShoppingCart className="w-4 h-4" />
              Purchase Requests
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
                  projectId={project?.Project_ID || 0}
                  onEditDiscountsBudget={
                    category.categoryId === 'registration-discounts'
                      ? () => {
                          setEditDiscountsValue((project?.Expected_Discounts_Budget || 0).toString());
                          setIsEditDiscountsOpen(true);
                        }
                      : undefined
                  }
                  isEditingDiscounts={category.categoryId === 'registration-discounts' && isSavingDiscounts}
                  discountsJustSaved={category.categoryId === 'registration-discounts' && discountsJustSaved}
                  onEditCategory={
                    category.categoryId !== 'registration-discounts'
                      ? () => {
                          setEditingCategoryId(category.categoryId);
                          setEditCategoryName(category.name);
                          setEditCategoryBudgetValue(category.estimated.toString());
                          setIsEditCategoryOpen(true);
                        }
                      : undefined
                  }
                  onDeleteCategory={
                    category.categoryId !== 'registration-discounts'
                      ? () => handleDeleteCategory(category.categoryId, category.name)
                      : undefined
                  }
                  isDeleting={deletingCategoryId === category.categoryId}
                  onEditLineItem={
                    category.categoryId !== 'registration-discounts'
                      ? (lineItemId) => {
                          const lineItem = category.lineItems.find(item => item.lineItemId === lineItemId);
                          if (lineItem) {
                            setEditingLineItemId(lineItemId);
                            setEditingLineItemCategoryId(category.categoryId);
                            setEditLineItemName(lineItem.name);
                            setEditLineItemVendor(lineItem.vendor || "");
                            setEditLineItemEstimated(lineItem.estimated.toString());
                            setEditLineItemDescription(lineItem.description || "");
                            setIsEditLineItemOpen(true);
                          }
                        }
                      : undefined
                  }
                  onDeleteLineItem={
                    category.categoryId !== 'registration-discounts'
                      ? (lineItemId, lineItemName) => handleDeleteLineItem(category.categoryId, lineItemId, lineItemName)
                      : undefined
                  }
                  onAddLineItem={
                    category.categoryId !== 'registration-discounts'
                      ? () => {
                          setAddLineItemCategoryId(category.categoryId);
                          setIsAddLineItemOpen(true);
                        }
                      : undefined
                  }
                  onCreatePurchaseRequest={
                    category.categoryId !== 'registration-discounts'
                      ? (lineItemId, lineItemName, estimated, vendor) => {
                          setCreatePRLineItemId(lineItemId);
                          setCreatePRLineItemName(lineItemName);
                          setCreatePRAmount(estimated.toString());
                          setCreatePRVendorName(vendor || "");
                          setIsCreatePurchaseRequestOpen(true);
                        }
                      : undefined
                  }
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
                  projectId={project?.Project_ID || 0}
                  onEditExpectedRevenue={
                    category.categoryId === 'registration-income'
                      ? () => {
                          setEditRevenueValue((project?.Expected_Registration_Revenue || 0).toString());
                          setIsEditRevenueOpen(true);
                        }
                      : undefined
                  }
                  isEditingRevenue={category.categoryId === 'registration-income' && isSavingRevenue}
                  revenueJustSaved={category.categoryId === 'registration-income' && revenueJustSaved}
                  onEditCategory={
                    category.categoryId !== 'registration-income'
                      ? () => {
                          setEditingCategoryId(category.categoryId);
                          setEditCategoryName(category.name);
                          setEditCategoryBudgetValue(category.estimated.toString());
                          setIsEditCategoryOpen(true);
                        }
                      : undefined
                  }
                  onDeleteCategory={
                    category.categoryId !== 'registration-income'
                      ? () => handleDeleteCategory(category.categoryId, category.name)
                      : undefined
                  }
                  isDeleting={deletingCategoryId === category.categoryId}
                  onEditLineItem={
                    category.categoryId !== 'registration-income'
                      ? (lineItemId) => {
                          const lineItem = category.lineItems.find(item => item.lineItemId === lineItemId);
                          if (lineItem) {
                            setEditingLineItemId(lineItemId);
                            setEditingLineItemCategoryId(category.categoryId);
                            setEditLineItemName(lineItem.name);
                            setEditLineItemVendor(lineItem.vendor || "");
                            setEditLineItemEstimated(lineItem.estimated.toString());
                            setEditLineItemDescription(lineItem.description || "");
                            setIsEditLineItemOpen(true);
                          }
                        }
                      : undefined
                  }
                  onDeleteLineItem={
                    category.categoryId !== 'registration-income'
                      ? (lineItemId, lineItemName) => handleDeleteLineItem(category.categoryId, lineItemId, lineItemName)
                      : undefined
                  }
                />
              ))}

        {/* Add Category Button */}
        <button
          onClick={() => {
            setNewCategoryType(viewMode === "expenses" ? "expense" : "revenue");
            setIsAddCategoryOpen(true);
          }}
          className="w-full py-4 border-2 border-dashed border-border hover:border-[#61bc47] hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-lg transition-colors flex items-center justify-center gap-2 text-muted-foreground hover:text-[#61bc47]"
          title={`Add new ${viewMode === "expenses" ? "expense" : "income"} category`}
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">
            Add {viewMode === "expenses" ? "Expense" : "Income"} Category
          </span>
        </button>
      </div>

      {/* Edit Expected Registration Revenue Dialog */}
      <Dialog open={isEditRevenueOpen} onOpenChange={setIsEditRevenueOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Expected Registration Revenue</DialogTitle>
            <DialogDescription>
              Update the expected registration revenue for this budget.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label htmlFor="revenue-input" className="block text-sm font-medium mb-2">
              Expected Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <input
                id="revenue-input"
                type="number"
                step="0.01"
                min="0"
                value={editRevenueValue}
                onChange={(e) => setEditRevenueValue(e.target.value)}
                className="w-full pl-7 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#61bc47] bg-background text-foreground"
                placeholder="0.00"
              />
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setIsEditRevenueOpen(false)}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveExpectedRevenue}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[#61bc47] hover:bg-[#52a03c] text-white rounded-lg transition-all"
            >
              Save
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Expected Discounts Budget Dialog */}
      <Dialog open={isEditDiscountsOpen} onOpenChange={setIsEditDiscountsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Expected Discounts Budget</DialogTitle>
            <DialogDescription>
              Update the expected discounts budget for this project.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label htmlFor="discounts-input" className="block text-sm font-medium mb-2">
              Expected Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <input
                id="discounts-input"
                type="number"
                step="0.01"
                min="0"
                value={editDiscountsValue}
                onChange={(e) => setEditDiscountsValue(e.target.value)}
                className="w-full pl-7 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#61bc47] bg-background text-foreground"
                placeholder="0.00"
              />
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setIsEditDiscountsOpen(false)}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveExpectedDiscounts}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[#61bc47] hover:bg-[#52a03c] text-white rounded-lg transition-all"
            >
              Save
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Category Dialog */}
      <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add {newCategoryType === "expense" ? "Expense" : "Income"} Category</DialogTitle>
            <DialogDescription>
              {newCategoryType === "expense"
                ? "Select a category type from the available options."
                : "Enter a name and expected amount for this income source."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label htmlFor="category-type" className="block text-sm font-medium mb-2">
                {newCategoryType === "expense" ? "Category Type *" : "Income Source Name *"}
              </label>
              {newCategoryType === "expense" ? (
                isLoadingCategoryTypes ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-[#61bc47]" />
                  </div>
                ) : newCategoryName === "__NEW__" ? (
                  <div className="space-y-2">
                    <input
                      id="new-category-type-name"
                      type="text"
                      value={newCategoryDescription}
                      onChange={(e) => setNewCategoryDescription(e.target.value)}
                      className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#61bc47] bg-background text-foreground"
                      placeholder="Enter new category type name"
                      autoFocus
                    />
                    <button
                      onClick={() => {
                        setNewCategoryName("");
                        setNewCategoryDescription("");
                      }}
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      ← Back to selection
                    </button>
                  </div>
                ) : (
                  <select
                    id="category-type"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#61bc47] bg-background text-foreground"
                  >
                    <option value="">Select a category type...</option>
                    {availableCategoryTypes.map((type) => (
                      <option key={type.Project_Category_Type_ID} value={type.Project_Category_Type}>
                        {type.Project_Category_Type}
                      </option>
                    ))}
                    <option value="__NEW__">+ Add New Category Type...</option>
                  </select>
                )
              ) : (
                <input
                  id="category-type"
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#61bc47] bg-background text-foreground"
                  placeholder="e.g., Sponsorships, Donations, Merchandise Sales"
                />
              )}
            </div>
            {newCategoryType === "revenue" && (
              <div>
                <label htmlFor="category-expected-amount" className="block text-sm font-medium mb-2">
                  Expected Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                  <input
                    id="category-expected-amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={newCategoryExpectedAmount}
                    onChange={(e) => setNewCategoryExpectedAmount(e.target.value)}
                    className="w-full pl-7 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#61bc47] bg-background text-foreground"
                    placeholder="0.00"
                  />
                </div>
              </div>
            )}
            {newCategoryType === "expense" && (
              <>
                <div>
                  <label htmlFor="category-budgeted-amount" className="block text-sm font-medium mb-2">
                    Budgeted Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      $
                    </span>
                    <input
                      id="category-budgeted-amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={newCategoryExpectedAmount}
                      onChange={(e) => setNewCategoryExpectedAmount(e.target.value)}
                      className="w-full pl-7 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#61bc47] bg-background text-foreground"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="category-description" className="block text-sm font-medium mb-2">
                    Description (optional)
                  </label>
                  <textarea
                    id="category-description"
                    value={newCategoryDescription}
                    onChange={(e) => setNewCategoryDescription(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#61bc47] bg-background text-foreground resize-none"
                    placeholder="Brief description of this category"
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <button
              onClick={() => {
                setIsAddCategoryOpen(false);
                setNewCategoryName("");
                setNewCategoryDescription("");
                setNewCategoryExpectedAmount("");
              }}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddCategory}
              disabled={!newCategoryName.trim() || (newCategoryType === "expense" && isLoadingCategoryTypes)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[#61bc47] hover:bg-[#52a03c] text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              Add Category
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={isEditCategoryOpen} onOpenChange={setIsEditCategoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update the {String(editingCategoryId)?.startsWith('income-') ? 'name and expected amount' : 'budgeted amount'} for this category.
            </DialogDescription>
          </DialogHeader>
          <div className={`space-y-4 py-4 transition-opacity ${isSavingEditCategory ? 'opacity-50 pointer-events-none' : ''}`}>
            {String(editingCategoryId)?.startsWith('income-') && (
              <div>
                <label htmlFor="edit-category-name" className="block text-sm font-medium mb-2">
                  Income Source Name *
                </label>
                <input
                  id="edit-category-name"
                  type="text"
                  value={editCategoryName}
                  onChange={(e) => setEditCategoryName(e.target.value)}
                  disabled={isSavingEditCategory}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#61bc47] bg-background text-foreground disabled:opacity-50"
                  placeholder="e.g., Sponsorships, Donations"
                />
              </div>
            )}
            <div>
              <label htmlFor="edit-category-budget" className="block text-sm font-medium mb-2">
                {String(editingCategoryId)?.startsWith('income-') ? 'Expected Amount *' : 'Budgeted Amount *'}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <input
                  id="edit-category-budget"
                  type="number"
                  step="0.01"
                  min="0"
                  value={editCategoryBudgetValue}
                  onChange={(e) => setEditCategoryBudgetValue(e.target.value)}
                  disabled={isSavingEditCategory}
                  className="w-full pl-7 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#61bc47] bg-background text-foreground disabled:opacity-50"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => {
                setIsEditCategoryOpen(false);
                setEditingCategoryId(null);
                setEditCategoryName("");
                setEditCategoryBudgetValue("");
              }}
              disabled={isSavingEditCategory}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleEditCategory}
              disabled={isSavingEditCategory}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[#61bc47] hover:bg-[#52a03c] text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSavingEditCategory && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              {isSavingEditCategory ? 'Saving...' : 'Save Changes'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Line Item Dialog */}
      <Dialog open={isEditLineItemOpen} onOpenChange={setIsEditLineItemOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Line Item</DialogTitle>
            <DialogDescription>
              Update the details for this line item.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label htmlFor="edit-line-item-name" className="block text-sm font-medium mb-2">
                Item Name *
              </label>
              <input
                id="edit-line-item-name"
                type="text"
                value={editLineItemName}
                onChange={(e) => setEditLineItemName(e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#61bc47] bg-background text-foreground"
                placeholder="e.g., T-Shirts, Food, Supplies"
              />
            </div>
            <div>
              <label htmlFor="edit-line-item-vendor" className="block text-sm font-medium mb-2">
                Vendor (optional)
              </label>
              <input
                id="edit-line-item-vendor"
                type="text"
                value={editLineItemVendor}
                onChange={(e) => setEditLineItemVendor(e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#61bc47] bg-background text-foreground"
                placeholder="e.g., Acme Corp"
              />
            </div>
            <div>
              <label htmlFor="edit-line-item-estimated" className="block text-sm font-medium mb-2">
                Estimated Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <input
                  id="edit-line-item-estimated"
                  type="number"
                  step="0.01"
                  min="0"
                  value={editLineItemEstimated}
                  onChange={(e) => setEditLineItemEstimated(e.target.value)}
                  className="w-full pl-7 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#61bc47] bg-background text-foreground"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <label htmlFor="edit-line-item-description" className="block text-sm font-medium mb-2">
                Description (optional)
              </label>
              <textarea
                id="edit-line-item-description"
                value={editLineItemDescription}
                onChange={(e) => setEditLineItemDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#61bc47] bg-background text-foreground resize-none"
                placeholder="Brief description of this item"
              />
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => {
                setIsEditLineItemOpen(false);
                setEditingLineItemId(null);
                setEditingLineItemCategoryId(null);
                setEditLineItemName("");
                setEditLineItemVendor("");
                setEditLineItemEstimated("");
                setEditLineItemDescription("");
              }}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleEditLineItem}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[#61bc47] hover:bg-[#52a03c] text-white rounded-lg transition-all"
            >
              Save Changes
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Line Item Dialog */}
      <Dialog open={isAddLineItemOpen} onOpenChange={setIsAddLineItemOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Line Item</DialogTitle>
            <DialogDescription>
              Add a new line item to this category.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label htmlFor="new-line-item-name" className="block text-sm font-medium mb-2">
                Item Name *
              </label>
              <input
                id="new-line-item-name"
                type="text"
                value={newLineItemName}
                onChange={(e) => setNewLineItemName(e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#61bc47] bg-background text-foreground"
                placeholder="e.g., T-Shirts, Food, Supplies"
              />
            </div>
            <div>
              <label htmlFor="new-line-item-vendor" className="block text-sm font-medium mb-2">
                Vendor (optional)
              </label>
              <input
                id="new-line-item-vendor"
                type="text"
                value={newLineItemVendor}
                onChange={(e) => setNewLineItemVendor(e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#61bc47] bg-background text-foreground"
                placeholder="e.g., Acme Corp"
              />
            </div>
            <div>
              <label htmlFor="new-line-item-estimated" className="block text-sm font-medium mb-2">
                Estimated Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <input
                  id="new-line-item-estimated"
                  type="number"
                  step="0.01"
                  min="0"
                  value={newLineItemEstimated}
                  onChange={(e) => setNewLineItemEstimated(e.target.value)}
                  className="w-full pl-7 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#61bc47] bg-background text-foreground"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <label htmlFor="new-line-item-description" className="block text-sm font-medium mb-2">
                Description (optional)
              </label>
              <textarea
                id="new-line-item-description"
                value={newLineItemDescription}
                onChange={(e) => setNewLineItemDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#61bc47] bg-background text-foreground resize-none"
                placeholder="Brief description of this item"
              />
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => {
                setIsAddLineItemOpen(false);
                setAddLineItemCategoryId(null);
                setNewLineItemName("");
                setNewLineItemVendor("");
                setNewLineItemEstimated("");
                setNewLineItemDescription("");
              }}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddLineItem}
              disabled={!newLineItemName.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[#61bc47] hover:bg-[#52a03c] text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              Add Line Item
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Purchase Request Dialog */}
      <Dialog open={isCreatePurchaseRequestOpen} onOpenChange={setIsCreatePurchaseRequestOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Purchase Request</DialogTitle>
            <DialogDescription>
              Request approval for a purchase from this line item. The request must be approved before you can add transactions.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Line Item (read-only) */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Line Item
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-muted text-muted-foreground border border-border rounded-md"
                value={createPRLineItemName}
                disabled
              />
            </div>

            {/* Amount */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Requested Amount *
              </label>
              <input
                type="number"
                className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={createPRAmount}
                onChange={(e) => setCreatePRAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
              />
            </div>

            {/* Vendor */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Vendor
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={createPRVendorName}
                onChange={(e) => setCreatePRVendorName(e.target.value)}
                placeholder="Enter vendor name"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Description
              </label>
              <textarea
                className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={createPRDescription}
                onChange={(e) => setCreatePRDescription(e.target.value)}
                placeholder="Describe what you need to purchase"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <button
              onClick={() => setIsCreatePurchaseRequestOpen(false)}
              className="px-4 py-2 text-foreground border border-border rounded-md hover:bg-accent transition-colors"
              disabled={isSavingPurchaseRequest}
            >
              Cancel
            </button>
            <button
              onClick={handleCreatePurchaseRequest}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSavingPurchaseRequest}
            >
              <ShoppingCart className="w-4 h-4" />
              Create Request
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
