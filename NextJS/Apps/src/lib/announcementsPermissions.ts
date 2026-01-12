import { Session } from 'next-auth';

export interface AnnouncementsPermissions {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canEditChurchWide: boolean;
  canDeleteChurchWide: boolean;
  canEditLabels: boolean;
}

/**
 * Server-side permission checker for announcements operations
 *
 * Permission Rules:
 * - Administrators: Full access to everything
 * - IT Team Group: Full access to everything (including labels and church-wide)
 * - Communications: Full access to everything (including labels and church-wide)
 * - All Staff: Can view/edit/delete campus-specific announcements only (no church-wide or labels)
 */
export function checkAnnouncementsPermissions(session: Session | null): AnnouncementsPermissions {
  // Not authenticated
  if (!session?.user?.email) {
    return {
      canView: false,
      canEdit: false,
      canDelete: false,
      canEditChurchWide: false,
      canDeleteChurchWide: false,
      canEditLabels: false,
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
  };
}
