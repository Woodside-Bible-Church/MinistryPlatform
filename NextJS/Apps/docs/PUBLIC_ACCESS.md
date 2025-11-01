# Public Access for Applications

This feature allows applications to be accessible without authentication while providing enhanced functionality for authenticated users.

## Overview

By default, all applications in the platform require authentication. However, some applications (like a Prayer Wall) may benefit from public access with optional enhanced features for authenticated users.

## Architecture

### Database Schema

Two new fields have been added to the `Applications` table:

```sql
Requires_Authentication BIT NOT NULL DEFAULT(1)
  -- Whether the app requires sign-in (default: true)

Public_Features NVARCHAR(MAX) NULL
  -- Optional JSON configuration for public features
```

### Middleware Enhancement

The middleware now:
1. Checks if a route corresponds to a public app
2. Allows access without authentication for public apps
3. Caches public app routes for performance (1-minute TTL)
4. Falls back to standard authentication for non-public apps

### PublicAppWrapper Component

A wrapper component provides authentication context to public apps, allowing them to:
- Detect if a user is authenticated
- Provide different features based on auth status
- Access user information when available

## Configuration

### Making an App Public

#### 1. Run the Migration

Execute the migration script to add the required database fields:

```sql
-- Located at: database/migrations/001_add_public_access_support.sql
-- Run this in your MinistryPlatform database
```

#### 2. Configure the Application

Update the application record to mark it as public:

```sql
UPDATE Applications
SET Requires_Authentication = 0,
    Public_Features = '{"allowPublicView": true, "publicActions": ["view", "submit"], "authRequiredFor": ["edit", "delete", "admin"]}'
WHERE Application_Key = 'prayer';
```

#### 3. Set Service Account Token (Required)

The middleware needs to query MinistryPlatform to determine which apps are public. Add this environment variable:

```env
MINISTRY_PLATFORM_SERVICE_ACCOUNT_TOKEN=your_service_account_token_here
```

**How to get a service account token:**
1. Create a dedicated service account user in MinistryPlatform
2. Grant it read access to the Applications table
3. Use OAuth client credentials flow to get a token
4. Store the token in your environment variables

**Alternative:** For development, you can use a personal access token with appropriate permissions.

#### 4. Register New Stored Procedure

Register `api_Custom_Platform_GetPublicApplications_JSON` in MinistryPlatform:
- Navigate to: System Setup → API Procedures
- Add the procedure with appropriate security role access

## Implementation Guide

### Basic Public App

```typescript
// src/app/(app)/prayer/page.tsx
import PublicAppWrapper from '@/components/PublicAppWrapper';
import PrayerWall from '@/components/prayer/PrayerWall';

export default function PrayerApp() {
  return (
    <PublicAppWrapper>
      <div className="container mx-auto p-4">
        <h1>Prayer Wall</h1>
        <PrayerWall />
      </div>
    </PublicAppWrapper>
  );
}
```

### Conditional Features Based on Auth

```typescript
'use client';

import { usePublicAppAuth } from '@/components/PublicAppWrapper';
import PrayerWall from './PrayerWall';
import MyPrayers from './MyPrayers';
import PrayerSubmissionForm from './PrayerSubmissionForm';

export default function PrayerContent() {
  const { isAuthenticated, user } = usePublicAppAuth();

  return (
    <div className="space-y-6">
      {/* Public prayer wall - visible to everyone */}
      <section>
        <h2>Community Prayer Requests</h2>
        <PrayerWall />
      </section>

      {/* Authenticated-only features */}
      {isAuthenticated ? (
        <>
          <section>
            <h2>Submit a Prayer Request</h2>
            <PrayerSubmissionForm user={user} />
          </section>

          <section>
            <h2>My Prayer Requests</h2>
            <MyPrayers user={user} />
          </section>
        </>
      ) : (
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm">
            <a href="/signin" className="text-blue-600 underline">
              Sign in
            </a>{' '}
            to submit prayer requests and track your prayers.
          </p>
        </div>
      )}
    </div>
  );
}
```

### Using Public Features Configuration

The `Public_Features` JSON field can store app-specific configuration:

```typescript
import PublicAppWrapper, { usePublicAppAuth } from '@/components/PublicAppWrapper';

export default function PrayerApp({ publicFeatures }: { publicFeatures: string }) {
  return (
    <PublicAppWrapper publicFeatures={publicFeatures}>
      <PrayerContent />
    </PublicAppWrapper>
  );
}

function PrayerContent() {
  const { isAuthenticated } = usePublicAppAuth();

  // Parse public features config
  const config = JSON.parse(publicFeatures || '{}');
  const publicActions = config.publicActions || [];

  const canSubmit = isAuthenticated || publicActions.includes('submit');
  const canView = publicActions.includes('view');

  return (
    <div>
      {canView && <PrayerWall />}
      {canSubmit && <SubmitForm />}
    </div>
  );
}
```

## API Routes

### Public API Endpoints

API routes should also respect public/private app settings:

```typescript
// src/app/api/prayers/route.ts
import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Public endpoint - anyone can view approved prayers
  const prayers = await getPrayers({ approved: true });
  return NextResponse.json(prayers);
}

export async function POST(request: NextRequest) {
  // Check if app allows public submissions
  const appConfig = await getAppConfig('prayer');

  if (!appConfig.allowPublicSubmissions) {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const body = await request.json();
  const prayer = await createPrayer(body);
  return NextResponse.json(prayer);
}
```

## Security Considerations

### What to Expose Publicly

**Safe for public access:**
- Read-only views of approved/moderated content
- Public submission forms with moderation workflow
- Search/filter functionality on public data
- Statistics and aggregated data

**Require authentication:**
- Personal data (my prayers, my groups, etc.)
- Edit/delete operations on user's own content
- Admin/moderation actions
- Access to unapproved/private content

### Best Practices

1. **Default to Private**: Only make apps public when there's a clear use case
2. **Moderation**: Public submissions should require staff approval before display
3. **Rate Limiting**: Implement rate limiting on public endpoints
4. **Input Validation**: Extra validation on public forms to prevent abuse
5. **Minimal Data**: Public views should only show necessary, approved data

## Testing

### Test Public Access

1. Open an incognito/private browser window
2. Navigate to the public app route (e.g., `/prayer`)
3. Verify you can access the app without signing in
4. Verify public features work correctly
5. Verify auth-required features show sign-in prompts

### Test Authenticated Access

1. Sign in to your account
2. Navigate to the public app
3. Verify enhanced features are available
4. Verify you can perform authenticated actions

### Test Middleware Caching

The middleware caches public app routes for 1 minute. To test cache behavior:

1. Change an app from public to private in the database
2. Access should still be granted for up to 1 minute (cached)
3. After 1 minute, access should require authentication

## Troubleshooting

### Public App Requires Sign-In

**Check:**
1. `Requires_Authentication` is set to `0` (false) in database
2. `Is_Active` is set to `1` (true)
3. `MINISTRY_PLATFORM_SERVICE_ACCOUNT_TOKEN` is configured correctly
4. Service account has read access to Applications table
5. Check middleware console logs for errors

### Middleware Not Loading Public Apps

**Check:**
1. Environment variable `MINISTRY_PLATFORM_BASE_URL` is set
2. Service account token is valid and not expired
3. Network connectivity to MinistryPlatform API
4. Console for fetch errors in middleware

### Session Not Available in Public App

The `usePublicAppAuth()` hook uses NextAuth's `useSession()` under the hood. Make sure:
1. App is wrapped in `<PublicAppWrapper>`
2. SessionProvider is in the root layout
3. NextAuth is configured correctly

## Migration from Widget to Platform App

If you're migrating a standalone widget (like the Prayer Widget) to the Apps platform:

### 1. Copy Components

```bash
# Copy prayer components to Apps platform
cp -r Widgets/Prayer/src/components/prayer Apps/src/components/
```

### 2. Create App Route

```typescript
// Apps/src/app/(app)/prayer/page.tsx
import PublicAppWrapper from '@/components/PublicAppWrapper';
import PrayerContent from '@/components/prayer/PrayerContent';

export default function PrayerApp() {
  return (
    <PublicAppWrapper>
      <PrayerContent />
    </PublicAppWrapper>
  );
}
```

### 3. Update Auth Logic

Replace MP Widget auth with `usePublicAppAuth()`:

```typescript
// Before (MP Widget):
import { useMPWidgetAuth } from '@/lib/mpWidgetAuth';
const { isAuthenticated, token } = useMPWidgetAuth();

// After (Platform):
import { usePublicAppAuth } from '@/components/PublicAppWrapper';
const { isAuthenticated, session } = usePublicAppAuth();
```

### 4. Update API Routes

Move API routes from widget to platform and update auth checks.

### 5. Add to Database

```sql
INSERT INTO Applications
  (Application_Name, Application_Key, Description, Icon, Route, Sort_Order, Requires_Authentication)
VALUES
  ('Prayer', 'prayer', 'Submit prayer requests and pray for others', 'Heart', '/prayer', 3, 0);
```

## Example: Prayer Widget Migration

The Prayer Widget is the first test case for public access. It provides:

**Public Features:**
- View approved community prayer requests
- Swipe/tap to mark prayers as prayed for (anonymous)
- Search and filter prayers

**Authenticated Features:**
- Submit new prayer requests
- View "My Prayers" dashboard
- Edit/delete own prayers
- Add updates/testimonies to prayers
- Mark prayers as answered
- Prayer statistics and streak tracking

See implementation at: `src/app/(app)/prayer/`

## Future Enhancements

Potential improvements for the public access system:

1. **Per-Route Permissions**: Allow fine-grained control (e.g., `/prayer/view` public, `/prayer/submit` requires auth)
2. **Public User Tracking**: Optional anonymous user tracking for analytics
3. **Rate Limiting**: Built-in rate limiting for public endpoints
4. **Public App Analytics**: Track usage metrics for public apps
5. **Progressive Enhancement**: Lazy-load authenticated features
6. **Public App Templates**: Starter templates for common public app patterns

## Related Documentation

- [Application Registration](../database/README.md)
- [Authentication System](../README.md#authentication)
- [Middleware Configuration](../src/middleware.ts)
- [Public App Wrapper](../src/components/PublicAppWrapper.tsx)
