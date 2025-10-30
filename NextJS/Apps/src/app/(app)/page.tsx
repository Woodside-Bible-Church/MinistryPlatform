"use client";

import Link from "next/link";
import { Activity, Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import * as LucideIcons from "lucide-react";

type Application = {
  Application_ID: number;
  Application_Name: string;
  Application_Key: string;
  Description: string;
  Icon: string;
  Route: string;
  Sort_Order: number;
};

export default function Dashboard() {
  const [apps, setApps] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Set page title
  useEffect(() => {
    document.title = "Ministry Apps - Woodside Bible Church";
  }, []);

  useEffect(() => {
    async function loadApplications() {
      try {
        const response = await fetch("/api/applications");
        if (!response.ok) {
          throw new Error("Failed to fetch applications");
        }
        const data = await response.json();
        setApps(data);
      } catch (err) {
        console.error("Error loading applications:", err);
        setError("Failed to load applications");
      } finally {
        setIsLoading(false);
      }
    }
    loadApplications();
  }, []);

  // Map icon name from database to Lucide icon component
  const getIcon = (iconName: string) => {
    console.log(`Loading icon: "${iconName}"`);

    // Try exact match first
    let IconComponent = (LucideIcons as any)[iconName];

    // If not found, try converting to PascalCase (handle lowercase/mixed case input)
    if (!IconComponent) {
      // Convert userRoundSearch -> UserRoundSearch
      const pascalCaseName = iconName
        .split(/[-_\s]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('');

      // Also try with the first letter capitalized if no separators
      const capitalizedName = iconName.charAt(0).toUpperCase() + iconName.slice(1);

      IconComponent = (LucideIcons as any)[pascalCaseName] || (LucideIcons as any)[capitalizedName];

      if (IconComponent) {
        console.log(`Icon found using alternative name: "${pascalCaseName || capitalizedName}"`);
      }
    }

    if (!IconComponent) {
      console.warn(`Icon "${iconName}" not found, using fallback Activity icon`);
    }
    return IconComponent || Activity; // Fallback to Activity icon
  };

  return (
    <div className="min-h-screen">
      {/* Hero Header */}
      <div className="py-12 text-center">
        <h1 className="text-4xl font-bold text-primary dark:text-foreground mb-2">Ministry Applications</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto px-4">
          Internal tools for Woodside Bible Church staff and volunteers
        </p>
      </div>

      {/* Apps Grid */}
      <div className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary dark:text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mb-4" />
            <p className="text-muted-foreground">{error}</p>
          </div>
        ) : apps.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No applications available</p>
            <p className="text-sm text-muted-foreground mt-2">
              Contact your administrator to request access
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 max-w-4xl mx-auto">
            {apps.map((app) => {
              const Icon = getIcon(app.Icon);
              const route = app.Route || '#';
              return (
                <Link key={app.Application_ID} href={route}>
                  <div className="group relative overflow-hidden rounded-2xl border border-border bg-card hover:border-primary/50 dark:hover:border-[#61bc47]/50 hover:shadow-xl transition-all duration-300 cursor-pointer">
                    <div className="flex items-start gap-4 p-6">
                      {/* Icon */}
                      <div className="bg-primary dark:bg-secondary dark:group-hover:bg-[#61bc47] w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-all duration-300 shadow-lg">
                        <Icon className="w-8 h-8 text-white" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg uppercase font-extrabold tracking-tight mb-2 text-foreground" style={{ letterSpacing: '-0.025em' }}>
                          {app.Application_Name}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {app.Description}
                        </p>
                        <div className="mt-3 flex items-center justify-end gap-1 text-primary dark:text-muted-foreground dark:group-hover:text-[#61bc47] font-semibold text-sm transition-colors">
                          <span>Open app</span>
                          <span className="group-hover:translate-x-1 transition-transform">→</span>
                        </div>
                      </div>
                    </div>

                    {/* Hover gradient effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 dark:from-[#61bc47]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
