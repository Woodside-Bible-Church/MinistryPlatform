# MinistryPlatform Database Setup

This folder contains SQL scripts for setting up the Ministry Applications Platform in MinistryPlatform.

## Files

- **platform-schema.sql** - Creates platform tables, Counter app procedures, and access control system
- **schema/application-roles.sql** - Creates role-based permission tables and seeds Counter app roles
- **procs/api_Custom_Platform_CheckUserAppRole.sql** - Permission checking stored procedure

## Overview

The platform uses MinistryPlatform's User_Groups system for access control:
- **Applications** table - Defines available apps (Counter, etc.)
- **Application_User_Groups** table - Links User_Groups to Applications
- **User_Groups** (existing MP table) - Groups that can be granted app access
- **User_User_Groups** (existing MP table) - Links users to groups

### Role-Based Permissions (NEW)

In addition to app-level access control, the platform now supports **app-specific roles** for granular feature permissions:

- **Application_Roles** table - Defines role types for each application (admin, counter, viewer, etc.)
- **Application_Role_User_Groups** table - Maps roles to User Groups for bulk management
- **Super Admin**: Users with MP "Administrators" role automatically have full access to all apps and features
- **Permission Hierarchy**: MP Administrators > App-specific roles

This allows you to:
1. Grant different permission levels within the same app (e.g., Counter admin vs Counter user)
2. Manage permissions in bulk through User Groups
3. Create custom roles per application based on your needs

See the **Role-Based Permission System** section below for detailed setup instructions.

## Installation Instructions

### 1. Run the SQL Script

```sql
-- Open SQL Server Management Studio (SSMS)
-- Connect to your MinistryPlatform database server
-- Open platform-schema.sql and execute
```

### 2. Set Up Access Control

After running the script, you'll need to create User Groups and grant access:

```sql
-- Example: Create a User Group for Counter app users
-- (You can also do this in the MP Admin interface)

-- 1. Create or identify a User Group
-- For example: "Counter App Users" (User_Group_ID = 123)

-- 2. Grant that group access to the Counter application
INSERT INTO Application_User_Groups (Application_ID, User_Group_ID)
SELECT Application_ID, 123  -- Replace 123 with your User_Group_ID
FROM Applications
WHERE Application_Key = 'counter';

-- 3. Add users to the group via MP Admin interface or:
-- INSERT INTO dp_User_User_Groups (User_Group_ID, User_ID, Domain_ID)
-- VALUES (123, [User_ID], 1);
```

### 3. Grant API Permissions

```sql
-- Replace 'YourAPIUser' with your actual MP API user
GRANT EXECUTE ON api_Custom_Platform_GetUserApplications_JSON TO YourAPIUser;
GRANT EXECUTE ON api_Custom_Platform_CheckUserAccess_JSON TO YourAPIUser;
GRANT EXECUTE ON api_Custom_Counter_GetActiveCongregations_JSON TO YourAPIUser;
GRANT EXECUTE ON api_Custom_Counter_GetEventsByDate_JSON TO YourAPIUser;
GRANT EXECUTE ON api_Custom_Counter_GetMetrics_JSON TO YourAPIUser;
GRANT EXECUTE ON api_Custom_Counter_GetEventMetrics_JSON TO YourAPIUser;
```

### 4. Register API Procedures

If not auto-registered, add these procedures in MP Admin → System Setup → API Procedures:
- `api_Custom_Platform_GetUserApplications_JSON`
- `api_Custom_Platform_CheckUserAccess_JSON`
- `api_Custom_Counter_GetActiveCongregations_JSON`
- `api_Custom_Counter_GetEventsByDate_JSON`
- `api_Custom_Counter_GetMetrics_JSON`
- `api_Custom_Counter_GetEventMetrics_JSON`

### 5. Test the Setup

```sql
-- Test getting applications for a user (replace ContactID)
EXEC api_Custom_Platform_GetUserApplications_JSON @ContactID = 123;

-- Test checking access (replace ContactID)
EXEC api_Custom_Platform_CheckUserAccess_JSON
    @ContactID = 123,
    @ApplicationKey = 'counter';

-- Test Counter app procedures
EXEC api_Custom_Counter_GetActiveCongregations_JSON;

EXEC api_Custom_Counter_GetMetrics_JSON;

EXEC api_Custom_Counter_GetEventsByDate_JSON
    @EventDate = '2025-10-28',
    @CongregationID = 1;
```

## Database Schema

### Platform Tables

#### Applications
Defines all available applications in the platform.

| Column | Type | Description |
|--------|------|-------------|
| Application_ID | int | Primary key |
| Application_Name | nvarchar(50) | Display name |
| Application_Key | nvarchar(50) | URL-friendly key (unique) |
| Description | nvarchar(500) | Description |
| Icon | nvarchar(50) | Icon name for UI |
| Route | nvarchar(100) | URL route |
| Is_Active | bit | Whether app is enabled |
| Sort_Order | int | Display order |
| Domain_ID | int | FK to dp_Domains |

#### Application_User_Groups
Links User Groups to Applications for access control.

| Column | Type | Description |
|--------|------|-------------|
| Application_User_Group_ID | int | Primary key |
| Application_ID | int | FK to Applications |
| User_Group_ID | int | FK to dp_User_Groups |

### Stored Procedures

#### Platform Procedures

**api_Custom_Platform_GetUserApplications_JSON**
- **Purpose**: Get all applications a user has access to
- **Parameters**: `@ContactID` (INT)
- **Returns**: Nested JSON array of applications

**api_Custom_Platform_CheckUserAccess_JSON**
- **Purpose**: Check if user has access to specific application
- **Parameters**:
  - `@ContactID` (INT)
  - `@ApplicationKey` (NVARCHAR(50))
- **Returns**: JSON object with `Has_Access` boolean

#### Counter App Procedures

**api_Custom_Counter_GetActiveCongregations_JSON**
- **Purpose**: Get all active campuses
- **Returns**: Nested JSON array of congregations

**api_Custom_Counter_GetEventsByDate_JSON**
- **Purpose**: Get events for a date/campus with nested metrics
- **Parameters**:
  - `@EventDate` (DATE)
  - `@CongregationID` (INT)
- **Returns**: Nested JSON with events and their metrics

**api_Custom_Counter_GetMetrics_JSON**
- **Purpose**: Get all available metric types
- **Returns**: Nested JSON array of metrics

**api_Custom_Counter_GetEventMetrics_JSON**
- **Purpose**: Get all metrics for a specific event
- **Parameters**: `@EventID` (INT)
- **Returns**: Nested JSON array of metrics with details

## Access Control Flow

1. **User logs in** → Gets Contact_ID from session
2. **App checks access** → Calls `api_Custom_Platform_GetUserApplications_JSON`
3. **Returns apps** → Only apps the user's groups have access to
4. **User navigates to app** → App calls `api_Custom_Platform_CheckUserAccess_JSON` to verify
5. **Access granted/denied** → Based on User_Group membership

## Adding New Applications

```sql
-- 1. Add the application
INSERT INTO Applications
    (Application_Name, Application_Key, Description, Icon, Route, Sort_Order)
VALUES
    ('My New App', 'my-app', 'Description here', 'Icon', '/my-app', 2);

-- 2. Create or identify a User Group for this app

-- 3. Grant group access
INSERT INTO Application_User_Groups (Application_ID, User_Group_ID)
SELECT Application_ID, [Your_User_Group_ID]
FROM Applications
WHERE Application_Key = 'my-app';

-- 4. Add users to the group via MP Admin
```

## Notes

- **Event_Metrics** and **Metrics** tables must already exist in your MP database
- All stored procedures return JSON using `FOR JSON PATH`
- Procedures use `_JSON` suffix for consistency with MP conventions
- User_Groups system integrates with existing MP security
- **Auditing**: Custom tables don't include Created_Date/Modified_Date columns - MinistryPlatform's `dp_Audit_Log` table and API handle auditing automatically
- **Data submission**: Use direct table POST via MP API for Event_Metrics - the API handles permissions and auditing automatically

## Troubleshooting

### No applications showing for user
1. Check user is in a User_Group: `SELECT * FROM dp_User_User_Groups WHERE User_ID = ?`
2. Check group has app access: `SELECT * FROM Application_User_Groups WHERE User_Group_ID = ?`
3. Check application is active: `SELECT * FROM Applications WHERE Is_Active = 1`

### API procedures not working
1. Verify procedures are registered in `dp_API_Procedures`
2. Check API user has EXECUTE permissions
3. Verify procedures are assigned to correct security roles

### JSON not returning
- Make sure you're using the procedures with `_JSON` suffix
- Check SQL Server version supports `FOR JSON PATH` (2016+)

---

## Role-Based Permission System

### Architecture

The role-based permission system enables app-specific permission levels using Ministry Platform's User Groups:

```
MP Administrators Role (OAuth)
    └─> Full access to all apps (bypasses all checks)

User Groups (MP Admin)
    └─> Application_Role_User_Groups (mapping)
        └─> Application_Roles (app-specific roles)
            └─> Applications (individual apps)
```

### Database Tables

#### Application_Roles
Defines role types available within each application.

| Column | Type | Description |
|--------|------|-------------|
| Application_Role_ID | int | Primary key |
| Application_ID | int | FK to Applications |
| Role_Key | nvarchar(50) | Machine-readable key ("admin", "counter") |
| Role_Name | nvarchar(100) | Human-readable name ("Administrator", "Counter") |
| Role_Description | nvarchar(500) | What users with this role can do |
| Sort_Order | int | Display order in UI |
| Domain_ID | int | FK to dp_Domains |

#### Application_Role_User_Groups
Maps application roles to Ministry Platform User Groups.

| Column | Type | Description |
|--------|------|-------------|
| Application_Role_User_Group_ID | int | Primary key |
| Application_Role_ID | int | FK to Application_Roles |
| User_Group_ID | int | FK to dp_User_Groups |
| Start_Date | datetime | When role assignment becomes active |
| End_Date | datetime | When role expires (NULL = never) |
| Domain_ID | int | FK to dp_Domains |

### Setup Instructions

#### 1. Create Role Tables

```sql
-- Run schema/application-roles.sql
-- This creates the tables and seeds Counter app with "admin" and "counter" roles
```

#### 2. Create Permission Check Stored Procedure

```sql
-- Run procs/api_Custom_Platform_CheckUserAppRole.sql
-- This creates the permission checking procedure
```

#### 3. Register API Procedure

In MP Admin Console:
1. Go to **Administration > API Procedures**
2. Click **Create New**
3. Add: `api_Custom_Platform_CheckUserAppRole_JSON`
4. Set permissions (allow authenticated users)

#### 4. Create User Groups for Each Role

In MP Admin:
1. Go to **Administration > User Groups**
2. Create groups following the naming convention: `[App Name] - [Role Name]`

**Example for Counter App:**
- "Counter - Administrators" (for admin role)
- "Counter - Counters" (for counter role)

**Example for Budget App:**
- "Budget - Budget Admins"
- "Budget - Budget Creators"
- "Budget - Purchasers"
- "Budget - Viewers"

#### 5. Map User Groups to Roles

```sql
-- Example: Map Counter groups to roles

DECLARE @CounterAppID INT;
DECLARE @AdminRoleID INT;
DECLARE @CounterRoleID INT;
DECLARE @AdminGroupID INT;
DECLARE @CounterGroupID INT;

-- Find Counter app
SELECT @CounterAppID = Application_ID
FROM Applications
WHERE Application_Key = 'counter';

-- Find roles
SELECT @AdminRoleID = Application_Role_ID
FROM Application_Roles
WHERE Application_ID = @CounterAppID AND Role_Key = 'admin';

SELECT @CounterRoleID = Application_Role_ID
FROM Application_Roles
WHERE Application_ID = @CounterAppID AND Role_Key = 'counter';

-- Find User Groups
SELECT @AdminGroupID = User_Group_ID
FROM dp_User_Groups
WHERE User_Group_Name = 'Counter - Administrators';

SELECT @CounterGroupID = User_Group_ID
FROM dp_User_Groups
WHERE User_Group_Name = 'Counter - Counters';

-- Create mappings
INSERT INTO Application_Role_User_Groups (Application_Role_ID, User_Group_ID)
VALUES (@AdminRoleID, @AdminGroupID);

INSERT INTO Application_Role_User_Groups (Application_Role_ID, User_Group_ID)
VALUES (@CounterRoleID, @CounterGroupID);
```

#### 6. Add Users to Groups

In MP Admin:
1. Go to **Administration > Users**
2. Edit a user
3. Click **User Groups** tab
4. Add user to appropriate groups

### Usage in Next.js Code

The permission service (`src/services/permissions.ts`) provides helper functions for checking permissions:

#### Server Components

```typescript
import { hasAppRole, isAppAdmin, isSuperAdmin } from "@/services/permissions";

export default async function CounterPage() {
  // Check specific role
  const { hasRole: isAdmin } = await hasAppRole("counter", "admin");
  const { hasRole: isCounter } = await hasAppRole("counter", "counter");

  return (
    <div>
      {isAdmin && (
        <section>
          <h2>Analytics Dashboard</h2>
          {/* Admin-only features */}
        </section>
      )}

      {(isAdmin || isCounter) && (
        <section>
          <h2>Enter Metrics</h2>
          {/* Counter form */}
        </section>
      )}
    </div>
  );
}
```

#### API Routes

```typescript
import { hasAppRole } from "@/services/permissions";
import { NextResponse } from "next/server";

export async function GET() {
  const { hasRole } = await hasAppRole("counter", "admin");

  if (!hasRole) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Return admin data...
}
```

#### Helper Functions

```typescript
// Check specific app role
const { hasRole, isAdmin } = await hasAppRole("counter", "admin");

// Shorthand to check admin role
const isCounterAdmin = await isAppAdmin("counter");

// Check if MP super admin
const isMPAdmin = await isSuperAdmin();
```

### Permission Hierarchy

1. **MP Administrators** (from OAuth `roles` claim)
   - Automatically have full access to all apps and features
   - Bypass all app-specific permission checks
   - Identified by `session.roles?.includes("Administrators")`

2. **App-specific roles** (from User Groups)
   - Defined per application
   - Checked via User Group memberships
   - Can be time-bound with Start/End dates

### Testing Permissions

#### Test Super Admin

```sql
-- 1. Ensure user has "Administrators" security role in MP
-- 2. Log in to app
-- 3. All apps and features should be visible
```

#### Test App-Specific Roles

```sql
-- 1. Remove user from "Administrators" security role
-- 2. Add user to "Counter - Administrators" User Group
-- 3. Log in and verify:
--    - Counter app is accessible
--    - Admin features are visible in Counter
-- 4. Move user to "Counter - Counters" group
-- 5. Verify:
--    - Counter app still accessible
--    - Admin features are hidden
--    - Counter features are visible
```

#### Test Stored Procedure

```sql
-- Direct procedure test
EXEC api_Custom_Platform_CheckUserAppRole_JSON
    @UserName = 'user@woodsidebible.org',
    @ApplicationKey = 'counter',
    @RoleKey = 'admin',
    @DomainID = 1;

-- Should return:
-- { "HasRole": true } or { "HasRole": false }
```

### Adding Roles to New Applications

#### 1. Define Roles

```sql
DECLARE @YourAppID INT;
SELECT @YourAppID = Application_ID FROM Applications WHERE Application_Key = 'your-app';

-- Create admin role
INSERT INTO Application_Roles (Application_ID, Role_Key, Role_Name, Role_Description, Sort_Order)
VALUES (@YourAppID, 'admin', 'Administrator', 'Full access to all features', 1);

-- Create additional roles
INSERT INTO Application_Roles (Application_ID, Role_Key, Role_Name, Role_Description, Sort_Order)
VALUES (@YourAppID, 'viewer', 'Viewer', 'Read-only access', 2);
```

#### 2. Create User Groups

In MP Admin, create groups:
- "YourApp - Administrators"
- "YourApp - Viewers"

#### 3. Map Groups to Roles

```sql
INSERT INTO Application_Role_User_Groups (Application_Role_ID, User_Group_ID)
SELECT ar.Application_Role_ID, ug.User_Group_ID
FROM Application_Roles ar
CROSS JOIN dp_User_Groups ug
WHERE ar.Role_Key = 'admin'
  AND ar.Application_ID = @YourAppID
  AND ug.User_Group_Name = 'YourApp - Administrators';
```

#### 4. Use in Code

```typescript
const { hasRole } = await hasAppRole("your-app", "admin");
```

### Troubleshooting Permissions

#### User Can't See App Features

1. **Check User Group membership:**
```sql
SELECT ug.User_Group_Name, uug.End_Date
FROM dp_User_User_Groups uug
INNER JOIN dp_User_Groups ug ON uug.User_Group_ID = ug.User_Group_ID
INNER JOIN dp_Users u ON uug.User_ID = u.Contact_ID
WHERE u.User_Name = 'user@woodsidebible.org';
```

2. **Check User Group to Role mapping:**
```sql
SELECT ar.Role_Name, ug.User_Group_Name, arug.End_Date
FROM Application_Role_User_Groups arug
INNER JOIN Application_Roles ar ON arug.Application_Role_ID = ar.Application_Role_ID
INNER JOIN dp_User_Groups ug ON arug.User_Group_ID = ug.User_Group_ID
INNER JOIN Applications a ON ar.Application_ID = a.Application_ID
WHERE a.Application_Key = 'counter';
```

3. **Check if roles exist:**
```sql
SELECT ar.*, a.Application_Name
FROM Application_Roles ar
INNER JOIN Applications a ON ar.Application_ID = a.Application_ID
WHERE a.Application_Key = 'counter';
```

#### Permission Check Returns False for Admin

1. Verify user has "Administrators" in OAuth roles claim
2. Check browser console: `console.log(session.roles)`
3. Verify stored procedure is registered in MP Admin

### Security Notes

- MP "Administrators" role bypasses all checks - assign carefully
- User Group memberships are evaluated at permission check time
- Permission checks happen server-side for security
- Never expose permission checks to client-side only
- Token expiration is handled automatically by NextAuth
