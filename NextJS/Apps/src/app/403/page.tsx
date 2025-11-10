"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldAlert } from "lucide-react";

export default function AccessDeniedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const attemptedPath = searchParams.get("path") || "this page";

  useEffect(() => {
    // Redirect to home after 3 seconds
    const timeout = setTimeout(() => {
      router.push("/");
    }, 3000);

    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="bg-card border border-border rounded-lg p-8 max-w-md w-full text-center space-y-6 shadow-sm">
        <div className="flex justify-center">
          <div className="bg-red-100 dark:bg-red-900/20 p-6 rounded-full">
            <ShieldAlert className="w-16 h-16 text-red-600 dark:text-red-400" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-red-600 dark:text-red-400">
            403
          </h1>
          <h2 className="text-2xl font-semibold text-foreground">
            Access Denied
          </h2>
          <p className="text-muted-foreground">
            You don&apos;t have permission to access {attemptedPath}.
          </p>
        </div>

        <div className="pt-4">
          <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
            <div className="animate-spin h-4 w-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full" />
            <span>Redirecting to home...</span>
          </div>
        </div>
      </div>
    </div>
  );
}
