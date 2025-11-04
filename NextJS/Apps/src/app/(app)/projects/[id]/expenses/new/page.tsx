"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "@/components/SessionProvider";
import Link from "next/link";
import { ProjectBudget } from "@/types/projects";
import EventSelect from "@/components/EventSelect";

export default function NewExpensePage() {
  const params = useParams();
  const router = useRouter();
  const session = useSession();
  const projectId = parseInt(params.id as string);

  const [budgets, setBudgets] = useState<ProjectBudget[]>([]);
  const [formData, setFormData] = useState({
    Project_Budget_ID: "",
    Expense_Title: "",
    Paid_To: "",
    Expense_Date: "",
    Expense_Amount: "",
    Event_ID: null as number | null,
    Expense_Approved: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const isAdmin = session?.user?.security_role === "Admin";

  useEffect(() => {
    async function loadBudgets() {
      try {
        const response = await fetch(`/api/projects/${projectId}/budgets`);
        if (!response.ok) throw new Error("Failed to fetch budgets");
        const data = await response.json();
        // Only show expense categories (not revenue)
        const expenseBudgets = data.filter((b: ProjectBudget) => !b.Is_Revenue);
        setBudgets(expenseBudgets);
      } catch (err) {
        setError("Failed to load budget categories");
      } finally {
        setLoading(false);
      }
    }

    loadBudgets();
  }, [projectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const response = await fetch(`/api/projects/${projectId}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Project_Budget_ID: parseInt(formData.Project_Budget_ID),
          Expense_Title: formData.Expense_Title,
          Paid_To: formData.Paid_To,
          Expense_Date: formData.Expense_Date,
          Expense_Amount: parseFloat(formData.Expense_Amount),
          Event_ID: formData.Event_ID,
          Expense_Approved: formData.Expense_Approved,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create expense");
      }

      router.push(`/projects/${projectId}?tab=expenses`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-foreground">Loading...</div>
      </div>
    );
  }

  if (budgets.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Link
          href={`/projects/${projectId}`}
          className="text-primary dark:text-[#61BC47] hover:underline mb-4 inline-block"
        >
          ← Back to Project
        </Link>
        <div className="bg-card border border-border px-4 py-3 rounded-lg">
          <p className="font-semibold mb-2 text-foreground">No expense categories available</p>
          <p className="text-muted-foreground">
            Please add expense budget categories to the project before
            submitting expenses.
          </p>
        </div>
        <Link
          href={`/projects/${projectId}/budgets/new`}
          className="mt-4 inline-block bg-[#61BC47] hover:bg-[#4fa037] text-white px-6 py-3 rounded-lg font-semibold transition-colors shadow-sm hover:shadow-md"
        >
          Add Budget Category
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <Link
          href={`/projects/${projectId}`}
          className="text-primary dark:text-[#61BC47] hover:underline mb-4 inline-block"
        >
          ← Back to Project
        </Link>
        <h1 className="text-3xl font-bold text-primary dark:text-foreground">Submit Expense</h1>
        <p className="text-muted-foreground mt-2">
          Submit a new expense request for approval
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-card border border-border rounded-lg p-8 shadow-sm">
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label
              htmlFor="Expense_Title"
              className="block text-sm font-semibold mb-2 text-foreground"
            >
              Expense Title *
            </label>
            <input
              type="text"
              id="Expense_Title"
              required
              value={formData.Expense_Title}
              onChange={(e) =>
                setFormData({ ...formData, Expense_Title: e.target.value })
              }
              className="w-full px-4 py-2 bg-background border border-border text-foreground rounded-lg focus:ring-2 focus:ring-[#61BC47] focus:border-transparent transition-all"
              placeholder="e.g., Venue Deposit"
            />
          </div>

          <div>
            <label
              htmlFor="Project_Budget_ID"
              className="block text-sm font-semibold mb-2 text-foreground"
            >
              Expense Category *
            </label>
            <select
              id="Project_Budget_ID"
              required
              value={formData.Project_Budget_ID}
              onChange={(e) =>
                setFormData({ ...formData, Project_Budget_ID: e.target.value })
              }
              className="w-full px-4 py-2 bg-background border border-border text-foreground rounded-lg focus:ring-2 focus:ring-[#61BC47] focus:border-transparent transition-all"
            >
              <option value="">Select a category...</option>
              {budgets.map((budget) => (
                <option
                  key={budget.Project_Budget_ID}
                  value={budget.Project_Budget_ID}
                >
                  {budget.Project_Category_Type} ($
                  {budget.Budget_Amount.toLocaleString()} budgeted)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="Expense_Date"
                className="block text-sm font-semibold mb-2 text-foreground"
              >
                Expense Date *
              </label>
              <input
                type="date"
                id="Expense_Date"
                required
                value={formData.Expense_Date}
                onChange={(e) =>
                  setFormData({ ...formData, Expense_Date: e.target.value })
                }
                className="w-full px-4 py-2 bg-background border border-border text-foreground rounded-lg focus:ring-2 focus:ring-[#61BC47] focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label
                htmlFor="Expense_Amount"
                className="block text-sm font-semibold mb-2 text-foreground"
              >
                Amount *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-2 text-muted-foreground">$</span>
                <input
                  type="number"
                  id="Expense_Amount"
                  required
                  min="0"
                  step="0.01"
                  value={formData.Expense_Amount}
                  onChange={(e) =>
                    setFormData({ ...formData, Expense_Amount: e.target.value })
                  }
                  className="w-full pl-8 pr-4 py-2 bg-background border border-border text-foreground rounded-lg focus:ring-2 focus:ring-[#61BC47] focus:border-transparent transition-all"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          <div>
            <label
              htmlFor="Paid_To"
              className="block text-sm font-semibold mb-2 text-foreground"
            >
              Paid To *
            </label>
            <input
              type="text"
              id="Paid_To"
              required
              value={formData.Paid_To}
              onChange={(e) =>
                setFormData({ ...formData, Paid_To: e.target.value })
              }
              className="w-full px-4 py-2 bg-background border border-border text-foreground rounded-lg focus:ring-2 focus:ring-[#61BC47] focus:border-transparent transition-all"
              placeholder="e.g., Vendor Name"
            />
          </div>

          <div>
            <label
              htmlFor="Event_ID"
              className="block text-sm font-semibold mb-2 text-foreground"
            >
              Event (Optional)
            </label>
            <EventSelect
              value={formData.Event_ID || ""}
              onChange={(eventId) =>
                setFormData({ ...formData, Event_ID: eventId })
              }
            />
            <p className="text-sm text-muted-foreground mt-1">
              If this expense is associated with a specific event, select it from the list
            </p>
          </div>

          {isAdmin && (
            <div className="flex items-center">
              <input
                type="checkbox"
                id="Expense_Approved"
                checked={formData.Expense_Approved}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    Expense_Approved: e.target.checked,
                  })
                }
                className="w-4 h-4 text-[#61BC47] border-gray-300 rounded focus:ring-[#61BC47]"
              />
              <label
                htmlFor="Expense_Approved"
                className="ml-2 text-sm font-medium text-foreground"
              >
                Mark as Approved (Admin only)
              </label>
            </div>
          )}

          <div className="bg-card border border-border p-4 rounded-lg">
            <p className="text-sm text-foreground mb-2">
              <strong>Requested By:</strong> You ({session?.user?.name})
            </p>
            <p className="text-sm text-muted-foreground">
              {isAdmin
                ? "As an admin, you can approve this expense immediately."
                : "This expense will require approval from the project coordinator or an admin."}
            </p>
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-[#61BC47] hover:bg-[#4fa037] text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
          >
            {submitting ? "Submitting..." : "Submit Expense"}
          </button>
          <Link
            href={`/projects/${projectId}`}
            className="px-6 py-3 border border-border text-foreground rounded-lg font-semibold hover:bg-card hover:shadow-sm transition-all text-center"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
