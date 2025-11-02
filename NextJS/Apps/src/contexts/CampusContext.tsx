"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Congregation = {
  Congregation_ID: number;
  Congregation_Name: string;
  Congregation_Short_Name?: string | null;
  Campus_SVG_URL?: string | null;
};

type CampusContextType = {
  selectedCampus: Congregation | null;
  setSelectedCampus: (campus: Congregation | null) => void;
  congregations: Congregation[];
  isLoading: boolean;
};

const CampusContext = createContext<CampusContextType | undefined>(undefined);

export function CampusProvider({ children }: { children: ReactNode }) {
  const [selectedCampus, setSelectedCampus] = useState<Congregation | null>(null);
  const [congregations, setCongregations] = useState<Congregation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load congregations on mount
  useEffect(() => {
    async function loadCongregations() {
      try {
        const response = await fetch("/api/counter/congregations");
        if (!response.ok) throw new Error("Failed to fetch congregations");
        const data = await response.json();

        // Handle new response format with congregations array and userWebCongregation
        const congregationsList = data.congregations || data;

        // Sort to always put Church Wide (Congregation_ID = 1) at the top
        const sortedCongregations = [...congregationsList].sort((a, b) => {
          if (a.Congregation_ID === 1) return -1;
          if (b.Congregation_ID === 1) return 1;
          return 0; // Keep original order for other congregations
        });

        setCongregations(sortedCongregations);

        // Auto-select user's Web Congregation if available, otherwise Church Wide (ID = 1)
        if (congregationsList.length > 0 && !selectedCampus) {
          if (data.userWebCongregation) {
            const userCampus = congregationsList.find(
              (c: Congregation) => c.Congregation_ID === data.userWebCongregation
            );
            setSelectedCampus(userCampus || congregationsList[0]);
          } else {
            // Default to "Church Wide" (Congregation_ID = 1)
            const churchWide = congregationsList.find((c: Congregation) => c.Congregation_ID === 1);
            setSelectedCampus(churchWide || congregationsList[0]);
          }
        }
      } catch (error) {
        console.error("Error loading congregations:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadCongregations();
  }, []);

  return (
    <CampusContext.Provider value={{ selectedCampus, setSelectedCampus, congregations, isLoading }}>
      {children}
    </CampusContext.Provider>
  );
}

export function useCampus() {
  const context = useContext(CampusContext);
  if (context === undefined) {
    throw new Error("useCampus must be used within a CampusProvider");
  }
  return context;
}
