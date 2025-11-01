# Database Migrations

This directory contains SQL migrations for the Apps platform.

## Public Apps Support

**File:** `add_public_apps_support.sql`

### What it does:
1. Adds `Requires_Authentication` column to `Applications` table (BIT, default = 1)
2. Marks Prayer app as public (Requires_Authentication = 0)

### How to apply:
Run the SQL script in MinistryPlatform's SQL Server Management Studio or via your database tool.

```sql
-- Run this script against your MinistryPlatform database
-- File: add_public_apps_support.sql
```

### How it works:

**Public Apps Flow:**
1. Apps marked with `Requires_Authentication = 0` can be viewed without login
2. The middleware checks this flag and allows access to the route
3. Within the app, certain actions (like submitting prayers) require authentication
4. When unauthenticated users try to perform authenticated actions, they're redirected to sign in
5. After signing in, users are redirected back to the app (callbackUrl)

**Example:**
- User visits `/prayer` without being logged in → **Allowed** (public app)
- User clicks "Submit Prayer Request" → Redirected to sign in → Returns to `/prayer` after login
- User swipes to pray for someone → Redirected to sign in → Returns to `/prayer` after login

### Making other apps public:

```sql
-- Mark an app as public
UPDATE Applications
SET Requires_Authentication = 0
WHERE Route = '/your-app-route';

-- Mark an app as protected (default)
UPDATE Applications
SET Requires_Authentication = 1
WHERE Route = '/your-app-route';
```

### Files modified for public apps feature:

1. **Middleware:** `src/middleware.ts`
   - Already has logic to query `Requires_Authentication` column
   - Allows access to routes where `Requires_Authentication = 0`

2. **Prayer Page:** `src/app/(app)/prayer/page.tsx`
   - Loads prayer data for all users (authenticated or not)
   - Hides stats and "My Requests" tab for unauthenticated users
   - Prompts for login when trying to submit or pray
   - Redirects back to `/prayer` after login

3. **Sign Out:** `src/components/UserMenu/UserMenu.tsx`
   - Redirects to current page instead of `/signin`
   - Public pages remain accessible after sign out

### Environment variables:

No additional environment variables are required! The middleware uses the existing `MINISTRY_PLATFORM_CLIENT_ID` and `MINISTRY_PLATFORM_CLIENT_SECRET` to obtain a service token via OAuth client credentials flow.

**How it works:**
1. Middleware uses client credentials grant to get a service access token
2. Token is cached for 55 minutes (refreshed automatically before expiry)
3. Service token is used to query the Applications table for public routes
4. Route cache is refreshed every minute

This follows OAuth best practices and doesn't require manually managing service account tokens.
