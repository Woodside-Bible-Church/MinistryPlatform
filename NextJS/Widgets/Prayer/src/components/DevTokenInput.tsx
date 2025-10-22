'use client';

/**
 * Development Token Input
 * Allows manual token entry for local testing
 * Only visible in development mode
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

export function DevTokenInput() {
  const [mounted, setMounted] = useState(false);
  const [token, setToken] = useState('');
  const [currentToken, setCurrentToken] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    // Check for existing token
    const existingToken = localStorage.getItem('mpp-widgets_AuthToken');
    setCurrentToken(existingToken);
  }, []);

  const handleSetToken = () => {
    if (token.trim()) {
      localStorage.setItem('mpp-widgets_AuthToken', token.trim());
      setCurrentToken(token.trim());
      setToken('');
      // Reload to trigger auth check
      window.location.reload();
    }
  };

  const handleClearToken = () => {
    localStorage.removeItem('mpp-widgets_AuthToken');
    setCurrentToken(null);
    window.location.reload();
  };

  // Don't render on server or in production
  if (!mounted || process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="bg-amber-50 border-b-2 border-amber-200 p-3">
      <div className="container mx-auto">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="text-xs font-semibold text-amber-900 mb-1">
              🔐 Development Authentication
            </div>
            {currentToken ? (
              <div className="text-xs text-amber-700">
                Token set: {currentToken.substring(0, 20)}...
                <Button
                  onClick={handleClearToken}
                  variant="destructive"
                  size="sm"
                  className="ml-2 h-6 text-xs"
                >
                  Clear Token
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Paste MinistryPlatform token here"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="flex-1 text-xs px-2 py-1 border border-amber-300 rounded bg-white"
                />
                <Button
                  onClick={handleSetToken}
                  size="sm"
                  className="h-7 text-xs"
                  disabled={!token.trim()}
                >
                  Set Token
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
