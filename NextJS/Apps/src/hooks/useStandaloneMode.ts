'use client';

import { useState, useEffect } from 'react';

/**
 * Hook to detect if the app is running in PWA standalone mode
 * @returns boolean indicating if app is in standalone mode
 */
export function useStandaloneMode(): boolean {
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (iOS)
    const isStandaloneIOS = ('standalone' in window.navigator) && (window.navigator as any).standalone === true;

    // Check if running in standalone mode (Android/Desktop)
    const isStandaloneOther = window.matchMedia('(display-mode: standalone)').matches;

    // Check if running in fullscreen mode
    const isFullscreen = window.matchMedia('(display-mode: fullscreen)').matches;

    // Check if running in minimal-ui mode
    const isMinimalUI = window.matchMedia('(display-mode: minimal-ui)').matches;

    setIsStandalone(isStandaloneIOS || isStandaloneOther || isFullscreen || isMinimalUI);
  }, []);

  return isStandalone;
}

/**
 * Hook to get the current app context based on pathname
 * @param pathname - current URL pathname
 * @returns app key (e.g., 'projects', 'counter', 'prayer')
 */
export function useAppContext(pathname: string): string {
  if (pathname.startsWith('/projects')) return 'projects';
  if (pathname.startsWith('/counter')) return 'counter';
  if (pathname.startsWith('/prayer')) return 'prayer';
  if (pathname.startsWith('/people-search')) return 'people-search';
  return 'default';
}
