"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/SessionProvider";
import Link from "next/link";

export default function NewProjectPage() {
  const router = useRouter();
  const session = useSession();
  const [formData, setFormData] = useState({
    Project_Title: "",
    Project_Start: "",
    Project_End: "",
    Project_Approved: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isAdmin = (session as any)?.roles?.includes("Administrators") ?? false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      // Project_Coordinator_ID will be set to current user's Contact_ID on the server
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create project");
      }

      const project = await response.json();
      router.push(`/projects/${project.Project_ID}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <Link
          href="/projects"
          className="text-primary dark:text-[#61BC47] hover:underline mb-4 inline-block"
        >
          ← Back to Projects
        </Link>
        <h1 className="text-3xl font-bold text-primary dark:text-foreground">Create New Project</h1>
        <p className="text-muted-foreground mt-2">
          Set up a new project budget for an event or ministry initiative
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
              htmlFor="Project_Title"
              className="block text-sm font-semibold mb-2 text-foreground"
            >
              Project Title *
            </label>
            <input
              type="text"
              id="Project_Title"
              required
              value={formData.Project_Title}
              onChange={(e) =>
                setFormData({ ...formData, Project_Title: e.target.value })
              }
              className="w-full px-4 py-2 bg-background border border-border text-foreground rounded-lg focus:ring-2 focus:ring-[#61BC47] focus:border-transparent transition-all"
              placeholder="e.g., Summer Youth Camp 2025"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="Project_Start"
                className="block text-sm font-semibold mb-2 text-foreground"
              >
                Start Date *
              </label>
              <input
                type="date"
                id="Project_Start"
                required
                value={formData.Project_Start}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    Project_Start: e.target.value,
                  })
                }
                className="w-full px-4 py-2 bg-background border border-border text-foreground rounded-lg focus:ring-2 focus:ring-[#61BC47] focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label
                htmlFor="Project_End"
                className="block text-sm font-semibold mb-2 text-foreground"
              >
                End Date *
              </label>
              <input
                type="date"
                id="Project_End"
                required
                value={formData.Project_End}
                onChange={(e) =>
                  setFormData({ ...formData, Project_End: e.target.value })
                }
                className="w-full px-4 py-2 bg-background border border-border text-foreground rounded-lg focus:ring-2 focus:ring-[#61BC47] focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="bg-card border border-border p-4 rounded-lg">
            <p className="text-sm text-foreground mb-2">
              <strong>Project Coordinator:</strong> You will be set as the
              coordinator
            </p>
            <p className="text-sm text-muted-foreground">
              The coordinator manages the budget and approves expenses
            </p>
          </div>

          {isAdmin && (
            <div className="flex items-center">
              <input
                type="checkbox"
                id="Project_Approved"
                checked={formData.Project_Approved}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    Project_Approved: e.target.checked,
                  })
                }
                className="w-4 h-4 text-[#61BC47] border-border rounded focus:ring-[#61BC47]"
              />
              <label
                htmlFor="Project_Approved"
                className="ml-2 text-sm font-medium text-foreground"
              >
                Mark as Approved (Admin only)
              </label>
            </div>
          )}
        </div>

        <div className="flex gap-4 mt-8">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-[#61BC47] hover:bg-[#4fa037] text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
          >
            {submitting ? "Creating..." : "Create Project"}
          </button>
          <Link
            href="/projects"
            className="px-6 py-3 border border-border text-foreground rounded-lg font-semibold hover:bg-card hover:shadow-sm transition-all text-center"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
