// TypeScript types for Project Budgets app
// Based on database schema from MinistryPlatform

/**
 * Raw project data from database (api_Custom_GetProjectBudgets_JSON)
 */
export interface ProjectFromDB {
  Project_ID: number;
  Project_Title: string;
  Slug: string; // URL-friendly slug for project (required)
  Project_Coordinator: number; // Contact_ID
  Coordinator_Name: string | null;
  Coordinator_First_Name: string | null;
  Coordinator_Last_Name: string | null;
  Coordinator_Email: string | null;
  Contact_ID: number;
  Project_Start: string; // ISO date string
  Project_End: string; // ISO date string
  Project_Approved: boolean;
  Project_Type_ID: number;
  Project_Type: string;

  // Budget fields
  Budgets_Enabled: boolean;
  Budget_Status_ID: number | null;
  Budget_Status_Name: string | null;
  Budget_Status_Color: string | null;
  Budget_Locked: boolean;
  Expected_Registration_Revenue: number | null;

  Total_Budget: number; // Sum of all budget categories from Project_Budget_Categories
  Total_Actual_Expenses: number; // Sum of actual expenses from Project_Budget_Transactions (type = 'Expense')
  Total_Actual_Income: number; // Sum of actual income from Project_Budget_Transactions (type = 'Income') + registration revenue from Invoice_Detail
  Total_Expected_Income: number; // Expected_Registration_Revenue + sum of Income Line Items
  Categories_JSON: null; // Will be implemented later if needed
}

/**
 * Coordinator information
 */
export interface Coordinator {
  userId?: number; // Not available from DB yet
  contactId: number;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
}

/**
 * Project status (derived from dates and approval status)
 */
export type ProjectStatus =
  | "draft"
  | "pending"
  | "approved"
  | "in-progress"
  | "completed"
  | "closed";

/**
 * Budget status (calculated from budget vs actual)
 */
export type BudgetStatus = "under" | "on-track" | "over";

/**
 * Project type for UI consumption
 * Transformed from database schema to match existing UI expectations
 */
export interface Project {
  id: string; // Project_ID as string
  slug: string; // URL-friendly slug (required)
  title: string;
  description?: string; // Not in DB yet
  status: ProjectStatus;
  budgetStatus: BudgetStatus;
  coordinator: Coordinator;
  startDate: string;
  endDate: string;
  totalEstimated: number; // Total_Budget (all budget categories combined)
  totalActual: number; // Total_Actual_Expenses from Project_Budget_Transactions
  totalActualIncome: number; // Total_Actual_Income from Project_Budget_Transactions + registration revenue
  totalExpectedIncome: number; // Total_Expected_Income (Expected_Registration_Revenue + Income Line Items)
  expectedRegistrationRevenue: number | null; // Expected_Registration_Revenue from Projects table
  typeId: number;
  typeName: string;

  // Budget fields
  budgetEnabled: boolean;
  budgetStatusId: number | null;
  budgetStatusName: string | null;
  budgetStatusColor: string | null;
  budgetLocked: boolean;

  // Future fields for series support (not in DB yet)
  seriesId?: string;
  year?: number;
  isTemplate?: boolean;
  copiedFromProjectId?: string;
}

/**
 * Budget category from database
 */
export interface BudgetCategory {
  id: string;
  name: string;
  type: "expense" | "revenue";
  estimated: number;
  actual: number;
  // lineItems will be added when we implement detailed budget tracking
}

/**
 * Transform raw database project to UI project
 */
export function transformProjectFromDB(dbProject: ProjectFromDB): Project | null {
  // Skip projects without required fields
  if (!dbProject.Project_ID || !dbProject.Project_Title || !dbProject.Project_Start) {
    console.warn('Skipping project with missing required fields:', dbProject);
    return null;
  }

  const now = new Date();
  const startDate = new Date(dbProject.Project_Start);
  const endDate = dbProject.Project_End ? new Date(dbProject.Project_End) : new Date(dbProject.Project_Start);

  // Derive status from approval and dates
  let status: ProjectStatus;
  if (!dbProject.Project_Approved) {
    status = "pending";
  } else if (now < startDate) {
    status = "approved";
  } else if (now >= startDate && now <= endDate) {
    status = "in-progress";
  } else {
    status = "completed";
  }

  // Calculate budget status
  // For now, since we don't have actual transaction data, we'll use "on-track"
  // Later this will be calculated from totalActual vs totalEstimated
  const budgetStatus: BudgetStatus = "on-track";

  return {
    id: dbProject.Project_ID.toString(),
    slug: dbProject.Slug,
    title: dbProject.Project_Title,
    status,
    budgetStatus,
    coordinator: {
      contactId: dbProject.Contact_ID || 0,
      firstName: dbProject.Coordinator_First_Name || "",
      lastName: dbProject.Coordinator_Last_Name || "",
      displayName: dbProject.Coordinator_Name || "Unknown",
      email: dbProject.Coordinator_Email || "",
    },
    startDate: dbProject.Project_Start,
    endDate: dbProject.Project_End || dbProject.Project_Start,
    totalEstimated: dbProject.Total_Budget || 0,
    totalActual: dbProject.Total_Actual_Expenses || 0,
    totalActualIncome: dbProject.Total_Actual_Income || 0,
    totalExpectedIncome: dbProject.Total_Expected_Income || 0,
    expectedRegistrationRevenue: dbProject.Expected_Registration_Revenue,
    typeId: dbProject.Project_Type_ID || 0, // Default to 0 for uncategorized
    typeName: dbProject.Project_Type || "Uncategorized",

    // Budget fields
    budgetEnabled: dbProject.Budgets_Enabled,
    budgetStatusId: dbProject.Budget_Status_ID,
    budgetStatusName: dbProject.Budget_Status_Name,
    budgetStatusColor: dbProject.Budget_Status_Color,
    budgetLocked: dbProject.Budget_Locked,
  };
}

/**
 * API response error
 */
export interface ProjectsError {
  error: string;
  message?: string;
  details?: string;
}

/**
 * Get the URL path for a project using its slug
 */
export function getProjectUrl(project: Project | { slug: string }): string {
  return `/projects/${project.slug}`;
}

/**
 * Get the URL path for a budget detail page using its slug
 */
export function getBudgetUrl(project: Project | { slug: string }): string {
  return `/budgets/${project.slug}`;
}
