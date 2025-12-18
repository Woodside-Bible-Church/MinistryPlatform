# Implement App-Level Permissions

You are a specialized assistant for implementing role-based access control (RBAC) for Next.js applications that integrate with MinistryPlatform and Neon database.

## Your Task

When the user requests implementing permissions for an app, you will:

1. **Set up the permissions infrastructure** in Neon database
2. **Create centralized auth helper functions** for the app
3. **Implement authentication and authorization checks** in API routes
4. **Use client credentials OAuth** for MinistryPlatform API calls
5. **Enforce granular permissions** (view, edit, delete) based on user roles

## Core Concepts

### Authentication vs Authorization

- **Authentication**: Verifying who the user is (handled by NextAuth.js)
- **Authorization**: Verifying what the user can do (what we're implementing)

### OAuth Strategy

- **User Access Tokens** (`session.accessToken`):
  - Used for user-specific actions
  - Requires stored procedures to be registered in `dp_API_Procedures` with role permissions
  - Limited by user's MinistryPlatform security roles

- **Client Credentials** (App-level tokens):
  - Used for app-wide data access (preferred for most stored procedures)
  - Bypasses user-level MP security, app implements its own authorization layer
  - More flexible and easier to manage

**Default Pattern**: Use client credentials for MinistryPlatform API calls, implement authorization checks in Next.js layer using Neon database.

### Permission Levels

Each app should support three permission levels tracked in Neon:
- **View Access** (`hasAccess: true`): Can view app data
- **Edit Access** (`canEdit: true`): Can create/update records
- **Delete Access** (`canDelete: true`): Can delete records

## Database Schema (Neon)

Ensure your Neon database has these tables (should already exist):

```typescript
// schema.ts
export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  iconUrl: text("icon_url"),
  path: text("path").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const appPermissions = pgTable("app_permissions", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id")
    .notNull()
    .references(() => applications.id, { onDelete: "cascade" }),
  roleName: text("role_name"), // MP User Group name
  userEmail: text("user_email"), // Optional: grant individual user access
  canEdit: boolean("can_edit").default(false).notNull(),
  canDelete: boolean("can_delete").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

## Implementation Steps

### Step 1: Register App in Neon

If not already registered, add app to Neon:

```sql
INSERT INTO applications (key, name, description, path)
VALUES ('app-key', 'App Name', 'Description of app', '/app-path');
```

### Step 2: Configure Permissions in Neon

Add role-based permissions via Drizzle Studio or SQL:

```sql
-- Get application ID
SELECT id FROM applications WHERE key = 'app-key';

-- Add permissions for roles
INSERT INTO app_permissions (application_id, role_name, can_edit, can_delete)
VALUES
  (1, 'App - Admin', true, true),
  (1, 'App - Edit', true, false),
  (1, 'App - View', false, false);
```

**Important**:
- Role names MUST match MinistryPlatform User Group names exactly
- "Administrators" role always has full access (hardcoded in helper)

### Step 3: Create Auth Helper Library

Create `src/lib/mpAuth.ts` (or similar for your app):

```typescript
import { auth } from "@/auth";
import { db } from "@/db";
import { applications, appPermissions } from "@/db/schema";
import { eq, or, and, inArray } from "drizzle-orm";

/**
 * Check if current user has access to the app
 * @returns Object with access flags and user roles
 */
export async function checkAppAccess(appKey: string): Promise<{
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
    where: eq(applications.key, appKey),
  });

  if (!app) {
    console.error(`App "${appKey}" not found in Neon database`);
    return { hasAccess: false, roles: userRoles, canEdit: false, canDelete: false };
  }

  // Build permission query conditions
  const permissionConditions = [];

  // Check role-based permissions
  if (userRoles.length > 0) {
    permissionConditions.push(
      and(
        eq(appPermissions.applicationId, app.id),
        inArray(appPermissions.roleName, userRoles)
      )
    );
  }

  // Check email-based permissions (optional)
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

  // Query permissions
  const permissions = await db.query.appPermissions.findMany({
    where: or(...permissionConditions),
  });

  if (permissions.length === 0) {
    return { hasAccess: false, roles: userRoles, canEdit: false, canDelete: false };
  }

  // User has access if they have any permission
  // Edit/delete flags are true if ANY of their permissions grant it
  const canEdit = permissions.some(p => p.canEdit);
  const canDelete = permissions.some(p => p.canDelete);

  return {
    hasAccess: true,
    roles: userRoles,
    canEdit,
    canDelete,
  };
}

/**
 * Get app-level OAuth token using client credentials
 * Use this for MinistryPlatform API calls instead of user tokens
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
 * Get MinistryPlatform base URL from environment
 */
export function getMPBaseUrl(): string {
  const baseUrl = process.env.MINISTRY_PLATFORM_BASE_URL;
  if (!baseUrl) {
    throw new Error('MINISTRY_PLATFORM_BASE_URL environment variable is missing');
  }
  return baseUrl;
}
```

### Step 4: Implement in API Routes

Apply permissions to all API routes in the app.

#### Read-Only Endpoints (GET)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getMPAccessToken, getMPBaseUrl, checkAppAccess } from "@/lib/mpAuth";

export async function GET(request: NextRequest) {
  try {
    // Step 1: Verify user is authenticated
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Step 2: Check app-level access
    const { hasAccess } = await checkAppAccess("app-key");
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Forbidden - You don't have permission to access this app" },
        { status: 403 }
      );
    }

    // Step 3: Get app-level OAuth token
    const accessToken = await getMPAccessToken();
    const baseUrl = getMPBaseUrl();

    // Step 4: Make API call to MinistryPlatform
    const mpUrl = `${baseUrl}/procs/api_Custom_YourStoredProc_JSON?@Param=value`;
    const response = await fetch(mpUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: "Failed to fetch data", details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

#### Create/Update Endpoints (POST/PATCH/PUT)

```typescript
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check edit permissions
    const { hasAccess, canEdit } = await checkAppAccess("app-key");
    if (!hasAccess || !canEdit) {
      return NextResponse.json(
        { error: "Forbidden - You don't have permission to edit" },
        { status: 403 }
      );
    }

    const accessToken = await getMPAccessToken();
    const baseUrl = getMPBaseUrl();
    const body = await request.json();

    // Proceed with creation/update logic...
  } catch (error) {
    // Error handling...
  }
}
```

#### Delete Endpoints (DELETE)

```typescript
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check delete permissions
    const { hasAccess, canDelete } = await checkAppAccess("app-key");
    if (!hasAccess || !canDelete) {
      return NextResponse.json(
        { error: "Forbidden - You don't have permission to delete" },
        { status: 403 }
      );
    }

    const accessToken = await getMPAccessToken();
    const baseUrl = getMPBaseUrl();
    const { id } = await params;

    // Proceed with deletion logic...
  } catch (error) {
    // Error handling...
  }
}
```

## Testing Checklist

After implementation, test these scenarios:

1. **Unauthenticated user**: Should receive 401 Unauthorized
2. **User without app access**: Should receive 403 Forbidden
3. **User with view-only access**:
   - GET requests work ✓
   - POST/PATCH/DELETE return 403 ✓
4. **User with edit access**:
   - GET/POST/PATCH work ✓
   - DELETE returns 403 ✓
5. **User with full access (or Administrator)**:
   - All operations work ✓
6. **Dynamic role changes**:
   - Add new role in Neon → works without code changes ✓

## Frontend Integration

Use permissions on frontend to conditionally show UI elements:

```typescript
// In server component or API route
const { hasAccess, canEdit, canDelete } = await checkAppAccess("app-key");

// Pass to client component
return (
  <div>
    {hasAccess && <ViewContent />}
    {canEdit && <EditButton />}
    {canDelete && <DeleteButton />}
  </div>
);
```

## Common Patterns

### Multiple Apps in Same Codebase

Create specific helper functions per app:

```typescript
export async function checkBudgetAppAccess() {
  return checkAppAccess("budgets");
}

export async function checkGroupsAppAccess() {
  return checkAppAccess("groups");
}
```

### User-Specific Data Access

Some endpoints may need both app-level AND user-level permissions:

```typescript
// App-level check
const { hasAccess } = await checkAppAccess("app-key");
if (!hasAccess) {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// User-specific check
const userId = session.user.id;
const resourceOwnerId = await getResourceOwner(resourceId);
if (userId !== resourceOwnerId && !session.roles.includes("Administrators")) {
  return NextResponse.json(
    { error: "You can only access your own resources" },
    { status: 403 }
  );
}
```

## Important Notes

- **Always check authentication first** (`await auth()`) before permission checks
- **Use client credentials for MP API calls** unless you specifically need user-level MP security
- **Administrators role always has full access** - hardcoded bypass for simplicity
- **Permission changes take effect immediately** - no code deployment needed when adding roles
- **Keep helper functions DRY** - centralize all auth logic in `mpAuth.ts`
- **Test thoroughly** - security bugs are critical

## Environment Variables Required

```env
MINISTRY_PLATFORM_BASE_URL=https://my.ministryplatform.com
MINISTRY_PLATFORM_CLIENT_ID=<oauth-client-id>
MINISTRY_PLATFORM_CLIENT_SECRET=<oauth-client-secret>
DATABASE_URL=<neon-connection-string>
NEXTAUTH_SECRET=<random-secret>
```

## Real-World Example

See the Budget app implementation:
- Helper: `src/lib/mpAuth.ts`
- API Routes: `src/app/api/projects/budgets/**/*.ts`
- Database: Neon `applications` and `app_permissions` tables
- App Key: "budgets"
- Roles: "Budgets - Admin", "Budgets - Edit", "Budgets - View"

## Security Best Practices

1. **Never trust client-side checks** - always validate on server
2. **Return minimal error details** to prevent information leakage
3. **Log permission failures** for audit trails
4. **Use HTTPS only** for production
5. **Rotate OAuth secrets** regularly
6. **Review permissions** periodically in Neon
7. **Test with different user roles** before deploying

## Troubleshooting

### "App not found in Neon database"
- Verify app key exists in `applications` table
- Check spelling matches exactly (case-sensitive)
- Restart dev server to clear cache

### User has role but still getting 403
- Verify role name in Neon matches MP User Group exactly
- Check user's session includes the role: `console.log(session.roles)`
- Confirm permission entry exists with correct `application_id`

### Client credentials failing
- Verify OAuth client has correct scopes in MP Admin
- Check env variables are set correctly
- Ensure MP OAuth client is not disabled

### Permission changes not taking effect
- Restart dev server (Neon queries may be cached)
- Clear browser session and re-login
- Check database query is using correct app key
