# Add User_Info Section with Image to Stored Procedure

## Overview
This update adds a `User_Info` section to the `api_Custom_Prayer_Widget_Data_JSON` stored procedure that includes the logged-in user's profile image.

## Why This Change?

**Problem:** The Next.js API route was trying to fetch the user's profile image via REST API, but ran into permission issues:
- REST API (even with client credentials) doesn't have permission to access system tables like `dp_Domains`
- Error: `User 'email@domain.com' does not have access to the table or table does not exist`

**Solution:** Move user image fetching into the stored procedure, which:
- Runs with database-level permissions (no REST API OAuth restrictions)
- Uses the same pattern already working for other users' images (Brad Ervin, etc.)
- Keeps all image logic in one place using consistent permissions

## Changes Made

### 1. Stored Procedure - Added User_Info Section
**Location:** Lines 437-457 in `unified-prayer-widget-proc.sql`

```sql
-- User Info (logged-in user's contact details with image)
CASE WHEN @ContactID IS NOT NULL THEN
    (SELECT
        @ContactID AS Contact_ID,
        c.First_Name,
        c.Last_Name,
        c.Display_Name,
        -- User's profile image from dp_files
        CASE
            WHEN cf.File_ID IS NULL THEN NULL
            ELSE (@ImageURL + '?dn=' + @DomainGUID
                  + '&fn=' + CONVERT(VARCHAR(40), cf.Unique_Name) + '.' + cf.Extension)
        END AS Image_URL
     FROM Contacts c
     LEFT JOIN dp_files cf ON cf.Record_ID = c.Contact_ID
        AND cf.Table_Name = 'Contacts'
        AND cf.Default_Image = 1
     WHERE c.Contact_ID = @ContactID
     FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
    )
ELSE NULL END AS User_Info,
```

This section appears in the JSON response **after** `Configuration` and **before** `User_Stats`.

### 2. API Route - Removed REST API Image Fetch
**File:** `/src/app/api/prayers/widget-data/route.ts`

Removed the code that attempted to fetch user images via REST API with app-level client. The stored procedure now provides this data.

## Installation Instructions

1. **Run the Updated Stored Procedure:**
   ```sql
   -- Execute the complete stored procedure script
   -- File: /database/unified-prayer-widget-proc.sql
   ```

2. **Test the Changes:**
   ```sql
   -- Test with your Contact_ID to verify User_Info includes Image_URL
   EXEC api_Custom_Prayer_Widget_Data_JSON @ContactID = 228155, @DomainID = 1
   ```

3. **Expected JSON Structure:**
   ```json
   {
     "Widget_Title": "Prayer & Praise",
     "Widget_Subtitle": "Share burdens, celebrate victories",
     "Configuration": { ... },
     "User_Info": {
       "Contact_ID": 228155,
       "First_Name": "Colton",
       "Last_Name": "Wirgau",
       "Display_Name": "Wirgau, Colton",
       "Image_URL": "https://my.woodsidebible.org/ministryplatformapi/files?dn=<guid>&fn=<filename>.jpg"
     },
     "User_Stats": { ... },
     "My_Requests": { ... },
     "Prayer_Partners": { ... },
     "Community_Needs": { ... }
   }
   ```

## Benefits

1. **Consistent Permissions:** All image retrieval uses database-level permissions through the stored procedure
2. **Works for All Users:** Images work for both authenticated and public viewers (respecting privacy rules)
3. **Simpler Code:** No complex REST API client instantiation or permission handling in Next.js
4. **Single Source of Truth:** All prayer widget data comes from one unified stored procedure call

## Frontend Changes

No frontend changes required! The adapter already expects `User_Info.Image_URL` and passes it through to the components.

The components are currently displaying "First Last" names in card headers, but the image URLs are now available in the data structure if you want to display profile pictures.
