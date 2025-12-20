"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useProjects } from "@/hooks/useProjects";
import { useBudgetPermissions } from "@/hooks/useBudgetPermissions";
import {
  ArrowLeft,
  Calendar,
  User,
  DollarSign,
  PieChart as PieChartIcon,
  Receipt,
  ChevronRight,
  ChevronDown,
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
  Search,
  X,
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
  discountCount?: number;
  averageAmount?: number;
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
  onCreateTransaction,
  filteredLineItems,
  canManageCategories,
  canManageLineItems,
  canManagePurchaseRequests,
  canManageTransactions,
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
  onCreateTransaction?: (lineItemId: string, lineItemName: string) => void;
  filteredLineItems?: BudgetCategory['lineItems'];
  canManageCategories?: boolean;
  canManageLineItems?: boolean;
  canManagePurchaseRequests?: boolean;
  canManageTransactions?: boolean;
}) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  // For expenses: Remaining = Budgeted - Spent (positive is good)
  // For revenue: Remaining = Received - Budgeted (positive is good)
  const remaining = category.type === "expense"
    ? category.estimated - category.actual
    : category.actual - category.estimated;

  // Simplified view for registration discounts and revenue (no individual budgets per line item)
  const isSimplifiedView = category.categoryId === 'registration-discounts' || category.categoryId === 'registration-income';

  // Use filtered line items if provided, otherwise use all line items
  const displayLineItems = filteredLineItems || category.lineItems;

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
        {/* Bar chart layout for all screen sizes */}
        <div className="space-y-3">
          <div>
            <div className="flex items-center gap-2">
              {/* Desktop: chevron on left */}
              <ChevronRight
                className={`hidden md:block w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform duration-200 ${
                  isExpanded ? 'rotate-90' : ''
                }`}
              />

              <h3 className="text-base md:text-lg font-semibold text-foreground flex-1 min-w-0">
                {category.name}
              </h3>

              {/* Mobile: chevron on right */}
              <ChevronRight
                className={`md:hidden w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform duration-200 ${
                  isExpanded ? 'rotate-90' : ''
                }`}
              />

              {isSimplifiedView && (
                <span className="hidden md:inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100/70 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 whitespace-nowrap">
                  Auto-tracked
                </span>
              )}
            </div>
            {isSimplifiedView && (
              <div className="md:hidden mt-2">
                <span className="inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-blue-100/70 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                  Auto-tracked
                </span>
              </div>
            )}
          </div>

          {/* Bar chart visualization */}
          <div className="space-y-2">
            {/* Labels row */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{category.type === "revenue" ? "Received" : "Spent"}</span>
              <span>{category.type === "revenue" ? "Expected" : "Budgeted"}</span>
            </div>

            {/* Progress bar */}
            <div className="relative h-8 bg-zinc-200 dark:bg-zinc-700 rounded-lg overflow-hidden">
              <div
                className={`h-full transition-all ${
                  category.type === "revenue"
                    ? (category.actual >= category.estimated ? "bg-green-500" : "bg-yellow-500")
                    : (category.actual <= category.estimated ? "bg-green-500" : "bg-red-500")
                }`}
                style={{
                  width: category.estimated > 0
                    ? `${Math.min((category.actual / category.estimated) * 100, 100)}%`
                    : '0%'
                }}
              />
              <div className="absolute inset-0 flex items-center justify-between px-2 text-xs font-semibold">
                <span className={category.actual > category.estimated * 0.3 ? "text-white" : "text-foreground"}>
                  {formatCurrency(category.actual)}
                </span>
                <span className={`${(isEditingRevenue || isEditingDiscounts) ? 'opacity-50' : ''} text-foreground`}>
                  {formatCurrency(category.estimated)}
                </span>
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

          {((!isSimplifiedView && canManageCategories) || category.categoryId === 'registration-income' || category.categoryId === 'registration-discounts') && (
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              {!isSimplifiedView && canManageCategories ? (
                <>
                  {!isSimplifiedView && canManageLineItems && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddLineItem?.();
                      }}
                      className="p-2 hover:bg-green-100 dark:hover:bg-green-900/30 rounded transition-colors"
                      title="Add line item"
                    >
                      <Plus className="w-5 h-5 text-[#61bc47]" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditCategory?.();
                    }}
                    className="p-2 hover:bg-zinc-400 dark:hover:bg-zinc-700 rounded transition-colors"
                    title="Edit category"
                  >
                    <Edit className="w-5 h-5 text-muted-foreground" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteCategory?.();
                    }}
                    className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                    title="Delete category"
                  >
                    <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </button>
                </>
              ) : (
                <>
                  {category.categoryId === 'registration-income' && onEditExpectedRevenue && (
                    <>
                      {isEditingRevenue ? (
                        <div className="p-2">
                          <Loader2 className="w-5 h-5 text-[#61bc47] animate-spin" />
                        </div>
                      ) : revenueJustSaved ? (
                        <div className="p-2 animate-in zoom-in duration-300">
                          <CheckCircle2 className="w-5 h-5 text-[#61bc47]" />
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditExpectedRevenue();
                          }}
                          className="p-2 hover:bg-zinc-400 dark:hover:bg-zinc-700 rounded transition-colors"
                          title="Edit expected registration revenue"
                        >
                          <Edit className="w-5 h-5 text-muted-foreground" />
                        </button>
                      )}
                    </>
                  )}
                  {category.categoryId === 'registration-discounts' && onEditDiscountsBudget && (
                    <>
                      {isEditingDiscounts ? (
                        <div className="p-2">
                          <Loader2 className="w-5 h-5 text-[#61bc47] animate-spin" />
                        </div>
                      ) : discountsJustSaved ? (
                        <div className="p-2 animate-in zoom-in duration-300">
                          <CheckCircle2 className="w-5 h-5 text-[#61bc47]" />
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditDiscountsBudget();
                          }}
                          className="p-2 hover:bg-zinc-400 dark:hover:bg-zinc-700 rounded transition-colors"
                          title="Edit expected discounts budget"
                        >
                          <Edit className="w-5 h-5 text-muted-foreground" />
                        </button>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Line Items Table */}
      {isExpanded && displayLineItems && displayLineItems.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="hidden">
              <tr className={`border-b ${
                isSimplifiedView
                  ? "bg-blue-50/50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30"
                  : "bg-zinc-200 dark:bg-zinc-900 border-border"
              }`}>
                <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">
                  {category.type === "revenue" ? "Received" : "Spent"}
                </th>
                {!isSimplifiedView && (
                  <th className="px-6 py-3 text-right text-xs font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">
                    {category.type === "revenue" ? "Expected" : "Budgeted"}
                  </th>
                )}
                {!isSimplifiedView && (
                  <>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">
                      Remaining
                    </th>
                  </>
                )}
                {!isSimplifiedView && (
                  <th className="hidden lg:table-cell px-6 py-3 text-center text-xs font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {displayLineItems.map((item) => {
                // For expenses: Remaining = Budgeted - Spent (positive is good)
                // For revenue: Remaining = Received - Budgeted (positive is good)
                const itemRemaining = category.type === "expense"
                  ? item.estimated - item.actual
                  : item.actual - item.estimated;
                const isLoading = String(item.lineItemId).startsWith('temp-');

                return (
                  <tr
                    key={item.lineItemId}
                    onClick={() => !isLoading && !isSimplifiedView && router.push(`/budgets/${projectSlug}/line-items/${item.lineItemId}`)}
                    onMouseEnter={() => !isLoading && !isSimplifiedView && router.prefetch(`/budgets/${projectSlug}/line-items/${item.lineItemId}`)}
                    className={`transition-colors ${
                      isLoading
                        ? 'cursor-wait animate-pulse opacity-60'
                        : isSimplifiedView
                        ? 'cursor-default'
                        : 'cursor-pointer'
                    } ${
                      isSimplifiedView
                        ? "bg-blue-50/20 dark:bg-blue-950/10"
                        : "bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                    }`}
                  >
                    {/* Card layout for all screen sizes */}
                    <td className="p-4" colSpan={2}>
                      <div className="space-y-3">
                        {/* Item name and description */}
                        <div>
                          <div className="font-medium text-foreground flex items-center gap-2">
                            {item.name}
                            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                          </div>
                          {item.description && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {item.description}
                            </div>
                          )}
                          {item.vendor && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Vendor: {item.vendor}
                            </div>
                          )}
                        </div>

                        {/* Bar chart visualization */}
                        {isSimplifiedView ? (
                          // Auto-tracked items - just show spent amount
                          <div className="text-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">{category.type === "revenue" ? "Received:" : "Spent:"}</span>
                              <span className="font-semibold text-foreground">
                                {item.discountCount && item.averageAmount ? (
                                  <span className="text-xs">{item.discountCount}× {formatCurrency(item.actual)}</span>
                                ) : (
                                  formatCurrency(item.actual)
                                )}
                              </span>
                            </div>
                          </div>
                        ) : (
                          // Regular items - show bar chart
                          <div className="space-y-2">
                            {/* Labels row */}
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>{category.type === "revenue" ? "Received" : "Spent"}</span>
                              <span>{category.type === "revenue" ? "Expected" : "Budgeted"}</span>
                            </div>

                            {/* Progress bar */}
                            <div className="relative h-8 bg-zinc-200 dark:bg-zinc-700 rounded-lg overflow-hidden">
                              <div
                                className={`h-full transition-all ${
                                  category.type === "revenue"
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
                                  {item.discountCount && item.averageAmount ? (
                                    <span className="text-[10px]">{item.discountCount}× {formatCurrency(item.actual)}</span>
                                  ) : (
                                    formatCurrency(item.actual)
                                  )}
                                </span>
                                <span className="text-foreground">{formatCurrency(item.estimated)}</span>
                              </div>
                            </div>

                            {/* Remaining */}
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Remaining:</span>
                              <span className={`font-semibold ${
                                itemRemaining >= 0
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-red-600 dark:text-red-400"
                              }`}>
                                {formatCurrency(itemRemaining)}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Action buttons - clear tap area */}
                        {!isSimplifiedView && (
                          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                            {category.type === "expense" && onCreatePurchaseRequest && canManagePurchaseRequests && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onCreatePurchaseRequest(item.lineItemId, item.name, item.estimated, item.vendor);
                                }}
                                disabled={isLoading}
                                className="p-2 hover:bg-green-100 dark:hover:bg-green-900/30 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                title="Create purchase request"
                              >
                                <Plus className="w-5 h-5 text-[#61bc47] dark:text-[#61bc47]" />
                              </button>
                            )}
                            {category.type === "revenue" && onCreateTransaction && canManageTransactions && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onCreateTransaction(item.lineItemId, item.name);
                                }}
                                disabled={isLoading}
                                className="p-2 hover:bg-green-100 dark:hover:bg-green-900/30 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                title="Create income transaction"
                              >
                                <Plus className="w-5 h-5 text-[#61bc47] dark:text-[#61bc47]" />
                              </button>
                            )}
                            {canManageLineItems && (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEditLineItem?.(item.lineItemId);
                                  }}
                                  disabled={isLoading}
                                  className="p-2 hover:bg-zinc-300 dark:hover:bg-zinc-600 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                  title="Edit line item"
                                >
                                  <Edit className="w-5 h-5 text-muted-foreground" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteLineItem?.(item.lineItemId, item.name);
                                  }}
                                  disabled={isLoading}
                                  className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                  title="Delete line item"
                                >
                                  <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                                </button>
                              </>
                            )}
                          </div>
                        )}
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
      {isExpanded && !isSimplifiedView && canManageLineItems && (
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
  const permissions = useBudgetPermissions(); // Get user's budget permissions

  const [project, setProject] = useState<ProjectBudgetDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"expenses" | "income">("expenses");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false);

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
  const [newCategoryExpectedAmount, setNewCategoryExpectedAmount] = useState<string>("");
  const [newCategoryType, setNewCategoryType] = useState<"expense" | "revenue">("expense");
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [availableCategoryTypes, setAvailableCategoryTypes] = useState<Array<{
    Project_Category_Type_ID: number;
    Project_Category_Type: string;
    Is_Revenue: boolean;
  }>>([]);
  const [isLoadingCategoryTypes, setIsLoadingCategoryTypes] = useState(false);
  const [isAddCategoryTypeOpen, setIsAddCategoryTypeOpen] = useState(false);
  const [newCategoryTypeName, setNewCategoryTypeName] = useState("");

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

  // Function to fetch category types
  const fetchCategoryTypes = async () => {
    if (!project) return;

    try {
      setIsLoadingCategoryTypes(true);
      const response = await fetch(`/api/category-types?type=${newCategoryType}`);

      if (!response.ok) {
        throw new Error("Failed to fetch category types");
      }

      const types = await response.json();

      // Filter out category types that are already in use for this project
      const existingCategories = newCategoryType === 'expense'
        ? (project.expenseCategories || [])
        : (project.incomeLineItemsCategories || []);

      const existingCategoryNames = new Set(
        existingCategories.map(cat => cat.name)
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
  };

  // Fetch category types when modal opens (for both expense and revenue categories)
  useEffect(() => {
    if (!isAddCategoryOpen || !project) return;
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

  async function handleAddCategoryType() {
    if (!project) return;

    if (!newCategoryTypeName.trim()) {
      toast.error("Please enter a category type name");
      return;
    }

    const categoryTypeName = newCategoryTypeName.trim();

    // Close both modals immediately
    setIsAddCategoryTypeOpen(false);
    setIsAddCategoryOpen(false);

    // Create temporary category for optimistic update
    const tempCategory: BudgetCategory = {
      categoryId: `temp-${Date.now()}`,
      name: categoryTypeName,
      type: newCategoryType,
      estimated: 0, // Expense categories start at $0, computed from line items
      actual: 0,
      sortOrder: 999,
      lineItems: [],
    };

    // Optimistically update UI immediately
    const updatedProject = { ...project };
    if (newCategoryType === "expense") {
      updatedProject.expenseCategories = [...(project.expenseCategories || []), tempCategory];
    } else {
      updatedProject.incomeLineItemsCategories = [...(project.incomeLineItemsCategories || []), tempCategory];
    }
    setProject(updatedProject);

    // Use toast.promise for automatic loading/success/error states
    toast.promise(
      (async () => {
        // Create the category (which will create the type if it doesn't exist)
        const response = await fetch(`/api/projects/${project?.Project_ID}/categories`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: categoryTypeName,
            type: newCategoryType === "expense" ? "expense" : "revenue",
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to create category");
        }

        const createdCategory = await response.json();

        // Update with real category data
        const finalProject = { ...project };
        if (newCategoryType === "expense") {
          finalProject.expenseCategories = [
            ...(project.expenseCategories || []),
            createdCategory,
          ];
        } else {
          finalProject.incomeLineItemsCategories = [
            ...(project.incomeLineItemsCategories || []),
            createdCategory,
          ];
        }
        setProject(finalProject);

        // Refresh the available category types list for future use
        await fetchCategoryTypes();

        // Reset form
        setNewCategoryTypeName("");
        setNewCategoryName("");

        return categoryTypeName;
      })(),
      {
        loading: `Creating ${categoryTypeName}...`,
        success: (name) => `${name} created successfully`,
        error: (err) => {
          // Revert optimistic update on error
          const revertedProject = { ...project };
          if (newCategoryType === "expense") {
            revertedProject.expenseCategories = (project.expenseCategories || []).filter(
              (cat) => cat.categoryId !== tempCategory.categoryId
            );
          } else {
            revertedProject.incomeLineItemsCategories = (project.incomeLineItemsCategories || []).filter(
              (cat) => cat.categoryId !== tempCategory.categoryId
            );
          }
          setProject(revertedProject);

          return err instanceof Error ? err.message : "Failed to create category";
        },
      }
    );
  }

  async function handleAddCategory() {
    if (!project) return;

    // Use the selected category name directly
    const categoryName = newCategoryName.trim();

    if (!categoryName) {
      toast.error("Please enter a category name");
      return;
    }

    // Close modal immediately
    setIsAddCategoryOpen(false);

    // Create temporary category for optimistic update
    // Note: All categories (expense and income) have budgets computed from line items (will be 0 initially)
    const tempCategory: BudgetCategory = {
      categoryId: `temp-${Date.now()}`,
      name: categoryName,
      type: newCategoryType,
      estimated: 0, // All categories start at $0, computed from line items
      actual: 0,
      sortOrder: 999,
      lineItems: [],
    };

    // Optimistically update UI immediately
    const updatedProject = { ...project };
    if (newCategoryType === "expense") {
      updatedProject.expenseCategories = [...(project.expenseCategories || []), tempCategory];
      // Note: Total_Budget is computed from categories, no manual update needed
    } else {
      updatedProject.incomeLineItemsCategories = [...(project.incomeLineItemsCategories || []), tempCategory];
      // Note: Total_Expected_Income is computed from categories, no manual update needed
    }
    setProject(updatedProject);

    // Use toast.promise for automatic loading/success/error states
    toast.promise(
      (async () => {
        // Both expense and income categories use the same endpoint
        // Note: Budgeted amounts are computed from line items for ALL categories
        const response = await fetch(`/api/projects/${project.Project_ID}/categories`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: categoryName,
            type: newCategoryType === "expense" ? "expense" : "revenue",
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to create category");
        }

        const createdCategory = await response.json();

        // Update with real category data
        const finalProject = { ...project };
        if (newCategoryType === "expense") {
          finalProject.expenseCategories = [
            ...(project.expenseCategories || []),
            createdCategory,
          ];
        } else {
          finalProject.incomeLineItemsCategories = [
            ...(project.incomeLineItemsCategories || []),
            createdCategory,
          ];
        }
        setProject(finalProject);

        // Reset form
        setNewCategoryName("");
        setNewCategoryTypeName("");
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
            revertedProject.expenseCategories = (project.expenseCategories || []).filter(
              (cat) => cat.categoryId !== tempCategory.categoryId
            );
          } else {
            revertedProject.incomeLineItemsCategories = (project.incomeLineItemsCategories || []).filter(
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
    const allCategories = [...(project.expenseCategories || []), ...(project.incomeLineItemsCategories || [])];
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
        updatedProject.expenseCategories = (project.expenseCategories || []).map(cat =>
          cat.categoryId === editingCategoryId
            ? { ...cat, name: newName, estimated: newBudgetValue }
            : cat
        );
        updatedProject.Total_Budget = (project.Total_Budget - previousBudgetValue) + newBudgetValue;
      } else {
        updatedProject.incomeLineItemsCategories = (project.incomeLineItemsCategories || []).map(cat =>
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
          revertedProject.expenseCategories = (project.expenseCategories || []).map(cat =>
            cat.categoryId === editingCategoryId
              ? { ...cat, name: previousName, estimated: previousBudgetValue }
              : cat
          );
          revertedProject.Total_Budget = (updatedProject.Total_Budget - newBudgetValue) + previousBudgetValue;
        } else {
          revertedProject.incomeLineItemsCategories = (project.incomeLineItemsCategories || []).map(cat =>
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
    const allCategories = [...(project.expenseCategories || []), ...(project.incomeLineItemsCategories || [])];
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
            updatedProject.incomeLineItemsCategories = prevProject.incomeLineItemsCategories.filter(
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

    // Capture values before closing modal (including IDs)
    const lineItemId = editingLineItemId;
    const categoryId = editingLineItemCategoryId;
    const newEstimated = parseFloat(editLineItemEstimated) || 0;
    const newName = editLineItemName.trim();
    const newVendor = editLineItemVendor.trim() || null;
    const newDescription = editLineItemDescription.trim() || null;

    if (!newName) {
      toast.error("Name is required");
      return;
    }

    // Find the category and line item being edited
    const allCategories = [...(project.expenseCategories || []), ...(project.incomeLineItemsCategories || [])];
    const category = allCategories.find(cat => cat.categoryId === categoryId);

    if (!category) return;

    const lineItem = category.lineItems.find(item => item.lineItemId === lineItemId);

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
      updatedProject.expenseCategories = (project.expenseCategories || []).map(cat =>
        cat.categoryId === categoryId
          ? {
              ...cat,
              lineItems: cat.lineItems.map(item =>
                item.lineItemId === lineItemId
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
      // Income line items
      updatedProject.incomeLineItemsCategories = (project.incomeLineItemsCategories || []).map(cat =>
        cat.categoryId === categoryId
          ? {
              ...cat,
              lineItems: cat.lineItems.map(item =>
                item.lineItemId === lineItemId
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
      // Update total expected income
      updatedProject.Total_Expected_Income = (project.Total_Expected_Income - previousEstimated) + newEstimated;
    }
      setProject(updatedProject);

      // Make API call - both expense and income use the same endpoint now
      const response = await fetch(`/api/projects/${project.Project_ID}/categories/${categoryId}/line-items`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lineItemId: lineItemId,
          name: newName,
          vendor: newVendor,
          estimatedAmount: newEstimated,
          description: newDescription,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();

        // Revert optimistic update on error
        const revertedProject = { ...project };
        if (category.type === "expense") {
          revertedProject.expenseCategories = (project.expenseCategories || []).map(cat =>
            cat.categoryId === categoryId
              ? {
                  ...cat,
                  lineItems: cat.lineItems.map(item =>
                    item.lineItemId === lineItemId
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
          revertedProject.incomeLineItemsCategories = (project.incomeLineItemsCategories || []).map(cat =>
            cat.categoryId === categoryId
              ? {
                  ...cat,
                  lineItems: cat.lineItems.map(item =>
                    item.lineItemId === lineItemId
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
    const allCategories = [...(project.expenseCategories || []), ...(project.incomeLineItemsCategories || [])];
    const category = allCategories.find(cat => cat.categoryId === categoryId);

    if (!category) return;

    const lineItem = category.lineItems.find(item => item.lineItemId === lineItemId);

    if (!lineItem) return;

    // Create async delete operation with optimistic update
    const deleteOperation = (async () => {
      // Optimistically update UI immediately
      const updatedProject = { ...project };
      if (category.type === "expense") {
        updatedProject.expenseCategories = (project.expenseCategories || []).map(cat =>
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
        // Income line items - delete the line item from the category
        updatedProject.incomeLineItemsCategories = (project.incomeLineItemsCategories || []).map(cat =>
          cat.categoryId === categoryId
            ? {
                ...cat,
                lineItems: cat.lineItems.filter(item => item.lineItemId !== lineItemId),
                estimated: cat.estimated - lineItem.estimated,
              }
            : cat
        );
        // Update total expected income
        updatedProject.Total_Expected_Income = project.Total_Expected_Income - lineItem.estimated;
      }
      setProject(updatedProject);

      // Make API call - both expense and income use the same endpoint
      const response = await fetch(
        `/api/projects/${project.Project_ID}/categories/${categoryId}/line-items?lineItemId=${lineItemId}`,
        {
          method: "DELETE",
        }
      );

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

    // Find the category to add the line item to (check all categories including special ones)
    const expenseCategory = (project.expenseCategories || []).find(cat => cat.categoryId === addLineItemCategoryId);
    const incomeCategory = (project.incomeLineItemsCategories || []).find(cat => cat.categoryId === addLineItemCategoryId);
    const registrationIncomeCategory = project.registrationIncomeCategory?.categoryId === addLineItemCategoryId
      ? project.registrationIncomeCategory
      : null;
    const registrationDiscountsCategory = project.registrationDiscountsCategory?.categoryId === addLineItemCategoryId
      ? project.registrationDiscountsCategory
      : null;

    const category = expenseCategory || incomeCategory || registrationIncomeCategory || registrationDiscountsCategory;

    if (!category) return;

    const isIncome = !!(incomeCategory || registrationIncomeCategory);
    const isRegistrationIncome = !!registrationIncomeCategory;
    const isRegistrationDiscounts = !!registrationDiscountsCategory;

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
    if (isRegistrationIncome && registrationIncomeCategory) {
      // Update registration income category
      updatedProject.registrationIncomeCategory = {
        ...registrationIncomeCategory,
        lineItems: [...(registrationIncomeCategory.lineItems || []), tempLineItem],
        estimated: registrationIncomeCategory.estimated + newEstimated,
      };
      updatedProject.Total_Expected_Income = project.Total_Expected_Income + newEstimated;
    } else if (isRegistrationDiscounts && registrationDiscountsCategory) {
      // Update registration discounts category
      updatedProject.registrationDiscountsCategory = {
        ...registrationDiscountsCategory,
        lineItems: [...(registrationDiscountsCategory.lineItems || []), tempLineItem],
        estimated: registrationDiscountsCategory.estimated + newEstimated,
      };
      updatedProject.Total_Budget = project.Total_Budget + newEstimated;
    } else if (isIncome) {
      // Update regular income categories
      updatedProject.incomeLineItemsCategories = (project.incomeLineItemsCategories || []).map(cat =>
        cat.categoryId === addLineItemCategoryId
          ? {
              ...cat,
              lineItems: [...cat.lineItems, tempLineItem],
              estimated: cat.estimated + newEstimated,
            }
          : cat
      );
      updatedProject.Total_Expected_Income = project.Total_Expected_Income + newEstimated;
    } else {
      // Update regular expense categories
      updatedProject.expenseCategories = (project.expenseCategories || []).map(cat =>
        cat.categoryId === addLineItemCategoryId
          ? {
              ...cat,
              lineItems: [...cat.lineItems, tempLineItem],
              estimated: cat.estimated + newEstimated,
            }
          : cat
      );
      updatedProject.Total_Budget = project.Total_Budget + newEstimated;
    }
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
          if (!prevProject) return prevProject;
          const revertedProject = { ...prevProject };
          if (isRegistrationIncome && prevProject.registrationIncomeCategory) {
            revertedProject.registrationIncomeCategory = {
              ...prevProject.registrationIncomeCategory,
              lineItems: prevProject.registrationIncomeCategory.lineItems.filter(item => item.lineItemId !== tempId),
              estimated: prevProject.registrationIncomeCategory.estimated - newEstimated,
            };
            revertedProject.Total_Expected_Income = prevProject.Total_Expected_Income - newEstimated;
          } else if (isRegistrationDiscounts && prevProject.registrationDiscountsCategory) {
            revertedProject.registrationDiscountsCategory = {
              ...prevProject.registrationDiscountsCategory,
              lineItems: prevProject.registrationDiscountsCategory.lineItems.filter(item => item.lineItemId !== tempId),
              estimated: prevProject.registrationDiscountsCategory.estimated - newEstimated,
            };
            revertedProject.Total_Budget = prevProject.Total_Budget - newEstimated;
          } else if (isIncome) {
            revertedProject.incomeLineItemsCategories = prevProject.incomeLineItemsCategories.map(cat =>
              cat.categoryId === addLineItemCategoryId
                ? {
                    ...cat,
                    lineItems: cat.lineItems.filter(item => item.lineItemId !== tempId),
                    estimated: cat.estimated - newEstimated,
                  }
                : cat
            );
            revertedProject.Total_Expected_Income = prevProject.Total_Expected_Income - newEstimated;
          } else {
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
          }
          return revertedProject;
        });

        throw new Error(errorData.error || errorData.details || "Failed to create line item");
      }

      const createdLineItem = await response.json();
      console.log("Created line item:", createdLineItem);

      // Replace temp item with real data
      setProject((prevProject) => {
        if (!prevProject) return prevProject;
        const finalProject = { ...prevProject };
        if (isRegistrationIncome && prevProject.registrationIncomeCategory) {
          finalProject.registrationIncomeCategory = {
            ...prevProject.registrationIncomeCategory,
            lineItems: prevProject.registrationIncomeCategory.lineItems.map(item =>
              item.lineItemId === tempId ? createdLineItem : item
            ),
          };
        } else if (isRegistrationDiscounts && prevProject.registrationDiscountsCategory) {
          finalProject.registrationDiscountsCategory = {
            ...prevProject.registrationDiscountsCategory,
            lineItems: prevProject.registrationDiscountsCategory.lineItems.map(item =>
              item.lineItemId === tempId ? createdLineItem : item
            ),
          };
        } else if (isIncome) {
          finalProject.incomeLineItemsCategories = prevProject.incomeLineItemsCategories.map(cat =>
            cat.categoryId === addLineItemCategoryId
              ? {
                  ...cat,
                  lineItems: cat.lineItems.map(item =>
                    item.lineItemId === tempId ? createdLineItem : item
                  ),
                }
              : cat
          );
        } else {
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
        }
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
    ...(project?.incomeLineItemsCategories || []),
  ];

  // Filter categories based on search input
  const filterCategories = (categories: typeof expenseCategories) => {
    if (!categoryFilter.trim()) {
      return categories.map(cat => ({ ...cat, filteredLineItems: cat.lineItems }));
    }

    const searchLower = categoryFilter.toLowerCase();
    const filtered: Array<typeof categories[0] & { filteredLineItems: typeof categories[0]['lineItems'] }> = [];

    categories.forEach(category => {
      // Check if category name matches
      const categoryNameMatches = category.name.toLowerCase().includes(searchLower);

      if (categoryNameMatches) {
        // Category name matches - show all line items
        filtered.push({ ...category, filteredLineItems: category.lineItems });
        return;
      }

      // Category name doesn't match - check line items
      if (!category.lineItems || category.lineItems.length === 0) return;

      const matchingLineItems = category.lineItems.filter(item =>
        item.name.toLowerCase().includes(searchLower) ||
        (item.description && item.description.toLowerCase().includes(searchLower))
      );

      if (matchingLineItems.length > 0) {
        // Some line items match - show only matching line items
        filtered.push({ ...category, filteredLineItems: matchingLineItems });
      }
    });

    return filtered;
  };

  const filteredExpenseCategories = filterCategories(expenseCategories);
  const filteredRevenueCategories = filterCategories(revenueCategories);

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
    <div className="container mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-8 max-w-[1600px]">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <Link
          href="/budgets"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-[#61bc47] mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Budgets
        </Link>

        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
          <div className="flex-1">
            {/* Title with dropdown for projects of the same type */}
            {projectsOfSameType.length > 1 ? (
              <div className="relative mb-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl md:text-4xl font-bold text-primary dark:text-foreground">
                    {project?.Project_Title}
                  </h1>
                  <ChevronDown className="w-5 h-5 md:w-6 md:h-6 text-foreground flex-shrink-0" />
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
              <h1 className="text-3xl md:text-4xl font-bold text-primary dark:text-foreground mb-2">
                {project?.Project_Title}
              </h1>
            )}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-400 dark:text-gray-400">
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

          <div className="relative w-full md:w-auto">
            <button
              onClick={() => setIsViewDetailsOpen(!isViewDetailsOpen)}
              onBlur={(e) => {
                // Close dropdown when clicking outside
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setTimeout(() => setIsViewDetailsOpen(false), 150);
                }
              }}
              className="appearance-none w-full md:w-auto inline-flex items-center justify-center gap-2 pl-4 pr-10 py-2 bg-white dark:bg-zinc-700 text-zinc-800 dark:text-white border border-zinc-300 dark:border-zinc-600 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-600 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#61bc47]"
            >
              Quick Links
              <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-800 dark:text-white transition-transform ${isViewDetailsOpen ? 'rotate-180' : ''}`} />
            </button>
            {isViewDetailsOpen && (
              <div className="absolute top-full left-0 right-0 md:right-auto mt-1 bg-white dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-lg shadow-lg overflow-hidden z-20 md:min-w-[200px]">
                <Link
                  href={`/budgets/${slug}/reports`}
                  className="flex items-center gap-2 px-4 py-2 text-zinc-800 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-600 transition-colors whitespace-nowrap"
                  onClick={() => setIsViewDetailsOpen(false)}
                >
                  <BarChart3 className="w-4 h-4" />
                  Reports
                </Link>
                <Link
                  href={`/budgets/${slug}/transactions`}
                  className="flex items-center gap-2 px-4 py-2 text-zinc-800 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-600 transition-colors whitespace-nowrap"
                  onClick={() => setIsViewDetailsOpen(false)}
                >
                  <List className="w-4 h-4" />
                  Transactions
                </Link>
                <Link
                  href={`/budgets/${slug}/purchase-requests`}
                  className="flex items-center gap-2 px-4 py-2 text-zinc-800 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-600 transition-colors whitespace-nowrap"
                  onClick={() => setIsViewDetailsOpen(false)}
                >
                  <ShoppingCart className="w-4 h-4" />
                  Purchase Requests
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="mb-6 flex justify-center">
        <button
          onClick={() => setViewMode(viewMode === "expenses" ? "income" : "expenses")}
          className="relative w-full md:w-auto inline-flex rounded-xl bg-zinc-100 dark:bg-zinc-800 p-1 shadow-inner cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
        >
          {/* Sliding background indicator */}
          <div
            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-[#61BC47] rounded-lg shadow-md transition-all duration-300 ease-in-out pointer-events-none ${
              viewMode === "expenses" ? "left-1" : "left-[calc(50%+4px-1px)]"
            }`}
          />

          {/* Labels */}
          <div
            className={`relative z-10 flex-1 md:flex-initial md:px-8 py-2.5 rounded-lg font-medium transition-all duration-300 pointer-events-none ${
              viewMode === "expenses"
                ? "text-white"
                : "text-muted-foreground"
            }`}
          >
            Expenses
          </div>
          <div
            className={`relative z-10 flex-1 md:flex-initial md:px-8 py-2.5 rounded-lg font-medium transition-all duration-300 pointer-events-none ${
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
          {/* Expenses Summary Bar */}
          <div className="bg-card border border-border rounded-lg p-4 md:p-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Summary
              </h3>
            </div>

            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Spent</span>
              <span>Budgeted</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 h-10 md:h-12 relative overflow-hidden flex items-center justify-between px-3 text-white font-semibold text-sm md:text-base">
              <div
                className={`absolute inset-0 ${
                  totalExpensesEstimated > 0 && (totalExpensesActual / totalExpensesEstimated) * 100 < 90
                    ? "bg-green-500"
                    : totalExpensesEstimated > 0 && (totalExpensesActual / totalExpensesEstimated) * 100 < 100
                    ? "bg-yellow-500"
                    : "bg-red-500"
                }`}
                style={{
                  width: `${Math.min((totalExpensesEstimated > 0 ? (totalExpensesActual / totalExpensesEstimated) * 100 : 0), 100)}%`
                }}
              />
              <span className="relative z-10 text-white drop-shadow-sm">{formatCurrency(totalExpensesActual)}</span>
              <span className="relative z-10 text-black dark:text-white">{formatCurrency(totalExpensesEstimated)}</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-muted-foreground">
                Remaining:
              </span>
              <span className={`text-sm font-medium ${totalExpensesEstimated - totalExpensesActual >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                {totalExpensesEstimated - totalExpensesActual >= 0 ? "" : "-"}{formatCurrency(Math.abs(totalExpensesEstimated - totalExpensesActual))}
              </span>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Income Summary Bar */}
          <div className="bg-card border border-border rounded-lg p-4 md:p-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Summary
              </h3>
            </div>

            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Received</span>
              <span>Goal</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 h-10 md:h-12 relative overflow-hidden flex items-center justify-between px-3 text-white font-semibold text-sm md:text-base">
              <div
                className="absolute inset-0 bg-green-500"
                style={{
                  width: `${Math.min((totalRevenueEstimated > 0 ? (totalRevenueActual / totalRevenueEstimated) * 100 : 0), 100)}%`
                }}
              />
              <span className="relative z-10 text-white drop-shadow-sm">{formatCurrency(totalRevenueActual)}</span>
              <span className="relative z-10 text-black dark:text-white">{formatCurrency(totalRevenueEstimated)}</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-muted-foreground">
                Remaining:
              </span>
              <span className={`text-sm font-medium ${totalRevenueEstimated - totalRevenueActual >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                {totalRevenueEstimated - totalRevenueActual >= 0 ? "" : "-"}{formatCurrency(Math.abs(totalRevenueEstimated - totalRevenueActual))}
              </span>
            </div>
          </div>
        </>
      )}

      {/* Filter Input */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            placeholder="Filter categories and line items..."
            className="w-full pl-10 pr-10 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#61bc47] bg-background text-foreground"
          />
          {categoryFilter && (
            <button
              onClick={() => setCategoryFilter("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {categoryFilter && (
          <p className="mt-2 text-sm text-muted-foreground">
            Showing {viewMode === "expenses" ? filteredExpenseCategories.length : filteredRevenueCategories.length} of{" "}
            {viewMode === "expenses" ? expenseCategories.length : revenueCategories.length} categories
          </p>
        )}
      </div>

      {/* Categories */}
      <div className="space-y-4">
        {viewMode === "expenses"
          ? filteredExpenseCategories
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
                    category.categoryId === 'registration-discounts' && permissions.canManageCategories
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
                  filteredLineItems={category.filteredLineItems}
                  canManageCategories={permissions.canManageCategories}
                  canManageLineItems={permissions.canManageLineItems}
                  canManagePurchaseRequests={permissions.canManagePurchaseRequests}
                  canManageTransactions={permissions.canManageTransactions}
                />
              ))
          : filteredRevenueCategories
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
                    category.categoryId === 'registration-income' && permissions.canManageCategories
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
                  onAddLineItem={
                    category.categoryId !== 'registration-income'
                      ? () => {
                          setAddLineItemCategoryId(category.categoryId);
                          setIsAddLineItemOpen(true);
                        }
                      : undefined
                  }
                  filteredLineItems={category.filteredLineItems}
                  canManageCategories={permissions.canManageCategories}
                  canManageLineItems={permissions.canManageLineItems}
                  canManagePurchaseRequests={permissions.canManagePurchaseRequests}
                  canManageTransactions={permissions.canManageTransactions}
                />
              ))}

        {/* Add Category Button */}
        {permissions.canManageCategories && (
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
        )}
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
              Select a category type from the available options.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label htmlFor="category-type" className="block text-sm font-medium mb-2">
                Category Type *
              </label>
              {isLoadingCategoryTypes ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-[#61bc47]" />
                </div>
              ) : (
                <select
                  id="category-type"
                  value={newCategoryName}
                  onChange={(e) => {
                    if (e.target.value === "__ADD_NEW__") {
                      setIsAddCategoryTypeOpen(true);
                      e.target.value = ""; // Reset dropdown
                    } else {
                      setNewCategoryName(e.target.value);
                    }
                  }}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#61bc47] bg-background text-foreground"
                >
                  <option value="">Select a category type...</option>
                  {availableCategoryTypes.map((type) => (
                    <option key={type.Project_Category_Type_ID} value={type.Project_Category_Type}>
                      {type.Project_Category_Type}
                    </option>
                  ))}
                  <option value="__ADD_NEW__" className="font-semibold text-[#61bc47]">
                    + Add New Category Type...
                  </option>
                </select>
              )}
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => {
                setIsAddCategoryOpen(false);
                setNewCategoryName("");
                setNewCategoryExpectedAmount("");
              }}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddCategory}
              disabled={!newCategoryName.trim() || isLoadingCategoryTypes}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[#61bc47] hover:bg-[#52a03c] text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              Add Category
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add New Category Type Dialog */}
      <Dialog open={isAddCategoryTypeOpen} onOpenChange={setIsAddCategoryTypeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Category Type</DialogTitle>
            <DialogDescription>
              Create a new {newCategoryType === "expense" ? "expense" : "revenue"} category type that will be available for all projects.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label htmlFor="new-category-type-name" className="block text-sm font-medium mb-2">
              Category Type Name *
            </label>
            <input
              id="new-category-type-name"
              type="text"
              value={newCategoryTypeName}
              onChange={(e) => setNewCategoryTypeName(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#61bc47] bg-background text-foreground"
              placeholder="e.g., Miscellaneous, Contractor, Facility Rental"
              autoFocus
            />
          </div>
          <DialogFooter>
            <button
              onClick={() => {
                setIsAddCategoryTypeOpen(false);
                setNewCategoryTypeName("");
              }}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddCategoryType}
              disabled={!newCategoryTypeName.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[#61bc47] hover:bg-[#52a03c] text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              Create Category Type
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
                className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
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
                className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
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
                className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
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
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
