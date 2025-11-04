"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ProjectCategoryType } from "@/types/projects";

export default function NewBudgetPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = parseInt(params.id as string);

  const [categoryTypes, setCategoryTypes] = useState<ProjectCategoryType[]>([]);
  const [formData, setFormData] = useState({
    Project_Category_Type_ID: "",
    Budget_Amount: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCategoryTypes() {
      try {
        const response = await fetch("/api/projects/category-types");
        if (!response.ok) throw new Error("Failed to fetch category types");
        const data = await response.json();
        setCategoryTypes(data);
      } catch (err) {
        setError("Failed to load category types");
      } finally {
        setLoading(false);
      }
    }

    loadCategoryTypes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const response = await fetch(`/api/projects/${projectId}/budgets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Project_Category_Type_ID: parseInt(formData.Project_Category_Type_ID),
          Budget_Amount: parseFloat(formData.Budget_Amount),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create budget");
      }

      // Navigate back and force refresh to show new budget
      router.push(`/projects/${projectId}`);
      router.refresh();
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

  const revenueCategoriesOptions = categoryTypes.filter((ct) => ct.Is_Revenue);
  const expenseCategoriesOptions = categoryTypes.filter((ct) => !ct.Is_Revenue);

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <Link
          href={`/projects/${projectId}`}
          className="text-primary dark:text-[#61BC47] hover:underline mb-4 inline-block"
        >
          ← Back to Project
        </Link>
        <h1 className="text-3xl font-bold text-primary dark:text-foreground">Add Budget Category</h1>
        <p className="text-muted-foreground mt-2">
          Add a revenue source or expense category to the project budget
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
              htmlFor="Project_Category_Type_ID"
              className="block text-sm font-semibold mb-2 text-foreground"
            >
              Category *
            </label>
            <select
              id="Project_Category_Type_ID"
              required
              value={formData.Project_Category_Type_ID}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  Project_Category_Type_ID: e.target.value,
                })
              }
              className="w-full px-4 py-2 bg-background border border-border text-foreground rounded-lg focus:ring-2 focus:ring-[#61BC47] focus:border-transparent transition-all"
            >
              <option value="">Select a category...</option>
              {revenueCategoriesOptions.length > 0 && (
                <optgroup label="Revenue">
                  {revenueCategoriesOptions.map((category) => (
                    <option
                      key={category.Project_Category_Type_ID}
                      value={category.Project_Category_Type_ID}
                    >
                      {category.Project_Category_Type}
                    </option>
                  ))}
                </optgroup>
              )}
              {expenseCategoriesOptions.length > 0 && (
                <optgroup label="Expenses">
                  {expenseCategoriesOptions.map((category) => (
                    <option
                      key={category.Project_Category_Type_ID}
                      value={category.Project_Category_Type_ID}
                    >
                      {category.Project_Category_Type}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          <div>
            <label
              htmlFor="Budget_Amount"
              className="block text-sm font-semibold mb-2 text-foreground"
            >
              Budget Amount *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-2 text-muted-foreground">$</span>
              <input
                type="number"
                id="Budget_Amount"
                required
                min="0"
                step="0.01"
                value={formData.Budget_Amount}
                onChange={(e) =>
                  setFormData({ ...formData, Budget_Amount: e.target.value })
                }
                className="w-full pl-8 pr-4 py-2 bg-background border border-border text-foreground rounded-lg focus:ring-2 focus:ring-[#61BC47] focus:border-transparent transition-all"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-[#61BC47] hover:bg-[#4fa037] text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
          >
            {submitting ? "Adding..." : "Add Budget Category"}
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
