import { MinistryPlatformClient } from "@/providers/MinistryPlatform/core/ministryPlatformClient";
import { TableService } from "@/providers/MinistryPlatform/services/tableService";
import { ProcedureService } from "@/providers/MinistryPlatform/services/procedureService";
import type {
  Project,
  ProjectBudget,
  ProjectExpense,
  ProjectCategoryType,
  Event,
  CreateProjectInput,
  CreateProjectBudgetInput,
  CreateProjectExpenseInput,
} from "@/types/projects";

export class ProjectsService {
  private tableService: TableService;
  private procedureService: ProcedureService;
  private client: MinistryPlatformClient;

  constructor() {
    this.client = new MinistryPlatformClient();
    this.tableService = new TableService(this.client);
    this.procedureService = new ProcedureService(this.client);
  }

  // Projects
  /**
   * Get all projects with nested budgets and expenses using stored procedure
   * This is more efficient than making multiple API calls
   * Admin status is determined within the stored procedure by checking user roles
   */
  async getProjectsWithNested(userName: string, domainId: number = 1, projectId?: number) {
    const params: any = {
      "@UserName": userName,
      "@DomainID": domainId,
    };

    if (projectId) {
      params["@ProjectID"] = projectId;
    }

    const result = await this.procedureService.executeProcedureWithBody(
      "api_Custom_Projects_JSON",
      params
    );

    console.log("Raw stored procedure result:", JSON.stringify(result, null, 2));

    // MinistryPlatform stored procedures with FOR JSON PATH return data in nested format
    // Structure: [[{ "JSON_GUID": "[{actual data}]" }]]
    let projects: any[] = [];

    if (Array.isArray(result) && result.length > 0) {
      let firstItem: any = result[0];

      // Handle double-nested array: [[{ "GUID": "json" }]]
      if (Array.isArray(firstItem) && firstItem.length > 0) {
        firstItem = firstItem[0];
      }

      // Check if it's an object with a GUID key containing JSON string
      if (typeof firstItem === "object" && !Array.isArray(firstItem)) {
        // Get the first property value (the GUID key)
        const jsonString = Object.values(firstItem)[0];

        // If it's a string, parse it as JSON
        if (typeof jsonString === "string") {
          try {
            projects = JSON.parse(jsonString);
          } catch (e) {
            console.error("Failed to parse JSON string:", e);
            projects = [];
          }
        } else if (Array.isArray(jsonString)) {
          projects = jsonString;
        }
      } else if (Array.isArray(firstItem)) {
        // Handle nested array case
        projects = firstItem;
      } else {
        // Handle direct array case
        projects = result;
      }
    }

    console.log("Projects before parsing nested JSON:", JSON.stringify(projects, null, 2));

    // Parse nested JSON strings for Coordinator, Budgets and Expenses
    projects = projects.map((project) => {
      console.log(`Parsing project ${project.Project_ID}:`, {
        CoordinatorType: typeof project.Coordinator,
        BudgetsType: typeof project.Budgets,
        ExpensesType: typeof project.Expenses,
        Coordinator: project.Coordinator,
        Budgets: project.Budgets,
        Expenses: project.Expenses,
      });

      return {
        ...project,
        Coordinator: typeof project.Coordinator === 'string' ? JSON.parse(project.Coordinator) : project.Coordinator,
        Budgets: typeof project.Budgets === 'string' ? JSON.parse(project.Budgets) : (project.Budgets || []),
        Expenses: typeof project.Expenses === 'string' ? JSON.parse(project.Expenses) : (project.Expenses || []),
      };
    });

    console.log("Final parsed projects:", JSON.stringify(projects, null, 2));

    return projects;
  }

  async getProjects(filter?: string, orderBy?: string) {
    return this.tableService.getTableRecords<Project>("Projects", {
      $filter: filter,
      $orderby: orderBy || "Project_Start DESC",
    });
  }

  async getProjectById(projectId: number) {
    const projects = await this.tableService.getTableRecords<Project>("Projects", {
      $filter: `Project_ID=${projectId}`,
    });
    return projects[0] || null;
  }

  async createProject(data: Omit<CreateProjectInput, "Project_ID">): Promise<number> {
    const result = await this.tableService.createTableRecords("Projects", [data]);
    return result[0] as unknown as number;
  }

  // Project Category Types
  async getCategoryTypes() {
    return this.tableService.getTableRecords<ProjectCategoryType>("Project_Category_Types", {
      $filter: "Discontinued=0",
      $orderby: "Sort_Order",
    });
  }

  // Project Budgets
  async getProjectBudgets(projectId: number) {
    return this.tableService.getTableRecords<ProjectBudget>("Project_Budgets", {
      $filter: `Project_ID=${projectId}`,
    });
  }

  async createProjectBudget(data: Omit<CreateProjectBudgetInput, "Project_Budget_ID">): Promise<number> {
    const result = await this.tableService.createTableRecords("Project_Budgets", [data]);
    return result[0] as unknown as number;
  }

  // Project Expenses
  async getProjectExpenses(projectId: number) {
    return this.tableService.getTableRecords<ProjectExpense>("Project_Expenses", {
      $filter: `Project_ID=${projectId}`,
      $orderby: "Expense_Date DESC",
    });
  }

  async createProjectExpense(data: Omit<CreateProjectExpenseInput, "Project_Expense_ID">): Promise<number> {
    const result = await this.tableService.createTableRecords("Project_Expenses", [data]);
    return result[0] as unknown as number;
  }

  // Events
  async getEvents(searchTerm?: string) {
    const filter = searchTerm
      ? `Event_Title LIKE '%${searchTerm}%' AND Event_End_Date >= GETDATE()`
      : "Event_End_Date >= GETDATE()";

    return this.tableService.getTableRecords<Event>("Events", {
      $filter: filter,
      $select: "Event_ID,Event_Title,Event_Start_Date,Event_End_Date",
      $orderby: "Event_Start_Date ASC",
      $top: 50, // Limit results for performance
    });
  }
}
