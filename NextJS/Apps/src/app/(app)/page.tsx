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
        <h1 className="text-4xl font-bold text-primary mb-2">Ministry Applications</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto px-4">
          Internal tools for Woodside Bible Church staff and volunteers
        </p>
      </div>

      {/* Apps Grid */}
      <div className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
            {apps.map((app) => {
              const Icon = getIcon(app.Icon);
              const route = app.Route || '#';
              return (
                <Link key={app.Application_ID} href={route}>
                  <Card className="hover:shadow-lg hover:border-primary/50 transition-all cursor-pointer h-full group">
                    <CardHeader>
                      <div className="bg-primary w-14 h-14 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Icon className="w-7 h-7 text-primary-foreground" />
                      </div>
                      <CardTitle className="text-xl uppercase font-extrabold tracking-tight" style={{ letterSpacing: '-0.025em' }}>{app.Application_Name}</CardTitle>
                      <CardDescription className="text-base">{app.Description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-primary font-semibold flex items-center gap-1">
                        Open app
                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
