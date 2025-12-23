# Skill: Pass $userID to MinistryPlatform for Auditing

## Overview
When creating or updating records in MinistryPlatform (MP), you should pass the `$userID` query parameter to enable proper auditing. This ensures that MP's audit trail correctly attributes changes to the user who made them, rather than the OAuth client application.

## Why This Matters

MinistryPlatform tracks who created/modified records in audit fields:
- `_Record_Creation_User` / `_Audit_User_ID_Table_Created_By`
- `_Record_Last_Modified_User` / `_Audit_User_ID_Table_Modified_By`

Without `$userID`, all changes appear to come from the OAuth client (the app itself), making it impossible to track which actual user made changes.

## Architecture

### Session Structure
NextAuth.js v5 session includes:
- `user.id`: User GUID (UUID) from MinistryPlatform
- `userId`: User_ID (integer) from dp_Users table - **THIS is what we pass to MP**

### Utility Function
**File:** `src/utils/auth.ts`

```typescript
import { auth } from "@/auth";

/**
 * Get the currently authenticated user's User_ID from the session
 * This should be used in API routes to pass to MinistryPlatform's $userID parameter for auditing
 *
 * @returns User_ID as a number, or null if not authenticated
 */
export async function getUserIdFromSession(): Promise<number | null> {
  const session = await auth();

  if (!session?.userId) {
    return null;
  }

  // session.userId is stored as a string, convert to number
  const userId = parseInt(session.userId, 10);

  if (isNaN(userId)) {
    console.error('Invalid userId in session:', session.userId);
    return null;
  }

  return userId;
}
```

## Implementation Patterns

### Pattern 1: POST (Create Records)

```typescript
import { getUserIdFromSession } from "@/utils/auth";
import { MinistryPlatformClient } from "@/providers/MinistryPlatform/core/ministryPlatformClient";

export async function POST(request: Request) {
  try {
    // Get User_ID for auditing
    const userId = await getUserIdFromSession();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized - No valid session" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const mp = new MinistryPlatformClient();
    await mp.ensureValidToken();

    // Create record with $userId
    const result = await mp.post(
      '/tables/YourTable',
      [{ ...body }],  // Record data
      { $userId: userId }  // Pass userId as query parameter
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error creating record:", error);
    return NextResponse.json(
      { error: "Failed to create record" },
      { status: 500 }
    );
  }
}
```

### Pattern 2: PATCH/PUT (Update Records)

```typescript
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const recordId = parseInt(id, 10);

    // Get User_ID for auditing
    const userId = await getUserIdFromSession();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized - No valid session" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const mp = new MinistryPlatformClient();
    await mp.ensureValidToken();

    // Update record with $userId
    await mp.put(
      '/tables/YourTable',
      [{
        YourTable_ID: recordId,  // MUST include primary key
        ...body
      }],
      { $userId: userId }  // Pass userId as query parameter
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating record:", error);
    return NextResponse.json(
      { error: "Failed to update record" },
      { status: 500 }
    );
  }
}
```

### Pattern 3: DELETE (Delete Records)

```typescript
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const recordId = parseInt(id, 10);

    // Get User_ID for auditing
    const userId = await getUserIdFromSession();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized - No valid session" },
        { status: 401 }
      );
    }

    const mp = new MinistryPlatformClient();
    await mp.ensureValidToken();

    // Delete record with $userId
    await mp.delete(
      `/tables/YourTable/${recordId}`,
      { $userId: userId }  // Pass userId as query parameter
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting record:", error);
    return NextResponse.json(
      { error: "Failed to delete record" },
      { status: 500 }
    );
  }
}
```

### Pattern 4: Using TableService

The `TableService` class methods support `$userId` in their options parameter:

```typescript
import { TableService } from "@/providers/MinistryPlatform/services/tableService";
import { getUserIdFromSession } from "@/utils/auth";

export async function POST(request: Request) {
  const userId = await getUserIdFromSession();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const mp = new MinistryPlatformClient();
  await mp.ensureValidToken();
  const tableService = new TableService(mp);

  const body = await request.json();

  // Create records
  const result = await tableService.createTableRecords(
    "YourTable",
    [{ ...body }],
    { $userId: userId }  // Pass in options
  );

  return NextResponse.json(result);
}
```

**Update with TableService:**
```typescript
await tableService.updateTableRecords(
  "YourTable",
  [{
    YourTable_ID: recordId,
    ...updates
  }],
  { $userId: userId }
);
```

**Delete with TableService:**
```typescript
await tableService.deleteTableRecords(
  "YourTable",
  [recordId1, recordId2],  // Array of IDs to delete
  { $userId: userId }
);
```

## Common Mistakes to Avoid

### ❌ Mistake 1: Forgetting to Check for userId
```typescript
// BAD: No check if userId is null
const userId = await getUserIdFromSession();
await mp.post('/tables/YourTable', [data], { $userId: userId });
```

### ✅ Correct:
```typescript
const userId = await getUserIdFromSession();
if (!userId) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
await mp.post('/tables/YourTable', [data], { $userId: userId });
```

### ❌ Mistake 2: Using session.user.id instead of session.userId
```typescript
// BAD: session.user.id is the GUID, not User_ID
const session = await auth();
await mp.post('/tables/YourTable', [data], { $userId: session.user.id });
```

### ✅ Correct:
```typescript
const userId = await getUserIdFromSession();  // Returns the User_ID integer
await mp.post('/tables/YourTable', [data], { $userId: userId });
```

### ❌ Mistake 3: Not including primary key in PUT requests
```typescript
// BAD: Missing primary key
await mp.put('/tables/Events', [{
  Event_Title: "New Title"  // Missing Event_ID!
}], { $userId: userId });
```

### ✅ Correct:
```typescript
await mp.put('/tables/Events', [{
  Event_ID: eventId,  // MUST include primary key
  Event_Title: "New Title"
}], { $userId: userId });
```

## When to Use $userID

### Always Use For:
- ✅ POST (creating records)
- ✅ PUT/PATCH (updating records)
- ✅ DELETE (deleting records)

### Don't Use For:
- ❌ GET (reading records) - Not applicable for read operations
- ❌ Stored procedure calls - Some procs may accept `@UserID` parameter separately

## Verifying Audit Trail

After implementing, verify in MinistryPlatform:
1. Create/update a record through your app
2. View the record in MP
3. Click the "Audit" button
4. Check that "_Audit User" shows the actual user, not the OAuth client

## Example: Complete CRUD API Route

```typescript
import { NextRequest, NextResponse } from "next/server";
import { MinistryPlatformClient } from "@/providers/MinistryPlatform/core/ministryPlatformClient";
import { getUserIdFromSession } from "@/utils/auth";
import { checkYourAppAccess } from "@/lib/mpAuth";

// GET - Read (no $userID needed)
export async function GET(request: NextRequest) {
  const { hasAccess } = await checkYourAppAccess();
  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const mp = new MinistryPlatformClient();
  await mp.ensureValidToken();

  const records = await mp.get('/tables/YourTable');
  return NextResponse.json(records);
}

// POST - Create (needs $userID)
export async function POST(request: NextRequest) {
  const { hasAccess, canEdit } = await checkYourAppAccess();
  if (!hasAccess || !canEdit) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const userId = await getUserIdFromSession();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const mp = new MinistryPlatformClient();
  await mp.ensureValidToken();

  const result = await mp.post(
    '/tables/YourTable',
    [body],
    { $userId: userId }
  );

  return NextResponse.json(result);
}

// PATCH - Update (needs $userID)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { hasAccess, canEdit } = await checkYourAppAccess();
  if (!hasAccess || !canEdit) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const userId = await getUserIdFromSession();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const recordId = parseInt(id, 10);
  const body = await request.json();

  const mp = new MinistryPlatformClient();
  await mp.ensureValidToken();

  await mp.put(
    '/tables/YourTable',
    [{
      YourTable_ID: recordId,
      ...body
    }],
    { $userId: userId }
  );

  return NextResponse.json({ success: true });
}

// DELETE - Delete (needs $userID)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { hasAccess, canDelete } = await checkYourAppAccess();
  if (!hasAccess || !canDelete) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const userId = await getUserIdFromSession();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const recordId = parseInt(id, 10);

  const mp = new MinistryPlatformClient();
  await mp.ensureValidToken();

  await mp.delete(`/tables/YourTable/${recordId}`, { $userId: userId });

  return NextResponse.json({ success: true });
}
```

## Summary Checklist

When implementing create/update/delete operations:

- [ ] Import `getUserIdFromSession` from `@/utils/auth`
- [ ] Call `getUserIdFromSession()` at the start of the route handler
- [ ] Check if `userId` is null and return 401 if so
- [ ] Pass `{ $userId: userId }` as the query parameters to MP API calls
- [ ] For PUT operations, ensure primary key is included in the payload
- [ ] Test the audit trail in MinistryPlatform after implementation

## References

- **Implementation Example**: `src/app/api/rsvp/events/[eventId]/amenities/route.ts`
- **Utility Function**: `src/utils/auth.ts`
- **Session Types**: `src/types/next-auth.d.ts`
