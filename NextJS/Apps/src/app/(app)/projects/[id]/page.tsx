"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "@/components/SessionProvider";
import Link from "next/link";
import { Project } from "@/types/projects";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const session = useSession();
  const projectId = parseInt(params.id as string);

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "expenses">(
    "overview"
  );

  // For now, everyone can edit (security to be added later)
  const canEdit = true;

  useEffect(() => {
    async function loadProjectData() {
      try {
        // Load project with nested budgets and expenses using efficient stored procedure
        const projectRes = await fetch(`/api/projects/${projectId}`);
        if (!projectRes.ok) throw new Error("Failed to fetch project");
        const projectData = await projectRes.json();
        setProject(projectData);
      } catch (error) {
        console.error("Error loading project data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadProjectData();
  }, [projectId]);

  // Extract budgets and expenses from project (now nested)
  const budgets = project?.Budgets || [];
  const expenses = project?.Expenses || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-foreground">Loading project...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded">
          Project not found
        </div>
        <Link
          href="/projects"
          className="text-primary dark:text-[#61BC47] hover:underline mt-4 inline-block"
        >
          ← Back to Projects
        </Link>
      </div>
    );
  }

  // Calculate budget summary
  const revenueBudgets = budgets.filter((b) => b.Is_Revenue);
  const expenseBudgets = budgets.filter((b) => !b.Is_Revenue);
  const totalRevenueBudget = revenueBudgets.reduce(
    (sum, b) => sum + b.Budget_Amount,
    0
  );
  const totalExpenseBudget = expenseBudgets.reduce(
    (sum, b) => sum + b.Budget_Amount,
    0
  );
  const totalExpensesSpent = expenses
    .filter((e) => e.Expense_Approved)
    .reduce((sum, e) => sum + e.Expense_Amount, 0);
  const totalExpensesPending = expenses
    .filter((e) => !e.Expense_Approved)
    .reduce((sum, e) => sum + e.Expense_Amount, 0);
  const budgetRemaining = totalExpenseBudget - totalExpensesSpent;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Link
        href="/projects"
        className="text-primary dark:text-[#61BC47] hover:underline mb-4 inline-block"
      >
        ← Back to Projects
      </Link>

      {/* Project Header */}
      <div className="bg-card border border-border rounded-lg p-6 mb-6 shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-primary dark:text-foreground">
              {project.Project_Title}
            </h1>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>
                Coordinator:{" "}
                {project.Coordinator?.First_Name +
                  " " +
                  project.Coordinator?.Last_Name || "N/A"}
                {project.Coordinator?.Email_Address && (
                  <span className="text-xs ml-2">
                    ({project.Coordinator.Email_Address})
                  </span>
                )}
              </p>
              <p>
                {new Date(project.Project_Start).toLocaleDateString()} -{" "}
                {project.Project_End
                  ? new Date(project.Project_End).toLocaleDateString()
                  : "Ongoing"}
              </p>
              {project.Project_Group_Name && (
                <p>Group: {project.Project_Group_Name}</p>
              )}
            </div>
          </div>
          <div className="text-right">
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-2 border ${
                project.Project_Approved
                  ? "bg-[#61bc47]/10 border-[#61bc47]/20 text-[#61bc47]"
                  : "bg-card border-border text-muted-foreground"
              }`}
            >
              {project.Project_Approved ? "Approved" : "Pending"}
            </span>
            {canEdit && (
              <div className="mt-2">
                <Link
                  href={`/projects/${projectId}/edit`}
                  className="text-sm text-primary dark:text-[#61BC47] hover:underline"
                >
                  Edit Project
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Budget Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
          <div className="text-sm text-muted-foreground mb-1">
            Expected Revenue
          </div>
          <div className="text-2xl font-bold text-[#61bc47]">
            ${totalRevenueBudget.toLocaleString()}
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
          <div className="text-sm text-muted-foreground mb-1">
            Expense Budget
          </div>
          <div className="text-2xl font-bold text-foreground">
            ${totalExpenseBudget.toLocaleString()}
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
          <div className="text-sm text-muted-foreground mb-1">Spent</div>
          <div className="text-2xl font-bold text-foreground">
            ${totalExpensesSpent.toLocaleString()}
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
          <div className="text-sm text-muted-foreground mb-1">Remaining</div>
          <div
            className={`text-2xl font-bold ${
              budgetRemaining >= 0 ? "text-[#61bc47]" : "text-foreground"
            }`}
          >
            ${budgetRemaining.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border mb-6">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab("overview")}
            className={`pb-3 font-semibold border-b-2 transition-colors ${
              activeTab === "overview"
                ? "border-primary dark:border-[#61BC47] text-primary dark:text-[#61BC47]"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Budget Overview
          </button>
          <button
            onClick={() => setActiveTab("expenses")}
            className={`pb-3 font-semibold border-b-2 transition-colors ${
              activeTab === "expenses"
                ? "border-primary dark:border-[#61BC47] text-primary dark:text-[#61BC47]"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Expenses ({expenses.length})
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {budgets.length === 0 ? (
            <div className="bg-card border-2 border-dashed border-border rounded-lg p-12 text-center">
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No budget categories set up
              </h3>
              <p className="text-muted-foreground mb-6">
                Add budget categories to start tracking revenue and expenses.
              </p>
              {canEdit && (
                <Link
                  href={`/projects/${projectId}/budgets/new`}
                  className="inline-block bg-[#61BC47] hover:bg-[#4fa037] text-white px-6 py-3 rounded-lg font-semibold transition-colors shadow-sm hover:shadow-md"
                >
                  Add Budget Category
                </Link>
              )}
            </div>
          ) : (
            <>
              {/* Revenue Section */}
              {revenueBudgets.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold mb-3 text-primary dark:text-foreground">
                    Revenue
                  </h2>
                  <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
                    <table className="w-full">
                      <thead className="bg-card border-b border-border">
                        <tr>
                          <th className="text-left px-4 py-3 font-semibold text-foreground">
                            Category
                          </th>
                          <th className="text-right px-4 py-3 font-semibold text-foreground">
                            Budget Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {revenueBudgets.map((budget) => (
                          <tr
                            key={budget.Project_Budget_ID}
                            className="border-b border-border last:border-b-0"
                          >
                            <td className="px-4 py-3 text-foreground">
                              {budget.Project_Category_Type}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-[#61bc47]">
                              ${budget.Budget_Amount.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Expense Section */}
              {expenseBudgets.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold mb-3 text-primary dark:text-foreground">
                    Expense Categories
                  </h2>
                  <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
                    <table className="w-full">
                      <thead className="bg-card border-b border-border">
                        <tr>
                          <th className="text-left px-4 py-3 font-semibold text-foreground">
                            Category
                          </th>
                          <th className="text-right px-4 py-3 font-semibold text-foreground">
                            Budget
                          </th>
                          <th className="text-right px-4 py-3 font-semibold text-foreground">
                            Spent
                          </th>
                          <th className="text-right px-4 py-3 font-semibold text-foreground">
                            Remaining
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {expenseBudgets.map((budget) => {
                          const spent = expenses
                            .filter(
                              (e) =>
                                e.Project_Budget_ID ===
                                  budget.Project_Budget_ID && e.Expense_Approved
                            )
                            .reduce((sum, e) => sum + e.Expense_Amount, 0);
                          const remaining = budget.Budget_Amount - spent;

                          return (
                            <tr
                              key={budget.Project_Budget_ID}
                              className="border-b border-border last:border-b-0"
                            >
                              <td className="px-4 py-3 text-foreground">
                                {budget.Project_Category_Type}
                              </td>
                              <td className="px-4 py-3 text-right text-muted-foreground">
                                ${budget.Budget_Amount.toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-right text-foreground">
                                ${spent.toLocaleString()}
                              </td>
                              <td
                                className={`px-4 py-3 text-right font-semibold ${
                                  remaining >= 0
                                    ? "text-[#61bc47]"
                                    : "text-foreground"
                                }`}
                              >
                                ${remaining.toLocaleString()}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {canEdit && (
                <div className="text-center">
                  <Link
                    href={`/projects/${projectId}/budgets/new`}
                    className="inline-block bg-[#61BC47] hover:bg-[#4fa037] text-white px-6 py-3 rounded-lg font-semibold transition-colors shadow-sm hover:shadow-md"
                  >
                    + Add Budget Category
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === "expenses" && (
        <div className="space-y-6">
          {expenses.length === 0 ? (
            <div className="bg-card border-2 border-dashed border-border rounded-lg p-12 text-center">
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No expenses yet
              </h3>
              <p className="text-muted-foreground mb-6">
                Submit expense requests to track spending against the budget.
              </p>
              {canEdit && budgets.length > 0 && (
                <Link
                  href={`/projects/${projectId}/expenses/new`}
                  className="inline-block bg-[#61BC47] hover:bg-[#4fa037] text-white px-6 py-3 rounded-lg font-semibold transition-colors shadow-sm hover:shadow-md"
                >
                  Submit Expense
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
                <table className="w-full">
                  <thead className="bg-card border-b border-border">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold text-foreground">
                        Title
                      </th>
                      <th className="text-left px-4 py-3 font-semibold text-foreground">
                        Category
                      </th>
                      <th className="text-left px-4 py-3 font-semibold text-foreground">
                        Paid To
                      </th>
                      <th className="text-right px-4 py-3 font-semibold text-foreground">
                        Amount
                      </th>
                      <th className="text-center px-4 py-3 font-semibold text-foreground">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((expense) => (
                      <tr
                        key={expense.Project_Expense_ID}
                        className="border-b border-border last:border-b-0 hover:bg-card/50 transition-colors"
                      >
                        <td className="px-4 py-3 text-foreground">
                          {expense.Expense_Title}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {expense.Project_Budget}
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground">
                          {expense.Paid_To}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-foreground">
                          ${expense.Expense_Amount.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${
                              expense.Expense_Approved
                                ? "bg-[#61bc47]/10 border-[#61bc47]/20 text-[#61bc47]"
                                : "bg-card border-border text-muted-foreground"
                            }`}
                          >
                            {expense.Expense_Approved ? "Approved" : "Pending"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {canEdit && budgets.length > 0 && (
                <div className="text-center">
                  <Link
                    href={`/projects/${projectId}/expenses/new`}
                    className="inline-block bg-[#61BC47] hover:bg-[#4fa037] text-white px-6 py-3 rounded-lg font-semibold transition-colors shadow-sm hover:shadow-md"
                  >
                    + Submit Expense
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
