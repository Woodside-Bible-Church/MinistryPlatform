import { useState, useEffect } from "react";
import type {
  Project,
  ProjectFromDB,
  ProjectsError,
  transformProjectFromDB,
} from "@/types/projects";

// Import the transform function
import { transformProjectFromDB as transform } from "@/types/projects";

interface UseProjectsOptions {
  projectId?: string | number;
}

interface UseProjectsReturn {
  projects: Project[];
  isLoading: boolean;
  error: ProjectsError | null;
  refetch: () => void;
}

/**
 * Hook to fetch projects from the MinistryPlatform API
 */
export function useProjects(
  options: UseProjectsOptions = {}
): UseProjectsReturn {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ProjectsError | null>(null);

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Build URL with optional projectId parameter
      const params = new URLSearchParams();
      if (options.projectId) {
        params.append("projectId", options.projectId.toString());
      }

      const url = `/api/projects/budgets${params.toString() ? `?${params.toString()}` : ""}`;

      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch projects");
      }

      const data: ProjectFromDB[] = await response.json();

      // Transform database projects to UI projects and filter out nulls
      const transformedProjects = data
        .map(transform)
        .filter((p): p is Project => p !== null);

      setProjects(transformedProjects);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError({
        error: "Failed to fetch projects",
        message: errorMessage,
      });
      console.error("Error fetching projects:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [options.projectId]);

  return {
    projects,
    isLoading,
    error,
    refetch: fetchProjects,
  };
}
