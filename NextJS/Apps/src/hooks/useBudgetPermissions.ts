import { useSession } from '@/components/SessionProvider';
import { useMemo } from 'react';

export type BudgetPermissionLevel = 'none' | 'view' | 'edit' | 'admin';

export interface BudgetPermissions {
  level: BudgetPermissionLevel;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canManageCategories: boolean;
  canManageLineItems: boolean;
  canApprovePurchaseRequests: boolean;
  canManagePurchaseRequests: boolean;
  canManageTransactions: boolean;
  loading: boolean;
}

/**
 * Hook to check budget-specific permissions for the current user
 *
 * Permission Levels:
 * - Admin: Full access (categories, line items, approve PRs, transactions)
 * - Edit: Can manage PRs and transactions, but cannot approve PRs or manage categories/line items
 * - View: Read-only access
 * - None: No access
 */
export function useBudgetPermissions(): BudgetPermissions {
  const session = useSession();

  return useMemo(() => {
    // Not authenticated
    if (!session?.user?.email) {
      return {
        level: 'none',
        canView: false,
        canEdit: false,
        canDelete: false,
        canManageCategories: false,
        canManageLineItems: false,
        canApprovePurchaseRequests: false,
        canManagePurchaseRequests: false,
        canManageTransactions: false,
        loading: false,
      };
    }

    const userRoles = session.roles || [];

    // Check for admin access
    // Administrators (MP super admin) or "Budgets - Admin" role
    const isAdmin =
      userRoles.includes('Administrators') ||
      userRoles.includes('Budgets - Admin');

    if (isAdmin) {
      return {
        level: 'admin',
        canView: true,
        canEdit: true,
        canDelete: true,
        canManageCategories: true,
        canManageLineItems: true,
        canApprovePurchaseRequests: true,
        canManagePurchaseRequests: true,
        canManageTransactions: true,
        loading: false,
      };
    }

    // Check for edit access
    const canEdit = userRoles.includes('Budgets - Edit');

    if (canEdit) {
      return {
        level: 'edit',
        canView: true,
        canEdit: true,
        canDelete: false,
        canManageCategories: false,
        canManageLineItems: false,
        canApprovePurchaseRequests: false,
        canManagePurchaseRequests: true,
        canManageTransactions: true,
        loading: false,
      };
    }

    // Check for view access
    const canView = userRoles.includes('Budgets - View');

    if (canView) {
      return {
        level: 'view',
        canView: true,
        canEdit: false,
        canDelete: false,
        canManageCategories: false,
        canManageLineItems: false,
        canApprovePurchaseRequests: false,
        canManagePurchaseRequests: false,
        canManageTransactions: false,
        loading: false,
      };
    }

    // No permissions
    return {
      level: 'none',
      canView: false,
      canEdit: false,
      canDelete: false,
      canManageCategories: false,
      canManageLineItems: false,
      canApprovePurchaseRequests: false,
      canManagePurchaseRequests: false,
      canManageTransactions: false,
      loading: false,
    };
  }, [session]);
}
