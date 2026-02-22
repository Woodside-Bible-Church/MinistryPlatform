"use client";

import { useState, useEffect, useCallback } from "react";
import ServeGrid from "./ServeGrid";
import SkeletonLoader from "./SkeletonLoader";
import { apiFetch } from "@/lib/apiClient";
import type { ServeFinderData } from "@/types/serveFinder";

export default function ServeFinderPage() {
  const [data, setData] = useState<ServeFinderData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const response = await apiFetch("/api/opportunities", {
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      const result: ServeFinderData = await response.json();
      setData(result);
    } catch (error) {
      console.error("Failed to fetch opportunities:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <section id="serveFinder" className="serveFinderContainer">
      {loading ? (
        <SkeletonLoader count={6} />
      ) : data ? (
        <ServeGrid
          opportunities={data.Opportunities}
          settings={data.Settings}
        />
      ) : (
        <div className="serveFinderEmpty">
          <p>Unable to load opportunities. Please try again later.</p>
        </div>
      )}
    </section>
  );
}
