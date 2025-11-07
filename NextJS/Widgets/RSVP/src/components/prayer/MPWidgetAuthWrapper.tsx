'use client';

/**
 * MP Widget Auth Wrapper
 * Checks for authentication via MP Login Widget's localStorage token
 */

import { useState, useEffect, ReactNode } from 'react';
import { isAuthenticated } from '@/lib/mpWidgetAuthClient';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

interface MPWidgetAuthWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function MPWidgetAuthWrapper({ children, fallback }: MPWidgetAuthWrapperProps) {
  const [isAuth, setIsAuth] = useState<boolean | null>(null);

  useEffect(() => {
    // Check authentication status
    setIsAuth(isAuthenticated());

    // Set up an interval to check for authentication changes
    const interval = setInterval(() => {
      setIsAuth(isAuthenticated());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Loading state
  if (isAuth === null) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not authenticated
  if (!isAuth) {
    if (fallback) {
      return <>{fallback}</>;
    }

    const isDev = process.env.NODE_ENV === 'development';

    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertDescription className="text-yellow-800">
            <p className="font-semibold mb-2">🔒 Please sign in to continue</p>
            <p className="text-sm">
              {isDev ? (
                <>Use the <strong>amber development header</strong> at the top of the page to paste a token, or use the blue MP login widget.</>
              ) : (
                <>You need to be signed in with your MinistryPlatform account to access prayer requests.</>
              )}
            </p>
          </AlertDescription>
        </Alert>

        {isDev && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-semibold text-blue-900 mb-2">👨‍💻 Development Mode</p>
            <p className="text-xs text-blue-700 mb-3">
              <strong>Option 1:</strong> Use the <span className="bg-amber-100 px-1 rounded">amber token input</span> at the top to paste a MinistryPlatform access token.
            </p>
            <p className="text-xs text-blue-700 mb-3">
              <strong>Option 2:</strong> Use the <span className="bg-blue-100 px-1 rounded">blue MP login widget</span> to sign in (if it loads).
            </p>
            <p className="text-xs text-blue-600">
              <strong>How to get a token:</strong> Sign in to MinistryPlatform, open DevTools → Application → Local Storage → find <code className="bg-blue-100 px-1 rounded">mpp-widgets_AuthToken</code>
            </p>
          </div>
        )}

        {!isDev && (
          <div className="mt-6 p-6 border border-dashed border-gray-300 rounded-lg text-center">
            <p className="text-sm text-muted-foreground mb-4">
              If you don&apos;t see the login widget, make sure the following code is included on this page:
            </p>
            <code className="text-xs bg-gray-100 p-4 rounded block">
              {'<script id="MPWidgets" src="https://my.woodsidebible.org/widgets/dist/MPWidgets.js"></script>'}
              <br />
              {'<mpp-user-login></mpp-user-login>'}
            </code>
          </div>
        )}
      </div>
    );
  }

  // Authenticated
  return <>{children}</>;
}
