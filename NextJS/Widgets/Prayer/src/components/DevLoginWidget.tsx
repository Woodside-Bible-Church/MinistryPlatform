'use client';

/**
 * Development Login Widget
 * Shows the MP login widget for local testing
 * Only visible in development mode
 */

import { useEffect, useState } from 'react';

// Declare the custom element type for TypeScript
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'mpp-user-login': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}

export function DevLoginWidget() {
  const [mounted, setMounted] = useState(false);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  useEffect(() => {
    // Mark component as mounted (client-side only)
    setMounted(true);

    // Check if MP Widgets script is loaded
    const checkScript = setInterval(() => {
      if (typeof window !== 'undefined' && (window as any).MPWidgets) {
        setIsScriptLoaded(true);
        clearInterval(checkScript);
      }
    }, 100);

    return () => clearInterval(checkScript);
  }, []);

  // Don't render anything on server or in production
  if (!mounted || process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="bg-blue-50 border-b-2 border-blue-200 p-4">
      <div className="container mx-auto">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="text-xs font-semibold text-blue-900 mb-1">
              🛠️ DEVELOPMENT MODE
            </div>
            <div className="text-xs text-blue-700">
              {isScriptLoaded ? (
                'MP Widgets loaded ✓ - Use the login widget below to authenticate'
              ) : (
                'Loading MP Widgets script...'
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {isScriptLoaded ? (
              <mpp-user-login></mpp-user-login>
            ) : (
              <div className="text-xs text-blue-700 italic">
                Waiting for MP Widgets...
              </div>
            )}
          </div>
        </div>

        {!isScriptLoaded && (
          <div className="mt-3 text-xs text-blue-600">
            <strong>Note:</strong> If the MP Widgets script doesn&apos;t load, check your network connection
            and ensure https://my.woodsidebible.org is accessible.
          </div>
        )}
      </div>
    </div>
  );
}
