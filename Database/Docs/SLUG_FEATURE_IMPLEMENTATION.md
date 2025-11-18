# RSVP Widget - Project Slug Feature

## Overview

This feature allows widgets to be embedded using friendly slugs instead of numeric IDs, making it easier for non-technical users to embed RSVPs on WordPress pages.

**Before:**
```html
<div id="rsvp-widget-root" data-params="@ProjectRsvpID=1"></div>
```

**After:**
```html
<div id="rsvp-widget-root" data-params="@Project=christmas-2024"></div>
```

## Benefits

✅ **Human-readable** - `christmas-2024` is easier to understand than `1`
✅ **Memorable** - Content editors can remember slugs without looking them up
✅ **SEO-friendly** - Slug names can match URL structures
✅ **Backward compatible** - Numeric IDs still work (`@ProjectRsvpID=1`)
✅ **Flexible** - Can use numeric ID or slug with same parameter: `@Project=1` or `@Project=christmas-2024`

## Database Changes

### 1. Add RSVP_Slug Column

**File:** `database/add-rsvp-slug-column.sql`

Adds a new `RSVP_Slug` column to the `Project_RSVPs` table with:
- Type: `NVARCHAR(100) NULL`
- Unique index for fast lookups
- Partial index (only enforces uniqueness when slug is not NULL)

**Run this SQL:**
```sql
-- Add slug column to Project_RSVPs table
ALTER TABLE [dbo].[Project_RSVPs]
ADD [RSVP_Slug] NVARCHAR(100) NULL;

-- Add unique index
CREATE UNIQUE NONCLUSTERED INDEX [UQ_Project_RSVPs_RSVP_Slug]
ON [dbo].[Project_RSVPs]([RSVP_Slug] ASC)
WHERE [RSVP_Slug] IS NOT NULL;
```

### 2. Update Stored Procedure

**File:** `database/sp-get-project-rsvp-data-with-slug.sql`

Updates `api_Custom_RSVP_Project_Data_JSON` to accept either:
- `@Project_RSVP_ID` (INT) - Original method
- `@RSVP_Slug` (NVARCHAR) - New method

The stored procedure automatically resolves the slug to an ID at the beginning.

## Code Changes

### 1. API Route (`src/app/api/rsvp/project/route.ts`)

**New Parameter:** `project` (replaces `projectRsvpId`)

The API route now accepts a `project` query parameter that can be:
- **Numeric ID**: `/api/rsvp/project?project=1`
- **Slug**: `/api/rsvp/project?project=christmas-2024`

The route automatically detects the type and passes the correct parameter to the stored procedure.

```typescript
// If numeric, use @Project_RSVP_ID
if (/^\d+$/.test(projectIdentifier)) {
  params['@Project_RSVP_ID'] = projectIdentifier;
} else {
  // Otherwise, use @RSVP_Slug
  params['@RSVP_Slug'] = projectIdentifier;
}
```

**Backward Compatibility:** The old `projectRsvpId` parameter still works.

### 2. Widget Param Parsing (`src/app/(app)/page.tsx`)

**New Parameter:** `@Project=value` (replaces `@ProjectRsvpID=value`)

The widget now parses:
- `@Project=1` → Numeric ID
- `@Project=christmas-2024` → Slug
- `@ProjectRsvpID=1` → Still supported (deprecated)

```typescript
interface WidgetParams {
  CongregationID?: number;
  ProjectRsvpID?: number;  // Deprecated
  Project?: string | number;  // New
}
```

## Deployment Steps

### Step 1: Run Database Migration

```sql
-- Run the migration script
USE [MinistryPlatform]
GO

-- Execute the slug column migration
-- File: database/add-rsvp-slug-column.sql
```

### Step 2: Add Slugs to Existing Projects

```sql
-- Update existing Project_RSVPs with slugs
UPDATE Project_RSVPs
SET RSVP_Slug = 'christmas-2024'
WHERE Project_RSVP_ID = 1;

-- Add slug for Easter project
UPDATE Project_RSVPs
SET RSVP_Slug = 'easter-2025'
WHERE Project_RSVP_ID = 2;

-- Verify slugs are unique
SELECT RSVP_Slug, COUNT(*)
FROM Project_RSVPs
WHERE RSVP_Slug IS NOT NULL
GROUP BY RSVP_Slug
HAVING COUNT(*) > 1;
-- Should return 0 rows
```

### Step 3: Update Stored Procedure

```sql
-- Deploy updated stored procedure
-- File: database/sp-get-project-rsvp-data-with-slug.sql

-- Grant execute permission (if needed)
GRANT EXECUTE ON [dbo].[api_Custom_RSVP_Project_Data_JSON] TO [YourAPIUser];
```

### Step 4: Deploy Code Changes

```bash
# Build and deploy the updated widget
npm run build

# Or if using Vercel
vercel --prod
```

### Step 5: Rebuild Widget Bundle

```bash
# Rebuild the embeddable widget JavaScript
npm run build:widget

# This generates: public/widget/rsvp-widget.js
```

## Usage Examples

### Basic Slug Usage

```html
<!-- WordPress page content -->
<div id="rsvp-widget-root" data-params="@Project=christmas-2024"></div>
<script src="https://rsvp-wine.vercel.app/widget/rsvp-widget.js"></script>
```

### Slug + Campus Filter

```html
<!-- Show only Lake Orion campus events -->
<div id="rsvp-widget-root" data-params="@Project=christmas-2024, @CongregationID=9"></div>
<script src="https://rsvp-wine.vercel.app/widget/rsvp-widget.js"></script>
```

### Numeric ID (Backward Compatible)

```html
<!-- Still works with numeric ID -->
<div id="rsvp-widget-root" data-params="@Project=1"></div>
<script src="https://rsvp-wine.vercel.app/widget/rsvp-widget.js"></script>
```

### Old Format (Still Supported)

```html
<!-- Deprecated but still works -->
<div id="rsvp-widget-root" data-params="@ProjectRsvpID=1"></div>
<script src="https://rsvp-wine.vercel.app/widget/rsvp-widget.js"></script>
```

## Slug Naming Conventions

**Recommended Format:**
- Use lowercase letters
- Separate words with hyphens
- Include year for recurring events
- Keep it short and memorable

**Good Examples:**
- `christmas-2024`
- `easter-services-2025`
- `vbs-summer-2024`
- `fall-kickoff-2024`

**Bad Examples:**
- `Christmas_2024` (use hyphens, not underscores)
- `christmas-services-at-woodside-bible-church-2024` (too long)
- `xmas24` (not descriptive enough)
- `event1` (not human-readable)

## Testing

### Test Slug Lookup

```sql
-- Test stored procedure with slug
EXEC api_Custom_RSVP_Project_Data_JSON @RSVP_Slug = 'christmas-2024';

-- Should return the same data as:
EXEC api_Custom_RSVP_Project_Data_JSON @Project_RSVP_ID = 1;
```

### Test API Endpoint

```bash
# Test with slug
curl "http://localhost:3000/api/rsvp/project?project=christmas-2024"

# Test with numeric ID
curl "http://localhost:3000/api/rsvp/project?project=1"

# Both should return the same Project_RSVP data
```

### Test Widget Embedding

1. Create a test HTML file:

```html
<!DOCTYPE html>
<html>
<head>
  <title>RSVP Widget Test</title>
</head>
<body>
  <h1>Test RSVP Widget with Slug</h1>

  <div id="rsvp-widget-root" data-params="@Project=christmas-2024"></div>
  <script src="http://localhost:3000/widget/rsvp-widget.js"></script>

</body>
</html>
```

2. Open in browser
3. Check console for:
   ```
   [DEBUG] Fetching RSVP data for project: christmas-2024
   [DEBUG] API URL: http://localhost:3000/api/rsvp/project?project=christmas-2024
   ```

## Troubleshooting

### Slug Not Found Error

**Problem:** API returns "Project RSVP not found with slug: christmas-2024"

**Solutions:**
1. Verify slug exists in database:
   ```sql
   SELECT * FROM Project_RSVPs WHERE RSVP_Slug = 'christmas-2024';
   ```

2. Check if Project_RSVP is active:
   ```sql
   SELECT * FROM Project_RSVPs WHERE RSVP_Slug = 'christmas-2024' AND Is_Active = 1;
   ```

3. Verify slug doesn't have trailing spaces:
   ```sql
   UPDATE Project_RSVPs SET RSVP_Slug = TRIM(RSVP_Slug) WHERE RSVP_Slug IS NOT NULL;
   ```

### Duplicate Slug Error

**Problem:** Cannot add slug - unique constraint violation

**Solution:**
```sql
-- Find duplicate slugs
SELECT RSVP_Slug, COUNT(*)
FROM Project_RSVPs
GROUP BY RSVP_Slug
HAVING COUNT(*) > 1;

-- Rename duplicates with year suffix
UPDATE Project_RSVPs
SET RSVP_Slug = RSVP_Slug + '-2025'
WHERE Project_RSVP_ID = 2;  -- ID of duplicate
```

### Widget Not Loading Slug

**Problem:** Widget still uses numeric ID instead of slug

**Solutions:**
1. Rebuild widget bundle: `npm run build:widget`
2. Clear browser cache
3. Verify data-params attribute:
   ```javascript
   // Check in browser console
   document.getElementById('rsvp-widget-root').getAttribute('data-params')
   // Should show: "@Project=christmas-2024"
   ```

## Migration Path for Existing Widgets

### Phase 1: Add Slugs (No Breaking Changes)
1. Run database migration
2. Deploy updated stored procedure
3. Add slugs to existing projects
4. Test slug lookups

### Phase 2: Update Widget Code (Backward Compatible)
1. Deploy code changes
2. Rebuild widget bundle
3. Test with both old and new formats

### Phase 3: Update Embeds (Gradual Rollout)
1. Update WordPress pages one at a time
2. Change `@ProjectRsvpID=1` to `@Project=christmas-2024`
3. Verify each page loads correctly
4. Keep old format working for safety

### Phase 4: Deprecation Notice (Optional, Future)
- Document `@ProjectRsvpID` as deprecated
- Encourage use of `@Project` parameter
- Keep backward compatibility indefinitely

## Files Modified

### Database
- ✅ `database/add-rsvp-slug-column.sql` - Migration script
- ✅ `database/sp-get-project-rsvp-data-with-slug.sql` - Updated stored procedure

### Code
- ✅ `src/app/api/rsvp/project/route.ts` - API route with slug support
- ✅ `src/app/(app)/page.tsx` - Widget param parsing and data fetching
- ✅ `src/types/rsvp.ts` - Type definitions (if needed)

### Documentation
- ✅ `database/SLUG_FEATURE_IMPLEMENTATION.md` - This file

## Future Enhancements

### Auto-Generate Slugs
Add a trigger or function to auto-generate slugs from RSVP_Title:

```sql
CREATE TRIGGER trg_Generate_RSVP_Slug
ON Project_RSVPs
AFTER INSERT
AS
BEGIN
  UPDATE Project_RSVPs
  SET RSVP_Slug = LOWER(REPLACE(REPLACE(i.RSVP_Title, ' ', '-'), '''', ''))
  FROM INSERTED i
  WHERE Project_RSVPs.Project_RSVP_ID = i.Project_RSVP_ID
    AND Project_RSVPs.RSVP_Slug IS NULL;
END
```

### Admin UI for Slug Management
Add slug editing to MinistryPlatform admin interface:
- Custom page for Project_RSVPs
- Slug validation (lowercase, hyphens only)
- Duplicate slug detection
- Slug history tracking

### URL Routing
Add direct slug-based URLs:
- `/rsvp/christmas-2024` instead of `/rsvp?project=christmas-2024`
- Next.js dynamic routes with slug lookup
- SEO-friendly URLs for better search rankings

## Support

For questions or issues:
- Contact: Colton Wirgau
- Repository: MinistryPlatform/NextJS/Widgets/RSVP
- Documentation: This file + ARCHITECTURE.md
