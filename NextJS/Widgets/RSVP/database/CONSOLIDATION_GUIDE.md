# Project_RSVPs Consolidation to Projects Table

## Overview

This guide documents the consolidation of the `Project_RSVPs` table into the `Projects` table. This change eliminates the one-to-many relationship that was never actually used, simplifying the schema and making RSVP configuration a direct property of Projects.

## Why This Change?

**Problem**: The original design assumed Projects could have multiple RSVP configurations, but in practice:
- Projects only ever have ONE RSVP configuration
- The separate table added unnecessary complexity
- Queries required extra joins
- Foreign keys were confusing

**Solution**: Move all RSVP fields directly onto the `Projects` table as nullable columns.

---

## Schema Changes

### New Columns on `Projects` Table

All fields are nullable to support projects without RSVPs (e.g., Project_Budgets-only projects).

#### RSVP Configuration Fields
- `RSVP_Title` (NVARCHAR(255)) - Display title
- `RSVP_Description` (NVARCHAR(MAX)) - Rich text description
- `RSVP_Start_Date` (DATETIME) - When RSVPs open
- `RSVP_End_Date` (DATETIME) - When RSVPs close
- `RSVP_Is_Active` (BIT) - Whether accepting submissions
- `RSVP_Require_Contact_Lookup` (BIT) - Require user lookup
- `RSVP_Allow_Guest_Submission` (BIT) - Allow non-MP contacts
- `RSVP_Confirmation_Email_Template_ID` (INT) - Email template FK
- `RSVP_Slug` (NVARCHAR(100)) - URL-friendly identifier
- `RSVP_Confirmation_Template_ID` (INT) - Confirmation template FK

#### Branding Color Fields (NEW!)
MinistryPlatform uses `dp_Color:nvarchar(32)` format (hex codes like `#61BC47`):
- `RSVP_Primary_Color` - Primary brand color (buttons, headers)
- `RSVP_Secondary_Color` - Secondary brand color
- `RSVP_Accent_Color` - Accent color (highlights, links)
- `RSVP_Background_Color` - Background color override

### File Attachments (NEW!)

Images are now attached directly to the `Projects` record via `dp_Files` table:

**Background Image**: `RSVP_BG_Image.jpg`
```sql
SELECT * FROM dp_Files
WHERE Table_Name = 'Projects'
  AND Record_ID = @Project_ID
  AND File_Name = 'RSVP_BG_Image.jpg';
```

**Card/Widget Image**: `RSVP_Image.jpg`
```sql
SELECT * FROM dp_Files
WHERE Table_Name = 'Projects'
  AND Record_ID = @Project_ID
  AND File_Name = 'RSVP_Image.jpg';
```

This follows the same pattern as Campus SVG icons (`Congregations` + `Campus.svg`).

---

## Migration Steps

### 1. Run Migration Script

Execute: `/database/consolidate-project-rsvps-to-projects.sql`

This script will:
✅ Add all new columns to `Projects`
✅ Migrate data from `Project_RSVPs` to `Projects`
✅ Add `Project_ID` column to dependent tables
✅ Update foreign keys to reference `Projects` instead of `Project_RSVPs`
✅ Keep old columns for backward compatibility during transition

### 2. Upload RSVP Images

For each project with RSVPs:
1. Open the Project record in MinistryPlatform admin
2. Download the image from the old `Header_Image_URL` field (if used)
3. Upload as **attachment** with filename `RSVP_BG_Image.jpg`
4. Upload additional card images as `RSVP_Image.jpg`

### 3. Set Branding Colors

For each project with RSVPs:
1. Set `RSVP_Primary_Color` (e.g., `#61BC47` for Woodside green)
2. Set `RSVP_Secondary_Color` (optional)
3. Set `RSVP_Accent_Color` (optional)
4. Set `RSVP_Background_Color` (optional)

Colors use MinistryPlatform's standard `dp_Color` format (32-character hex codes).

### 4. Deploy Updated Stored Procedures

Execute these in order:

1. **`/database/sp-get-project-data-with-files.sql`**
   - Updated to query `Projects` table instead of `Project_RSVPs`
   - Returns file URLs from `dp_Files` table
   - Returns branding colors
   - Parameter changed: `@Project_ID` instead of `@Project_RSVP_ID`

2. **`/database/sp-submit-rsvp-with-audit.sql`**
   - Updated to use `Projects.Project_ID`
   - Parameter changed: `@Project_ID` instead of `@Project_RSVP_ID`
   - Validates `Projects.RSVP_Is_Active = 1`

3. **`/database/sp-schedule-rsvp-emails.sql`**
   - Updated to query `Projects` table
   - Parameter changed: `@Project_ID` instead of `@Project_RSVP_ID`
   - Reads colors from `Projects.RSVP_*_Color` fields

### 5. Deploy Frontend Changes

TypeScript types updated in `/src/types/rsvp.ts`:

**Before:**
```typescript
interface ProjectRSVPDataResponse {
  Project_RSVP: ProjectRSVPConfig;
  // ...
}

interface ProjectRSVPConfig {
  Project_RSVP_ID: number;
  Header_Image_URL: string | null;
  // ...
}
```

**After:**
```typescript
interface ProjectRSVPDataResponse {
  Project: ProjectConfig;  // Changed!
  // ...
}

interface ProjectConfig {
  Project_ID: number;
  RSVP_BG_Image_URL: string | null;  // From dp_Files
  RSVP_Image_URL: string | null;     // From dp_Files
  RSVP_Primary_Color: string | null; // NEW!
  RSVP_Secondary_Color: string | null; // NEW!
  RSVP_Accent_Color: string | null; // NEW!
  RSVP_Background_Color: string | null; // NEW!
  // ...
}

// Backward compatibility
type ProjectRSVPConfig = ProjectConfig;
```

### 6. Update API Calls

All API routes need to change parameter names:

**Before:**
```typescript
fetch('/api/rsvp/submit', {
  body: JSON.stringify({
    Event_ID: eventId,
    Project_RSVP_ID: projectRsvpId,
    // ...
  })
})
```

**After:**
```typescript
fetch('/api/rsvp/submit', {
  body: JSON.stringify({
    Event_ID: eventId,
    Project_ID: projectId,  // Changed!
    // ...
  })
})
```

---

## Database Foreign Key Changes

### Tables Updated

All these tables now have a `Project_ID` column pointing directly to `Projects`:

1. **`Project_RSVP_Questions`**
   - Added: `Project_ID INT NOT NULL`
   - FK: `FK_Project_RSVP_Questions_Projects`
   - Old `Project_RSVP_ID` kept for transition

2. **`Project_Confirmation_Cards`**
   - Added: `Project_ID INT NOT NULL`
   - FK: `FK_Project_Confirmation_Cards_Projects`
   - Old `Project_RSVP_ID` kept for transition

3. **`Event_RSVPs`**
   - Added: `Project_ID INT NOT NULL`
   - FK: `FK_Event_RSVPs_Projects`
   - Old `Project_RSVP_ID` kept for transition

4. **`RSVP_Email_Campaigns`** (if exists)
   - Added: `Project_ID INT NOT NULL`
   - FK: `FK_RSVP_Email_Campaigns_Projects`
   - Old `Project_RSVP_ID` kept for transition

---

## Backward Compatibility

During the transition period:
- ✅ Old `Project_RSVP_ID` columns are kept on dependent tables
- ✅ Both `Project_ID` and `Project_RSVP_ID` are populated with the same value
- ✅ Old stored procedures can still reference `Project_RSVP_ID`
- ✅ TypeScript type alias: `ProjectRSVPConfig = ProjectConfig`

### When to Remove Old Columns

After all code is updated and tested:

```sql
-- Drop old Project_RSVP_ID columns
ALTER TABLE [dbo].[Project_RSVP_Questions] DROP COLUMN [Project_RSVP_ID];
ALTER TABLE [dbo].[Project_Confirmation_Cards] DROP COLUMN [Project_RSVP_ID];
ALTER TABLE [dbo].[Event_RSVPs] DROP COLUMN [Project_RSVP_ID];
ALTER TABLE [dbo].[RSVP_Email_Campaigns] DROP COLUMN [Project_RSVP_ID];

-- Drop old Project_RSVPs table
DROP TABLE [dbo].[Project_RSVPs];
```

---

## Widget Parameter Changes

### Old Widget Embed Code
```html
<div
  data-component="RSVPWidget"
  data-params="@ProjectRsvpID=1, @CongregationID=9">
</div>
```

### New Widget Embed Code
```html
<div
  data-component="RSVPWidget"
  data-params="@Project=christmas-2024, @CongregationID=9">
</div>
```

**OR** using numeric ID:
```html
<div
  data-component="RSVPWidget"
  data-params="@Project=1, @CongregationID=9">
</div>
```

The stored procedure accepts **either** `@Project_ID` (int) OR `@RSVP_Slug` (string).

---

## Testing Checklist

### Database Testing
- [ ] Migration script runs without errors
- [ ] All `Project_RSVPs` data migrated to `Projects`
- [ ] Foreign keys updated correctly
- [ ] Indexes created successfully
- [ ] Data integrity verified (no orphaned records)

### File Attachment Testing
- [ ] Upload `RSVP_BG_Image.jpg` to a Project record
- [ ] Upload `RSVP_Image.jpg` to a Project record
- [ ] Verify file URLs returned by stored procedure
- [ ] Test image display in widget

### Color Branding Testing
- [ ] Set `RSVP_Primary_Color` on a project
- [ ] Verify color returned by stored procedure
- [ ] Test color application in widget UI
- [ ] Test null color handling (falls back to defaults)

### Stored Procedure Testing
```sql
-- Test with Project_ID
EXEC api_Custom_RSVP_Project_Data_JSON @Project_ID = 1;

-- Test with RSVP_Slug
EXEC api_Custom_RSVP_Project_Data_JSON @RSVP_Slug = 'christmas-2024';

-- Test RSVP submission
EXEC api_Custom_RSVP_Submit_JSON
    @Event_ID = 101,
    @Project_ID = 1,  -- Changed from @Project_RSVP_ID
    @Contact_ID = 228155,
    @First_Name = 'John',
    @Last_Name = 'Doe',
    @Email_Address = 'john.doe@example.com',
    @Answers = '[{"Question_ID": 1, "Numeric_Value": 4}]';
```

### Frontend Testing
- [ ] Widget loads with new `Project` response structure
- [ ] Images display correctly from `dp_Files`
- [ ] Colors apply correctly from database
- [ ] RSVP submission works with `Project_ID` parameter
- [ ] Confirmation page displays correctly
- [ ] Email campaigns trigger correctly

### Integration Testing
- [ ] Test complete RSVP flow end-to-end
- [ ] Verify Event_Participants records created
- [ ] Verify audit logs written correctly
- [ ] Test with multiple campuses
- [ ] Test with guest submissions
- [ ] Test with registered users

---

## Rollback Plan

If issues occur, rollback is simple since old columns are preserved:

1. Revert to old stored procedures (without `-with-files` suffix)
2. Change API calls back to `Project_RSVP_ID`
3. Change TypeScript to use `data.Project_RSVP` instead of `data.Project`
4. Widget continues working with old schema

---

## Benefits of This Change

### Simplified Schema
- ✅ One less table to manage
- ✅ Fewer joins in queries
- ✅ Clearer relationship model
- ✅ No orphaned RSVP configs

### Better Performance
- ✅ Direct access to RSVP data from Projects
- ✅ Fewer table joins
- ✅ Simpler query plans

### Easier Development
- ✅ Intuitive data model
- ✅ Fewer foreign keys to track
- ✅ Simpler TypeScript types
- ✅ Less code duplication

### File Management
- ✅ Standard MinistryPlatform file attachment pattern
- ✅ No external URLs to manage
- ✅ Consistent with Campus.svg approach
- ✅ Built-in MinistryPlatform file serving

### Branding Flexibility
- ✅ Per-project color customization
- ✅ Standard MinistryPlatform color format
- ✅ Easy to update in MP admin
- ✅ Falls back to defaults if not set

---

## Support

For questions or issues:
1. Check this guide first
2. Review migration script comments
3. Test in development environment before production
4. Verify data integrity after migration
5. Keep old columns until fully tested

---

## Related Files

- **Migration Script**: `/database/consolidate-project-rsvps-to-projects.sql`
- **Stored Procedure (Project Data)**: `/database/sp-get-project-data-with-files.sql`
- **Stored Procedure (Submit)**: `/database/sp-submit-rsvp-with-audit.sql`
- **Stored Procedure (Emails)**: `/database/sp-schedule-rsvp-emails.sql`
- **TypeScript Types**: `/src/types/rsvp.ts`
- **Schema Documentation**: `/database/RSVP_DATABASE_SCHEMA.md` (needs update)
