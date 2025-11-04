// Project Budget Types
// Based on MinistryPlatform tables for project/budget management

export interface Project {
  Project_ID: number;
  Project_Title: string;
  Project_Coordinator_ID: number;
  Project_Coordinator_Name?: string;
  Project_Start_Date: string;
  Project_End_Date?: string | null;
  Project_Group_ID?: number;
  Project_Group_Name?: string;
  Project_Approved: boolean;
  Budgets?: ProjectBudget[];
  Expenses?: ProjectExpense[];
}

export interface ProjectCategoryType {
  Project_Category_Type_ID: number;
  Project_Category_Type: string;
  Is_Revenue: boolean;
  Discontinued: boolean;
  Sort_Order: number;
}

export interface ProjectBudget {
  Project_Budget_ID: number;
  Project_ID: number;
  Project_Category_Type_ID: number;
  Project_Category_Type?: string;
  Is_Revenue?: boolean;
  Budget_Amount: number;
}

export interface ProjectExpense {
  Project_Expense_ID: number;
  Project_ID: number;
  Project_Budget_ID: number;
  Project_Budget?: string;
  Expense_Title: string;
  Requested_By_Contact_ID: number;
  Requested_By_Name?: string;
  Paid_To: string;
  Expense_Date: string;
  Expense_Amount: number;
  Event_ID?: number;
  Event_Title?: string;
  Expense_Approved: boolean;
}

export interface Event {
  Event_ID: number;
  Event_Title: string;
  Event_Start_Date: string;
  Event_End_Date?: string;
  Event_Type?: string;
  Program_Name?: string;
}

export interface ProjectEvent {
  Project_Event_ID: number;
  Project_ID: number;
  Event_ID: number;
  Event_Title?: string;
  Event_Start_Date?: string;
  Event_End_Date?: string;
}

// Form types for creating/editing
export interface CreateProjectInput {
  Project_Title: string;
  Project_Coordinator_ID: number;
  Project_Start_Date: string;
  Project_End_Date: string;
  Project_Group_ID?: number;
  Project_Approved: boolean;
}

export interface CreateProjectBudgetInput {
  Project_ID: number;
  Project_Category_Type_ID: number;
  Budget_Amount: number;
}

export interface CreateProjectExpenseInput {
  Project_ID: number;
  Project_Budget_ID: number;
  Expense_Title: string;
  Requested_By_Contact_ID: number;
  Paid_To: string;
  Expense_Date: string;
  Expense_Amount: number;
  Event_ID?: number;
  Expense_Approved: boolean;
}

export interface CreateProjectEventInput {
  Project_ID: number;
  Event_ID: number;
}

// Budget summary for dashboard
export interface ProjectBudgetSummary {
  Project_ID: number;
  Project_Title: string;
  Total_Revenue_Budget: number;
  Total_Expense_Budget: number;
  Total_Expenses_Spent: number;
  Total_Expenses_Pending: number;
  Budget_Remaining: number;
  Budget_Status: "under" | "over" | "on-track";
}
