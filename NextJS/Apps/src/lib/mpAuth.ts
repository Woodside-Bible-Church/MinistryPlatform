/**
 * MinistryPlatform OAuth Helper
 * Provides reusable functions for authenticating with MinistryPlatform API
 */

import { auth } from "@/auth";
import { db } from "@/db";
import { applications, appPermissions } from "@/db/schema";
import { eq, or, and, inArray } from "drizzle-orm";

/**
 * Check if the current user has permission to access the Budget app
 * Dynamically fetches allowed roles from Neon instead of hardcoding
 * Users must be authenticated AND (have "Administrators" role OR have a role configured in Neon)
 *
 * @returns Promise<{hasAccess: boolean, roles: string[], canEdit: boolean, canDelete: boolean}> - Access status and permissions
 */
export async function checkBudgetAppAccess(): Promise<{
  hasAccess: boolean;
  roles: string[];
  canEdit: boolean;
  canDelete: boolean;
}> {
  const session = await auth();

  if (!session) {
    return { hasAccess: false, roles: [], canEdit: false, canDelete: false };
  }

  const userRoles = session.roles || [];
  const userEmail = session.user?.email;

  // Administrators always have full access
  if (userRoles.includes("Administrators")) {
    return {
      hasAccess: true,
      roles: userRoles,
      canEdit: true,
      canDelete: true,
    };
  }

  // Find the Budget app in Neon
  const budgetApp = await db.query.applications.findFirst({
    where: eq(applications.key, "budgets"),
  });

  if (!budgetApp) {
    console.error("Budget app not found in Neon database");
    return { hasAccess: false, roles: userRoles, canEdit: false, canDelete: false };
  }

  // Build permission query conditions
  const permissionConditions = [];

  // Check by role names if user has any roles
  if (userRoles.length > 0) {
    permissionConditions.push(
      and(
        eq(appPermissions.applicationId, budgetApp.id),
        inArray(appPermissions.roleName, userRoles)
      )
    );
  }

  // Check by email if user has an email
  if (userEmail) {
    permissionConditions.push(
      and(
        eq(appPermissions.applicationId, budgetApp.id),
        eq(appPermissions.userEmail, userEmail)
      )
    );
  }

  // If no conditions, user has no access
  if (permissionConditions.length === 0) {
    return { hasAccess: false, roles: userRoles, canEdit: false, canDelete: false };
  }

  // Query for Budget app permissions matching user's roles or email
  const budgetPermissions = await db.query.appPermissions.findMany({
    where: or(...permissionConditions),
  });

  if (budgetPermissions.length === 0) {
    return { hasAccess: false, roles: userRoles, canEdit: false, canDelete: false };
  }

  // Determine highest permission level
  const canEdit = budgetPermissions.some(p => p.canEdit);
  const canDelete = budgetPermissions.some(p => p.canDelete);

  return {
    hasAccess: true,
    roles: userRoles,
    canEdit,
    canDelete,
  };
}

/**
 * Get an OAuth access token using client credentials (app-level authentication)
 * This should be used for all MinistryPlatform API calls instead of user tokens
 *
 * @returns Promise<string> - The access token
 * @throws Error if authentication fails or environment variables are missing
 */
export async function getMPAccessToken(): Promise<string> {
  const baseUrl = process.env.MINISTRY_PLATFORM_BASE_URL;
  const clientId = process.env.MINISTRY_PLATFORM_CLIENT_ID;
  const clientSecret = process.env.MINISTRY_PLATFORM_CLIENT_SECRET;

  if (!baseUrl || !clientId || !clientSecret) {
    throw new Error('MinistryPlatform configuration missing');
  }

  const tokenResponse = await fetch(`${baseUrl}/oauth/connect/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'http://www.thinkministry.com/dataplatform/scopes/all',
    }),
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    console.error('Failed to get OAuth token:', errorText);
    throw new Error('Failed to authenticate with MinistryPlatform');
  }

  const { access_token } = await tokenResponse.json();
  return access_token;
}

/**
 * Get the MinistryPlatform base URL from environment
 *
 * @returns string - The base URL
 * @throws Error if environment variable is missing
 */
export function getMPBaseUrl(): string {
  const baseUrl = process.env.MINISTRY_PLATFORM_BASE_URL;

  if (!baseUrl) {
    throw new Error('MINISTRY_PLATFORM_BASE_URL environment variable is missing');
  }

  return baseUrl;
}
