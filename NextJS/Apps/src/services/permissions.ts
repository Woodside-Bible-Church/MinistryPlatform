import { auth } from "@/auth";

/**
 * Permission Service
 *
 * Checks if the current user has access to specific application features
 * based on their Ministry Platform roles and User Group memberships.
 *
 * Permission Hierarchy:
 * 1. MP "Administrators" role: Full access to all apps and features
 * 2. App-specific roles: Defined in Application_Roles and mapped to User Groups
 */

export interface AppRole {
  hasRole: boolean;
  isAdmin: boolean;
  userRoles: string[];
}

/**
 * Check if current user has a specific role for an application
 *
 * @param appKey - Application key (e.g., "counter", "budget")
 * @param roleKey - Role key to check (e.g., "admin", "counter", "viewer")
 * @returns Object with permission details
 */
export async function hasAppRole(
  appKey: string,
  roleKey: string
): Promise<AppRole> {
  const session = await auth();

  // Not authenticated
  if (!session?.user?.email) {
    return {
      hasRole: false,
      isAdmin: false,
      userRoles: [],
    };
  }

  // Check if user is MP Administrator (super admin)
  const isAdmin = session.roles?.includes("Administrators") || false;

  if (isAdmin) {
    return {
      hasRole: true,
      isAdmin: true,
      userRoles: session.roles || [],
    };
  }

  // For non-admins, check app-specific role via User Groups
  try {
    const baseUrl = process.env.MINISTRY_PLATFORM_BASE_URL;
    if (!baseUrl) {
      throw new Error("MINISTRY_PLATFORM_BASE_URL is not configured");
    }

    // Call stored procedure to check user's app roles
    const response = await fetch(
      `${baseUrl}/procs/api_Custom_Platform_CheckUserAppRole_JSON`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({
          "@UserName": session.user.email,
          "@ApplicationKey": appKey,
          "@RoleKey": roleKey,
          "@DomainID": 1,
        }),
      }
    );

    if (!response.ok) {
      console.error(
        `Permission check failed: ${response.status} ${response.statusText}`
      );
      return {
        hasRole: false,
        isAdmin: false,
        userRoles: [],
      };
    }

    const data = await response.json();

    // Parse MP stored proc JSON response
    let result: any = null;

    if (Array.isArray(data) && data.length > 0) {
      let firstItem = data[0];

      // Handle double-nested array
      if (Array.isArray(firstItem) && firstItem.length > 0) {
        firstItem = firstItem[0];
      }

      // Check if it's an object with a GUID key containing JSON string
      if (typeof firstItem === 'object' && !Array.isArray(firstItem)) {
        const jsonString = Object.values(firstItem)[0];

        if (typeof jsonString === 'string') {
          try {
            const parsed = JSON.parse(jsonString);
            result = Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : parsed;
          } catch (e) {
            console.error("Failed to parse permission check result:", e);
          }
        } else if (typeof jsonString === 'object') {
          result = jsonString;
        }
      }
    }

    return {
      hasRole: result?.HasRole === true || result?.HasRole === 1,
      isAdmin: false,
      userRoles: [],
    };

  } catch (error) {
    console.error("Error checking app role:", error);
    return {
      hasRole: false,
      isAdmin: false,
      userRoles: [],
    };
  }
}

/**
 * Check if current user has admin role for an application
 *
 * @param appKey - Application key (e.g., "counter", "budget")
 * @returns True if user is admin for this app or MP Administrator
 */
export async function isAppAdmin(appKey: string): Promise<boolean> {
  const result = await hasAppRole(appKey, "admin");
  return result.hasRole;
}

/**
 * Get current user's session with roles
 *
 * @returns Session object or null
 */
export async function getCurrentUser() {
  return await auth();
}

/**
 * Check if current user is MP Administrator (super admin)
 *
 * @returns True if user has Administrators role
 */
export async function isSuperAdmin(): Promise<boolean> {
  const session = await auth();
  return session?.roles?.includes("Administrators") || false;
}
