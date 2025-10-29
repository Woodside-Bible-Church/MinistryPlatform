"use client";

import { usePathname } from "next/navigation";
import DynamicBreadcrumb from "@/components/DynamicBreadcrumb";

export default function BreadcrumbWrapper() {
  const pathname = usePathname();

  // Don't render container if on home page
  if (pathname === '/') {
    return null;
  }

  return (
    <div className="py-4 px-4 md:px-6">
      <div className="inline-flex items-center px-4 py-2 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 shadow-sm dark:bg-[oklch(0.15_0.035_250)]/80 dark:border-gray-800/50">
        <DynamicBreadcrumb />
      </div>
    </div>
  );
}
