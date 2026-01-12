import { useSession } from '@/components/SessionProvider';
import { useMemo } from 'react';

export interface AnnouncementsPermissions {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canEditChurchWide: boolean;
  canDeleteChurchWide: boolean;
  canEditLabels: boolean;
  loading: boolean;
}

/**
 * Client-side hook for checking announcements permissions
 *
 * Permission Rules:
 * - Administrators: Full access to everything
 * - IT Team Group: Full access to everything (including labels and church-wide)
 * - Communications: Full access to everything (including labels and church-wide)
 * - All Staff: Can view/edit/delete campus-specific announcements only (no church-wide or labels)
 */
export function useAnnouncementsPermissions(): AnnouncementsPermissions {
  const session = useSession();

  return useMemo(() => {
    // Loading state
    if (!session) {
      return {
        canView: false,
        canEdit: false,
        canDelete: false,
        canEditChurchWide: false,
        canDeleteChurchWide: false,
        canEditLabels: false,
        loading: true,
      };
    }

    const userRoles = (session as any).roles || [];

    // Administrators have full access
    if (userRoles.includes('Administrators')) {
      return {
        canView: true,
        canEdit: true,
        canDelete: true,
        canEditChurchWide: true,
        canDeleteChurchWide: true,
        canEditLabels: true,
        loading: false,
      };
    }

    // IT Team Group has full access (including labels and church-wide)
    if (userRoles.includes('IT Team Group')) {
      return {
        canView: true,
        canEdit: true,
        canDelete: true,
        canEditChurchWide: true,
        canDeleteChurchWide: true,
        canEditLabels: true,
        loading: false,
      };
    }

    // Communications has full access (including labels and church-wide)
    if (userRoles.includes('Communications')) {
      return {
        canView: true,
        canEdit: true,
        canDelete: true,
        canEditChurchWide: true,
        canDeleteChurchWide: true,
        canEditLabels: true,
        loading: false,
      };
    }

    // All Staff can view/edit/delete campus-specific only (no church-wide or labels)
    if (userRoles.includes('All Staff')) {
      return {
        canView: true,
        canEdit: true,
        canDelete: true,
        canEditChurchWide: false,
        canDeleteChurchWide: false,
        canEditLabels: false,
        loading: false,
      };
    }

    // No permissions
    return {
      canView: false,
      canEdit: false,
      canDelete: false,
      canEditChurchWide: false,
      canDeleteChurchWide: false,
      canEditLabels: false,
      loading: false,
    };
  }, [session]);
}
