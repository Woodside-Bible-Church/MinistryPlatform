# MinistryPlatform Integration Guide for Next.js Widgets

This document contains critical patterns, gotchas, and best practices learned while building the Prayer Widget. **Essential reading for any MP + Next.js project.**

---

## Table of Contents
1. [Stored Procedures](#stored-procedures)
2. [API Response Patterns](#api-response-patterns)
3. [Authentication](#authentication)
4. [Caching](#caching)
5. [Query Patterns](#query-patterns)
6. [Common Errors & Solutions](#common-errors--solutions)

---

## Stored Procedures

### The JsonResult Pattern

When you need to return **nested or complex JSON structures** from a stored procedure, use the `JsonResult` column pattern. This is MinistryPlatform's preferred method for returning structured data.

**Why?**
- Avoids flat data limitations
- Allows nested objects and arrays
- Cleaner client-side code
- Consistent with MP's internal patterns

**Example:**

```sql
CREATE PROCEDURE [dbo].[api_Custom_User_Response_Stats_JSON]
    @ContactID INT,
    @ResponseTypeID INT = 1
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @ResponseTypeName NVARCHAR(50);
    SELECT @ResponseTypeName = Response_Type
    FROM Feedback_Response_Types
    WHERE Response_Type_ID = @ResponseTypeID;

    -- Return as JsonResult column for nested JSON structure
    SELECT (
        SELECT
            @ContactID AS Contact_ID,
            @ResponseTypeID AS Response_Type_ID,
            @ResponseTypeName AS Response_Type_Name,

            -- Subqueries can be as complex as needed
            (SELECT COUNT(*)
             FROM Feedback_Entry_User_Responses
             WHERE Contact_ID = @ContactID
             AND Response_Type_ID = @ResponseTypeID) AS Total_Responses,

            (SELECT COUNT(*)
             FROM Feedback_Entry_User_Responses
             WHERE Contact_ID = @ContactID
             AND Response_Type_ID = @ResponseTypeID
             AND CAST(Response_Date AS DATE) = CAST(GETDATE() AS DATE)) AS Responses_Today,

            (SELECT MAX(Response_Date)
             FROM Feedback_Entry_User_Responses
             WHERE Contact_ID = @ContactID
             AND Response_Type_ID = @ResponseTypeID) AS Last_Response_Date

        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
    ) AS JsonResult;
END;
```

### Critical: The @ Parameter Prefix

**SQL Server stored procedures REQUIRE the `@` prefix on parameter names.**

This is a common source of errors. MP will return: `"Parameter 'ContactID' does not exist"` if you forget the `@`.

**Wrong:**
```typescript
await mpClient.callStoredProcedure('api_Custom_User_Response_Stats_JSON', {
  ContactID: 228155,          // ❌ WILL FAIL
  ResponseTypeID: 1,          // ❌ WILL FAIL
});
```

**Correct:**
```typescript
await mpClient.callStoredProcedure('api_Custom_User_Response_Stats_JSON', {
  '@ContactID': 228155,       // ✅ CORRECT
  '@ResponseTypeID': 1,       // ✅ CORRECT
});
```

**Always use the `@` prefix when calling stored procedures from your API.**

### Registering Stored Procedures

Before a stored procedure can be called via MP's API, it must be registered:

1. Navigate to **Platform → API Procedures** in MinistryPlatform
2. Click **Create New**
3. Fill in:
   - **Procedure Name**: Exact name from SQL (e.g., `api_Custom_User_Response_Stats_JSON`)
   - **API Name**: Usually same as procedure name
   - **Public**: Check this box if the procedure should be accessible without authentication
4. **Clear the database cache** (see [Caching](#caching) section)

---

## API Response Patterns

### Double-Nested Array Responses

MinistryPlatform returns stored procedure results as **double-nested arrays**:

```typescript
// What MP actually returns:
[
  [
    {
      "JsonResult": "{\"Contact_ID\":228155,\"Total_Responses\":5,...}"
    }
  ]
]
```

**You must access: `result[0][0].JsonResult`**

**Wrong:**
```typescript
const stats = result[0].JsonResult;  // ❌ undefined
```

**Correct:**
```typescript
// Check for double-nested structure
if (!result || result.length === 0 || !result[0] ||
    !Array.isArray(result[0]) || result[0].length === 0 ||
    !result[0][0] || !result[0][0].JsonResult) {
  // Return default/empty data
  return NextResponse.json({ /* defaults */ });
}

// Extract from double-nested array
const stats = result[0][0].JsonResult;

// JsonResult is a JSON STRING, not an object - parse it
const parsedStats = typeof stats === 'string' ? JSON.parse(stats) : stats;

return NextResponse.json(parsedStats);
```

### Handling Empty Results

Always handle empty results gracefully:

```typescript
export async function GET(request: NextRequest) {
  try {
    const { user, token } = await authenticateRequest();
    const mpClient = new MinistryPlatformClient(token);

    const result = await mpClient.callStoredProcedure<{ JsonResult: Stats }>(
      'api_Custom_User_Response_Stats_JSON',
      {
        '@ContactID': user.contactId,
        '@ResponseTypeID': 1,
      }
    );

    // Double-nested array check + empty result handling
    if (!result || result.length === 0 || !result[0] ||
        !Array.isArray(result[0]) || result[0].length === 0 ||
        !result[0][0] || !result[0][0].JsonResult) {

      console.log('[Stats API] No valid data, returning zeros');

      return NextResponse.json({
        Contact_ID: user.contactId,
        Response_Type_ID: 1,
        Response_Type_Name: 'Prayed',
        Total_Responses: 0,
        Responses_Today: 0,
        Current_Streak: 0,
        Last_Response_Date: null,
        Unique_Entries_Responded: 0,
      });
    }

    const stats = result[0][0].JsonResult;
    const parsedStats = typeof stats === 'string' ? JSON.parse(stats) : stats;

    return NextResponse.json(parsedStats);

  } catch (error) {
    console.error('GET /api/prayers/stats error:', error);

    // Provide helpful error messages
    if (error instanceof Error && error.message.includes('Could not find stored procedure')) {
      return NextResponse.json(
        {
          error: 'Stored procedure not found',
          message: 'Please run the SQL schema script and register the procedure in MP',
          details: error.message
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch stats', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
```

---

## Authentication

### MinistryPlatform Widget Token Pattern

The Prayer Widget uses **MP's native Login Widget** for authentication instead of NextAuth.

**How it works:**

1. WordPress page includes MP login widget:
   ```html
   <mpp-user-login></mpp-user-login>
   ```

2. When user logs in, MP stores token in `localStorage`:
   ```javascript
   localStorage.setItem('mpp-widgets_AuthToken', 'bearer-token-here');
   ```

3. React app reads token from localStorage:
   ```typescript
   // src/lib/mpWidgetAuthClient.ts
   export function getWidgetToken(): string | null {
     if (typeof window === 'undefined') return null;
     return localStorage.getItem('mpp-widgets_AuthToken');
   }
   ```

4. API routes validate token with MP:
   ```typescript
   // src/lib/mpWidgetAuth.ts
   export async function authenticateRequest() {
     const token = getToken(); // from cookie or header

     // Validate with MP's widget auth endpoint
     const response = await fetch(`${MP_BASE_URL}/widgets/Api/Auth/User`, {
       headers: { Authorization: token }
     });

     const user = await response.json();
     return { user, token };
   }
   ```

**Key Difference from NextAuth:**
- No server-side sessions
- No OAuth callback routes needed
- Token validation happens on every API request
- Client-side token management via localStorage

---

## Caching

### MinistryPlatform Database Cache

**CRITICAL:** MinistryPlatform aggressively caches database schema and stored procedures.

**When you must clear the cache:**
- After creating/modifying stored procedures
- After changing stored procedure parameters
- After adding columns to tables
- After modifying foreign key relationships

**How to clear the cache:**

1. Navigate to **Administration → Database Cache** in MinistryPlatform
2. Click **Clear Cache**
3. Wait 10-30 seconds before testing changes

**Symptoms of stale cache:**
- "Parameter does not exist" errors despite correct SQL
- Stored procedure changes not taking effect
- Old data structures being returned
- "Procedure not found" errors for newly created procedures

---

## Query Patterns

### Fetching Related Data

MinistryPlatform uses the `TableName_ID_Table.FieldName` pattern for joins:

```typescript
// Get prayers with contact info and category
const prayers = await mpClient.get('Feedback_Entries', {
  $select: 'Feedback_Entry_ID,Entry_Title,Description,Contact_ID_Table.Display_Name,Contact_ID_Table.First_Name,Feedback_Type_ID_Table.Feedback_Type',
  $filter: 'Approved = 1',
  $orderby: 'Date_Submitted DESC'
});
```

**Important:** MP does NOT support nested joins (e.g., `Table1_ID_Table.Table2_ID_Table.Field`). You can only go one level deep.

### Avoiding Column Name Ambiguity

When querying tables that reference each other, **fully qualify all column names**:

```typescript
// ❌ WRONG - Ambiguous column names
const responses = await mpClient.get('Feedback_Entry_User_Responses', {
  $filter: `Contact_ID = ${contactId}`,
  $select: 'Feedback_Entry_ID,Response_Date,Response_Text'
});
// Error: "Ambiguous column name 'Contact_ID'"

// ✅ CORRECT - Fully qualified
const responses = await mpClient.get('Feedback_Entry_User_Responses', {
  $filter: `Feedback_Entry_User_Responses.Contact_ID = ${contactId} AND Feedback_Entry_User_Responses.Response_Type_ID = 1`,
  $select: 'Feedback_Entry_User_Responses.Feedback_Entry_User_Response_ID,Feedback_Entry_User_Responses.Feedback_Entry_ID,Feedback_Entry_User_Responses.Response_Date,Feedback_Entry_User_Responses.Response_Text,Feedback_Entry_ID_Table.Entry_Title,Feedback_Entry_ID_Table.Description',
  $orderby: 'Feedback_Entry_User_Responses.Response_Date DESC'
});
```

### Filtering and Ordering

```typescript
const prayers = await mpClient.get('Feedback_Entries', {
  $filter: 'Approved = 1 AND Feedback_Type_ID = 1',
  $orderby: 'Date_Submitted DESC',
  $top: 50,
  $select: 'Feedback_Entry_ID,Entry_Title,Description'
});
```

---

## Common Errors & Solutions

### Error: "Parameter 'X' does not exist"

**Cause:** Missing `@` prefix on parameter name

**Solution:** Add `@` prefix to all stored procedure parameters:
```typescript
// Wrong: ContactID
// Right: '@ContactID'
```

---

### Error: "Could not find stored procedure"

**Causes:**
1. Procedure not registered in MP's API_Procedures table
2. Database cache is stale
3. Typo in procedure name

**Solutions:**
1. Register in **Platform → API Procedures**
2. Clear cache in **Administration → Database Cache**
3. Verify exact spelling (case-sensitive)

---

### Error: "Ambiguous column name"

**Cause:** Column exists in multiple joined tables

**Solution:** Fully qualify all column names:
```typescript
$select: 'Feedback_Entries.Feedback_Entry_ID,Feedback_Entries.Description,Contact_ID_Table.Display_Name'
```

---

### Returning Zeros Despite Correct Stored Procedure

**Cause:** Double-nested array structure not being handled correctly

**Solution:** Access `result[0][0].JsonResult` instead of `result[0].JsonResult`

**Debug Steps:**
1. Add logging to see raw response:
   ```typescript
   console.log('[Debug] Raw result:', JSON.stringify(result, null, 2));
   ```
2. Check if `result[0]` is an array
3. Check if `result[0][0]` exists
4. Check if `result[0][0].JsonResult` is a string (needs parsing)

---

### Changes Not Taking Effect

**Cause:** MinistryPlatform database cache

**Solution:**
1. Clear database cache in MP Admin
2. Wait 30 seconds
3. Hard refresh browser (Cmd+Shift+R / Ctrl+Shift+F5)
4. Check server logs to verify new code is running

---

## Response Tracking Architecture

For features like "prayers I've prayed for" or "who prayed for this", create **custom response tables**:

```sql
-- Generic response tracking table
CREATE TABLE [dbo].[Feedback_Entry_User_Responses] (
    [Feedback_Entry_User_Response_ID] INT IDENTITY(1,1) NOT NULL,
    [Feedback_Entry_ID] INT NOT NULL,
    [Contact_ID] INT NOT NULL,
    [Response_Type_ID] INT NOT NULL, -- 1=Prayed, 2=Celebrating, etc.
    [Response_Date] DATETIME NOT NULL DEFAULT GETDATE(),
    [Response_Text] NVARCHAR(4000) NULL, -- Optional encouraging message
    [Domain_ID] INT NOT NULL,

    CONSTRAINT [PK_Feedback_Entry_User_Responses]
        PRIMARY KEY CLUSTERED ([Feedback_Entry_User_Response_ID] ASC),
    CONSTRAINT [FK_Feedback_Entry_User_Responses_Feedback]
        FOREIGN KEY ([Feedback_Entry_ID]) REFERENCES [dbo].[Feedback_Entries] ([Feedback_Entry_ID]),
    CONSTRAINT [FK_Feedback_Entry_User_Responses_Contact]
        FOREIGN KEY ([Contact_ID]) REFERENCES [dbo].[Contacts] ([Contact_ID])
);

-- Indexes for performance
CREATE NONCLUSTERED INDEX [IX_Feedback_Entry_User_Responses_Entry]
    ON [dbo].[Feedback_Entry_User_Responses] ([Feedback_Entry_ID]);

CREATE NONCLUSTERED INDEX [IX_Feedback_Entry_User_Responses_Contact]
    ON [dbo].[Feedback_Entry_User_Responses] ([Contact_ID], [Response_Date] DESC);
```

This pattern allows:
- Tracking who responded to what
- Counting total responses
- Showing user's response history
- Optional text responses/encouragements
- Multiple response types (prayed, celebrated, etc.)

---

## Debugging Tips

### Enable Debug Logging

Add debug logging to your HTTP client to see raw MP responses:

```typescript
// src/providers/MinistryPlatform/utils/httpClient.ts
async post<T = unknown>(endpoint: string, body?: RequestBody, queryParams?: QueryParams): Promise<T> {
    const url = this.buildUrl(endpoint, queryParams);
    const bodyString = body ? JSON.stringify(body) : undefined;

    // Debug logging
    console.error('[HttpClient.post] URL:', url);
    console.error('[HttpClient.post] Body:', bodyString);

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${this.getToken()}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: bodyString
    });

    console.error('[HttpClient.post] Response status:', response.status);

    // Log raw response for stored procedures
    const responseText = await response.text();
    if (endpoint.includes('/procs/')) {
        console.error('[HttpClient.post] Raw response:', responseText);
    }

    return JSON.parse(responseText) as T;
}
```

### Test Stored Procedures in SSMS First

Before calling from your app:

1. Run stored procedure in SQL Server Management Studio
2. Verify it returns expected JSON structure
3. Check parameter names match (with `@` prefix)
4. Ensure it's registered in MP's API_Procedures table
5. Clear MP's database cache
6. Then test from your app

---

## Best Practices Summary

1. **Always use `@` prefix** on stored procedure parameters
2. **Use JsonResult pattern** for complex/nested data structures
3. **Handle double-nested arrays** when accessing stored procedure results
4. **Parse JsonResult** - it's always a JSON string, not an object
5. **Fully qualify column names** to avoid ambiguity
6. **Clear database cache** after any schema/procedure changes
7. **Register stored procedures** in Platform → API Procedures
8. **Handle empty results** gracefully with default values
9. **Add comprehensive error handling** with helpful messages
10. **Test in SSMS first** before integrating into app

---

## File Reference

Key files implementing these patterns:

- `/database/schema.sql` - Custom tables and stored procedures with JsonResult pattern
- `/src/app/api/prayers/stats/route.ts` - Double-nested array handling example
- `/src/services/prayerService.ts` - @ parameter prefix examples
- `/src/providers/MinistryPlatform/utils/httpClient.ts` - Debug logging
- `/src/lib/mpWidgetAuth.ts` - Widget token authentication
- `/src/components/prayer/PrayerCard.tsx` - Response submission example

---

**This guide documents hard-won lessons. Keep it updated as you discover new patterns!**
