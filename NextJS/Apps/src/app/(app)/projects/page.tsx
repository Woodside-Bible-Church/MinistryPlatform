"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/components/SessionProvider";
import Link from "next/link";
import { Project } from "@/types/projects";

export default function ProjectsPage() {
  const session = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const isAdmin = (session as any)?.roles?.includes("Administrators") ?? false;

  useEffect(() => {
    async function loadProjects() {
      try {
        const response = await fetch("/api/projects");
        if (!response.ok) throw new Error("Failed to fetch projects");
        const data = await response.json();
        setProjects(data);
      } catch (error) {
        console.error("Error loading projects:", error);
      } finally {
        setLoading(false);
      }
    }

    loadProjects();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-primary dark:text-foreground">
            Project Budgets
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage budgets for large events and ministry projects. Test change.
          </p>
        </div>
        <Link
          href="/projects/new"
          className="bg-[#61BC47] hover:bg-[#4fa037] text-white px-6 py-3 rounded-lg font-semibold transition-colors shadow-sm hover:shadow-md"
        >
          + New Project
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="bg-card border-2 border-dashed border-border rounded-lg p-12 text-center">
          <h3 className="text-xl font-semibold text-foreground mb-2">
            No projects yet
          </h3>
          <p className="text-muted-foreground mb-6">
            Create your first project to start tracking budgets and expenses.
          </p>
          <Link
            href="/projects/new"
            className="inline-block bg-[#61BC47] hover:bg-[#4fa037] text-white px-6 py-3 rounded-lg font-semibold transition-colors shadow-sm hover:shadow-md"
          >
            Create Project
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Link
              key={project.Project_ID}
              href={`/projects/${project.Project_ID}`}
              className="bg-card border border-border rounded-lg p-6 hover:shadow-xl hover:border-primary/50 dark:hover:border-[#61bc47]/50 transition-all flex flex-col h-full group"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-foreground flex-1 pr-2">
                  {project.Project_Title}
                </h3>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap border ${
                    project.Project_Approved
                      ? "bg-[#61bc47]/10 border-[#61bc47]/20 text-[#61bc47]"
                      : "bg-card border-border text-muted-foreground"
                  }`}
                >
                  {project.Project_Approved ? "Approved" : "Pending"}
                </span>
              </div>
              <div className="space-y-1 text-sm text-muted-foreground mt-auto">
                <p>
                  Coordinator:{" "}
                  {project.Coordinator?.First_Name +
                    " " +
                    project.Coordinator?.Last_Name || "N/A"}
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
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
