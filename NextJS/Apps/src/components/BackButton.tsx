"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface BackButtonProps {
  /** The fallback URL to navigate to if no history exists */
  fallbackUrl: string;
  /** The text to display in the back link */
  label: string;
  /** Optional className for styling */
  className?: string;
}

/**
 * A smart back button that uses browser history when available,
 * or falls back to a specified URL.
 */
export function BackButton({ fallbackUrl, label, className }: BackButtonProps) {
  const router = useRouter();
  const [hasHistory, setHasHistory] = useState(false);

  useEffect(() => {
    // Check if this is a client-side navigation by looking at window.history.state
    // Next.js sets navigation state when using client-side routing
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

    // If navigation type is not 'reload' or 'back_forward', and we have history length > 1,
    // it's likely we navigated here from within the app
    const isClientNavigation = navigationEntry?.type !== 'reload' &&
                               navigationEntry?.type !== 'back_forward' &&
                               window.history.length > 1;

    // Also check if we have a state in window.history (Next.js sets this)
    const hasState = window.history.state !== null;

    setHasHistory(isClientNavigation || hasState);
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();

    if (hasHistory) {
      // Use browser back if we likely have app navigation history
      router.back();
    } else {
      // Fall back to the specified URL if we came here directly
      router.push(fallbackUrl);
    }
  };

  return (
    <a
      href={fallbackUrl}
      onClick={handleClick}
      className={
        className ||
        "inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
      }
    >
      <ArrowLeft className="w-4 h-4" />
      {label}
    </a>
  );
}
