import { useSession } from '@/components/SessionProvider';
import { useMemo } from 'react';

export type RsvpPermissionLevel = 'none' | 'view' | 'admin';

export interface RsvpPermissions {
  level: RsvpPermissionLevel;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canManageProjects: boolean;
  canManageEvents: boolean;
  canManageFiles: boolean;
  canManageCarousels: boolean;
  canManageConfirmationCards: boolean;
  loading: boolean;
}

/**
 * Hook to check RSVP-specific permissions for the current user
 *
 * Permission Levels:
 * - Admin: Full access (edit projects, events, upload/delete files, manage carousels)
 * - View: Read-only access
 * - None: No access
 *
 * Roles:
 * - "Administrators" (MP super admin) → Admin
 * - "RSVPs - Admin" → Admin
 * - "All Staff" → View
 */
export function useRsvpPermissions(): RsvpPermissions {
  const session = useSession();

  return useMemo(() => {
    // Not authenticated
    if (!session?.user?.email) {
      return {
        level: 'none',
        canView: false,
        canEdit: false,
        canDelete: false,
        canManageProjects: false,
        canManageEvents: false,
        canManageFiles: false,
        canManageCarousels: false,
        canManageConfirmationCards: false,
        loading: false,
      };
    }

    const userRoles = session.roles || [];

    // Check for admin access
    // Administrators (MP super admin) or "RSVPs - Admin" role
    const isAdmin =
      userRoles.includes('Administrators') ||
      userRoles.includes('RSVPs - Admin');

    if (isAdmin) {
      return {
        level: 'admin',
        canView: true,
        canEdit: true,
        canDelete: true,
        canManageProjects: true,
        canManageEvents: true,
        canManageFiles: true,
        canManageCarousels: true,
        canManageConfirmationCards: true,
        loading: false,
      };
    }

    // Check for view access (All Staff or any other role with app access)
    // If user has access to the app but is not admin, they're view-only
    const canView = userRoles.includes('All Staff');

    if (canView) {
      return {
        level: 'view',
        canView: true,
        canEdit: false,
        canDelete: false,
        canManageProjects: false,
        canManageEvents: false,
        canManageFiles: false,
        canManageCarousels: false,
        canManageConfirmationCards: false,
        loading: false,
      };
    }

    // No permissions
    return {
      level: 'none',
      canView: false,
      canEdit: false,
      canDelete: false,
      canManageProjects: false,
      canManageEvents: false,
      canManageFiles: false,
      canManageCarousels: false,
      canManageConfirmationCards: false,
      loading: false,
    };
  }, [session]);
}
