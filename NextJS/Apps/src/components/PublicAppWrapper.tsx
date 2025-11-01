'use client';

import { ReactNode, createContext, useContext } from 'react';
import { useSession as useNextAuthSession } from 'next-auth/react';

/**
 * Context for public apps to check authentication status
 * This allows apps to provide different functionality for authenticated vs unauthenticated users
 */
interface PublicAppContextType {
  isAuthenticated: boolean;
  session: any | null;
  user: any | null;
}

const PublicAppContext = createContext<PublicAppContextType>({
  isAuthenticated: false,
  session: null,
  user: null,
});

/**
 * Hook to access authentication state in public apps
 *
 * @example
 * const { isAuthenticated, user } = usePublicAppAuth();
 *
 * if (isAuthenticated) {
 *   return <AuthenticatedView user={user} />;
 * }
 * return <PublicView />;
 */
export function usePublicAppAuth() {
  return useContext(PublicAppContext);
}

interface PublicAppWrapperProps {
  children: ReactNode;
  /**
   * Optional features configuration from database Public_Features JSON field
   */
  publicFeatures?: string | null;
}

/**
 * Wrapper component for public apps that support optional authentication
 *
 * Apps wrapped in this component can:
 * - Be accessed without authentication
 * - Provide enhanced features when user is authenticated
 * - Check auth status using usePublicAppAuth() hook
 *
 * @example
 * export default function PrayerApp() {
 *   return (
 *     <PublicAppWrapper>
 *       <PrayerContent />
 *     </PublicAppWrapper>
 *   );
 * }
 *
 * // In child component:
 * function PrayerContent() {
 *   const { isAuthenticated } = usePublicAppAuth();
 *
 *   return (
 *     <div>
 *       <PublicPrayerWall />
 *       {isAuthenticated && <MyPrayers />}
 *     </div>
 *   );
 * }
 */
export default function PublicAppWrapper({ children, publicFeatures }: PublicAppWrapperProps) {
  const session = useNextAuthSession();

  const contextValue: PublicAppContextType = {
    isAuthenticated: session.status === 'authenticated',
    session: session.data,
    user: session.data?.user || null,
  };

  return (
    <PublicAppContext.Provider value={contextValue}>
      {children}
    </PublicAppContext.Provider>
  );
}
