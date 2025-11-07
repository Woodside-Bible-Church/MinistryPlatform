'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useAppContext } from '@/hooks/useStandaloneMode';

/**
 * Component that dynamically injects the appropriate manifest link based on current route
 */
export default function DynamicManifest() {
  const pathname = usePathname();
  const appContext = useAppContext(pathname);

  useEffect(() => {
    // Remove any existing manifest links
    const existingManifest = document.querySelector('link[rel="manifest"]');
    if (existingManifest) {
      existingManifest.remove();
    }

    // Add new manifest link for the current app
    const manifestLink = document.createElement('link');
    manifestLink.rel = 'manifest';
    manifestLink.href = `/api/manifest?app=${appContext}`;
    document.head.appendChild(manifestLink);

    return () => {
      // Cleanup on unmount
      const link = document.querySelector(`link[rel="manifest"][href="/api/manifest?app=${appContext}"]`);
      if (link) {
        link.remove();
      }
    };
  }, [appContext]);

  return null; // This component doesn't render anything
}
