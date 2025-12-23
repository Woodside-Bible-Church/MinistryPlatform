# Skill: Implement Role-Based Permissions

## Overview
This skill guides you through implementing comprehensive role-based access control for Next.js apps that integrate with MinistryPlatform (MP) OAuth and use Neon PostgreSQL for application-level permissions.

## Architecture

### Permission Sources
1. **MinistryPlatform Roles**: Security Roles + User Groups (combined during OAuth)
2. **Neon app_permissions Table**: Application-specific permission overrides
3. **Special Rules**:
   - `Administrators` role always gets highest rights automatically
   - Implicit permissions for user-owned resources (e.g., "My Groups")

### Database Schema (Neon)

```sql
-- Applications table
CREATE TABLE applications (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  key VARCHAR(50) NOT NULL UNIQUE,  -- e.g., 'budgets', 'rsvp'
  description TEXT,
  route VARCHAR(255) NOT NULL,
  icon VARCHAR(50),
  is_active BOOLEAN DEFAULT true
);

-- App Permissions table
CREATE TABLE app_permissions (
  id SERIAL PRIMARY KEY,
  application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  user_email VARCHAR(255),           -- Optional: specific user
  role_name VARCHAR(255),             -- Optional: MP role/group name
  can_view BOOLEAN DEFAULT true,
  can_edit BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Implementation Steps

### 1. Add Permissions to Neon Database

**Add app_permissions rows** for your application:

```typescript
// Script: scripts/add-{app}-permissions.ts
import 'dotenv/config';
import { db, applications, appPermissions } from '../src/db';
import { eq } from 'drizzle-orm';

async function addAppPermissions() {
  // Find your app
  const app = await db
    .select()
    .from(applications)
    .where(eq(applications.key, 'your-app-key'))
    .limit(1);

  if (!app || app.length === 0) {
    console.error('App not found');
    process.exit(1);
  }

  const appId = app[0].id;

  // Add permission for a role
  await db.insert(appPermissions).values({
    applicationId: appId,
    roleName: 'Your Role Name',  // Exact MP role/group name
    canView: true,
    canEdit: true,
    canDelete: false,
  }).returning();

  console.log('✓ Permission added');
}

addAppPermissions();
```

**Run the script:**
```bash
npx tsx scripts/add-{app}-permissions.ts
```

### 2. Create Client-Side Permission Hook

**File:** `src/hooks/use{App}Permissions.ts`

```typescript
import { useSession } from '@/components/SessionProvider';
import { useMemo } from 'react';

export type {App}PermissionLevel = 'none' | 'view' | 'edit' | 'admin';

export interface {App}Permissions {
  level: {App}PermissionLevel;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  // Add app-specific permissions
  canManageSpecificFeature: boolean;
  loading: boolean;
}

/**
 * Hook to check {app}-specific permissions for the current user
 *
 * Permission Levels:
 * - Admin: Full access (Administrators, {App} - Admin)
 * - Edit: Can edit but not delete ({App} - Edit)
 * - View: Read-only access ({App} - View, All Staff)
 * - None: No access
 */
export function use{App}Permissions(): {App}Permissions {
  const session = useSession();

  return useMemo(() => {
    // Not authenticated
    if (!session?.user?.email) {
      return {
        level: 'none',
        canView: false,
        canEdit: false,
        canDelete: false,
        canManageSpecificFeature: false,
        loading: false,
      };
    }

    const userRoles = session.roles || [];

    // Administrators always get full access
    const isAdmin =
      userRoles.includes('Administrators') ||
      userRoles.includes('{App} - Admin');

    if (isAdmin) {
      return {
        level: 'admin',
        canView: true,
        canEdit: true,
        canDelete: true,
        canManageSpecificFeature: true,
        loading: false,
      };
    }

    // Edit level
    const canEdit = userRoles.includes('{App} - Edit');
    if (canEdit) {
      return {
        level: 'edit',
        canView: true,
        canEdit: true,
        canDelete: false,
        canManageSpecificFeature: true,
        loading: false,
      };
    }

    // View level (All Staff or specific view role)
    const canView = userRoles.includes('All Staff') || userRoles.includes('{App} - View');
    if (canView) {
      return {
        level: 'view',
        canView: true,
        canEdit: false,
        canDelete: false,
        canManageSpecificFeature: false,
        loading: false,
      };
    }

    // No permissions
    return {
      level: 'none',
      canView: false,
      canEdit: false,
      canDelete: false,
      canManageSpecificFeature: false,
      loading: false,
    };
  }, [session]);
}
```

### 3. Create Server-Side Permission Validator

**File:** `src/lib/mpAuth.ts` (add to existing file)

```typescript
import { auth } from "@/auth";
import { db } from "@/db";
import { applications, appPermissions } from "@/db/schema";
import { eq, or, and, inArray } from "drizzle-orm";

/**
 * Check if the current user has permission to access {App}
 *
 * @returns {hasAccess, roles, canEdit, canDelete}
 */
export async function check{App}AppAccess(): Promise<{
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

  // Find the app in Neon
  const app = await db.query.applications.findFirst({
    where: eq(applications.key, "{app-key}"),
  });

  if (!app) {
    console.error("{App} app not found in Neon database");
    return { hasAccess: false, roles: userRoles, canEdit: false, canDelete: false };
  }

  // Build permission query conditions
  const permissionConditions = [];

  // Check by role names
  if (userRoles.length > 0) {
    permissionConditions.push(
      and(
        eq(appPermissions.applicationId, app.id),
        inArray(appPermissions.roleName, userRoles)
      )
    );
  }

  // Check by email
  if (userEmail) {
    permissionConditions.push(
      and(
        eq(appPermissions.applicationId, app.id),
        eq(appPermissions.userEmail, userEmail)
      )
    );
  }

  if (permissionConditions.length === 0) {
    return { hasAccess: false, roles: userRoles, canEdit: false, canDelete: false };
  }

  // Query for app permissions
  const permissions = await db.query.appPermissions.findMany({
    where: or(...permissionConditions),
  });

  if (permissions.length === 0) {
    return { hasAccess: false, roles: userRoles, canEdit: false, canDelete: false };
  }

  // Determine highest permission level
  const canEdit = permissions.some(p => p.canEdit);
  const canDelete = permissions.some(p => p.canDelete);

  return {
    hasAccess: true,
    roles: userRoles,
    canEdit,
    canDelete,
  };
}
```

### 4. Protect API Routes

Apply permission checks to all API routes:

**Pattern for GET (view) routes:**
```typescript
export async function GET(request: Request) {
  // Check if user has access
  const { hasAccess } = await check{App}AppAccess();
  if (!hasAccess) {
    return NextResponse.json(
      { error: "Forbidden - You don't have permission to access the {App} app" },
      { status: 403 }
    );
  }

  // ... proceed with GET logic
}
```

**Pattern for PATCH/POST/PUT (edit) routes:**
```typescript
export async function PATCH(request: Request) {
  // Check if user has permission to edit
  const { hasAccess, canEdit } = await check{App}AppAccess();
  if (!hasAccess || !canEdit) {
    return NextResponse.json(
      { error: "Forbidden - You don't have permission to edit in the {App} app" },
      { status: 403 }
    );
  }

  // ... proceed with PATCH logic
}
```

**Pattern for DELETE routes:**
```typescript
export async function DELETE(request: Request) {
  // Check if user has permission to delete
  const { hasAccess, canDelete } = await check{App}AppAccess();
  if (!hasAccess || !canDelete) {
    return NextResponse.json(
      { error: "Forbidden - You don't have permission to delete in the {App} app" },
      { status: 403 }
    );
  }

  // ... proceed with DELETE logic
}
```

### 5. Enforce Permissions in UI

Use the permission hook to hide/disable UI elements:

```typescript
'use client';

import { use{App}Permissions } from '@/hooks/use{App}Permissions';

export default function YourPage() {
  const permissions = use{App}Permissions();

  return (
    <div>
      {/* Edit button - only show if user can edit */}
      {permissions.canEdit && (
        <button onClick={handleEdit}>
          Edit
        </button>
      )}

      {/* Delete button - only show if user can delete */}
      {permissions.canDelete && (
        <button onClick={handleDelete}>
          Delete
        </button>
      )}

      {/* Feature-specific permission */}
      {permissions.canManageSpecificFeature && (
        <button onClick={handleFeature}>
          Manage Feature
        </button>
      )}
    </div>
  );
}
```

### 6. Implementing Implicit Permissions

For user-owned resources (e.g., "My Groups"), check ownership before enforcing app-level permissions:

```typescript
export async function PATCH(request: Request, { params }) {
  const { hasAccess, canEdit } = await check{App}AppAccess();
  const session = await auth();

  // Get the resource
  const resource = await getResource(params.id);

  // Check if user owns this resource
  const isOwner = resource.createdBy === session.userId;

  // Allow if:
  // 1. User has app-level edit permission, OR
  // 2. User owns the resource (implicit permission)
  if (!hasAccess || (!canEdit && !isOwner)) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    );
  }

  // ... proceed
}
```

## Permission Hierarchy

1. **Administrators** - Always full access (bypasses database checks)
2. **App-specific Admin roles** - Full access via database
3. **App-specific Edit roles** - Edit but not delete
4. **App-specific View roles** - Read-only
5. **Implicit ownership** - User can edit their own resources
6. **No access** - Default if no matching permissions

## Testing Permissions

1. **Test as Administrator**: Should have full access
2. **Test as Admin role**: Should have full access
3. **Test as Edit role**: Should be able to edit but not delete
4. **Test as View role**: Should only see data, no edit buttons
5. **Test as non-member**: Should not have access to the app

## Common Patterns

### Updating Permissions
To change a role's permissions, update Neon directly or via script:

```typescript
await db.update(appPermissions)
  .set({ canEdit: true, canDelete: true })
  .where(and(
    eq(appPermissions.applicationId, appId),
    eq(appPermissions.roleName, 'Role Name')
  ));
```

### Adding User-Specific Permissions
Grant permissions to a specific user by email:

```typescript
await db.insert(appPermissions).values({
  applicationId: appId,
  userEmail: 'user@example.com',
  canView: true,
  canEdit: true,
  canDelete: false,
});
```

## Examples

- **Budgets App**: Full implementation at `src/hooks/useBudgetPermissions.ts` and `src/lib/mpAuth.ts`
- **RSVP App**: Full implementation at `src/hooks/useRsvpPermissions.ts` and API routes in `src/app/api/rsvp/`
- **Counter App**: Simpler implementation without granular edit/delete separation

## Notes

- Always validate permissions on both client and server
- Client-side checks are for UX (hiding buttons)
- Server-side checks are for security (enforcing access)
- Impersonation works automatically (Administrators only)
