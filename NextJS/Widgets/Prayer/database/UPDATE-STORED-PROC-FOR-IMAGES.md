# Update Stored Procedure to Include Contact Images

## Overview
This update modifies the `api_Custom_Prayer_Widget_Data_JSON` stored procedure to include contact profile images in the JSON response.

## Changes Made

### 1. Added Image URL Configuration
- Fetches the `ImageURL` base from `dp_Configuration_Settings` (Application_Code='Common', Key_Name='ImageURL')
- Fetches the Domain GUID from `dp_Domains`
- Uses these values to construct full image URLs

### 2. Updated Prayer Data Query
- Added `LEFT JOIN` to `dp_files` table to fetch contact profile images
- Filters by:
  - `Table_Name = 'Contacts'`
  - `Default_Image = 1`
- Constructs image URL in the format: `{ImageURL}?dn={DomainGUID}&fn={UniqueFileName}.{Extension}`

### 3. Image Privacy Rules
Contact images are returned as NULL when:
- The prayer requester set `Anonymous_Share = 1`
- The widget configuration has `Show_Contact_Names = 0`
- No image file exists for the contact

## Installation Instructions

1. **Run the Updated Stored Procedure**:
   ```sql
   -- Execute the updated stored procedure script
   -- File: /database/unified-prayer-widget-proc.sql
   ```

2. **Test the Changes**:
   ```sql
   -- Test with your Contact_ID to verify images are returned
   EXEC api_Custom_Prayer_Widget_Data_JSON @ContactID = 228155, @DomainID = 1
   ```

3. **Expected Output**:
   - In the JSON response, look for the `Requester.Image` field
   - Should contain URLs like: `https://my.woodsidebible.org/ministryplatformapi/files?dn=<guid>&fn=<filename>.jpg`
   - Or `null` if no image exists or privacy rules apply

## Frontend Changes

The Next.js app has been updated to:
1. Fetch the authenticated user's contact image via MP API
2. Include it in the `User_Info.Image_URL` field
3. Pass image URLs through the adapter to display in card headers

## Notes

- Contact images are now displayed as "First Last" names in card headers
- Image URLs are placeholders (null) until you add profile photos in MinistryPlatform
- The Contact_Photo field should already exist in the Contacts table
