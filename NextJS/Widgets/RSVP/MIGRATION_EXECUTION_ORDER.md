# RSVP Migration Execution Order

## CORRECTED Order (Run in this exact sequence)

### Phase 1: Add Fields to Existing Tables

**Run these IN ORDER - each one depends on the previous:**

```sql
-- 1. FIRST: Add missing RSVP fields to Projects table
--    File: Database/Migrations/2025-11-19-add-rsvp-fields-to-projects.sql
--    Adds: RSVP_BG_Image_URL, RSVP_Image_URL, Form_ID
--    Status: MUST RUN FIRST (stored procedures need these fields)

-- 2. Add RSVP_Party_Size to Event_Participants
--    File: Database/Migrations/2025-11-19-add-rsvp-party-size-to-event-participants.sql
--    Adds: RSVP_Party_Size (INT NULL)
--    Safe: Yes

-- 3. Add Custom_Field_Configuration to Form_Fields
--    File: Database/Migrations/2025-11-19-add-custom-config-to-form-fields.sql
--    Adds: Custom_Field_Configuration (NVARCHAR(MAX) NULL) with JSON validation
--    Safe: Yes

-- 4. Add Project_ID to Project_Confirmation_Cards
--    File: Database/Migrations/2025-11-19-update-confirmation-cards-project-id.sql
--    Adds: Project_ID, migrates data from Project_RSVP_ID
--    Safe: Yes (auto-migrates existing data)
```

### Phase 2: Deploy Stored Procedures

**Run AFTER all field migrations are complete:**

```sql
-- 5. Deploy Get Project Data stored procedure (v2)
--    File: database/sp-get-project-rsvp-data-with-slug-v2.sql
--    Replaces: api_Custom_RSVP_Project_Data_JSON
--    Note: Uses Projects.Form_ID, RSVP_BG_Image_URL, RSVP_Image_URL

-- 6. Deploy Submit RSVP stored procedure (v2)
--    File: database/sp-submit-rsvp-with-audit-v2.sql
--    Replaces: api_Custom_RSVP_Submit_JSON
--    Note: Uses Event_Participants.RSVP_Party_Size, Form_Responses
```

### Phase 3: Neon Database (Already Complete ✅)

```bash
# Already ran successfully on 2025-11-19
node scripts/run-neon-migration.js
# Created: rsvp_field_types table with 20 field types
```

## SQL Server Execution Commands

### Option A: Run via sqlcmd (Command Line)

```bash
cd /Users/coltonwirgau/MinistryPlatform

# 1. Add RSVP fields to Projects (MUST BE FIRST)
sqlcmd -S 10.206.0.131 -d MinistryPlatform -U Woodside_Development -P 'Kx9m!Yn2@Qz7^Wt8&Rj5' \
  -i Database/Migrations/2025-11-19-add-rsvp-fields-to-projects.sql

# 2. Add RSVP_Party_Size to Event_Participants
sqlcmd -S 10.206.0.131 -d MinistryPlatform -U Woodside_Development -P 'Kx9m!Yn2@Qz7^Wt8&Rj5' \
  -i Database/Migrations/2025-11-19-add-rsvp-party-size-to-event-participants.sql

# 3. Add Custom_Field_Configuration to Form_Fields
sqlcmd -S 10.206.0.131 -d MinistryPlatform -U Woodside_Development -P 'Kx9m!Yn2@Qz7^Wt8&Rj5' \
  -i Database/Migrations/2025-11-19-add-custom-config-to-form-fields.sql

# 4. Add Project_ID to Project_Confirmation_Cards
sqlcmd -S 10.206.0.131 -d MinistryPlatform -U Woodside_Development -P 'Kx9m!Yn2@Qz7^Wt8&Rj5' \
  -i Database/Migrations/2025-11-19-update-confirmation-cards-project-id.sql

# 5. Deploy Get Project Data SP
sqlcmd -S 10.206.0.131 -d MinistryPlatform -U Woodside_Development -P 'Kx9m!Yn2@Qz7^Wt8&Rj5' \
  -i NextJS/Widgets/RSVP/database/sp-get-project-rsvp-data-with-slug-v2.sql

# 6. Deploy Submit RSVP SP
sqlcmd -S 10.206.0.131 -d MinistryPlatform -U Woodside_Development -P 'Kx9m!Yn2@Qz7^Wt8&Rj5' \
  -i NextJS/Widgets/RSVP/database/sp-submit-rsvp-with-audit-v2.sql
```

### Option B: Run via SQL Server Management Studio (SSMS)

1. Connect to `10.206.0.131` → `MinistryPlatform` database
2. Open and execute each file in order (1-6 above)
3. Check for green "Command(s) completed successfully" message

## Post-Migration Verification

```sql
-- Verify Projects table has all RSVP fields
SELECT COLUMN_NAME
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Projects'
  AND COLUMN_NAME LIKE 'RSVP%' OR COLUMN_NAME = 'Form_ID'
ORDER BY COLUMN_NAME;

-- Should return:
-- Form_ID
-- RSVP_Accent_Color
-- RSVP_Allow_Guest_Submission
-- RSVP_BG_Image_URL
-- RSVP_Description
-- RSVP_End_Date
-- RSVP_Image_URL
-- RSVP_Is_Active
-- RSVP_Primary_Color
-- RSVP_Require_Contact_Lookup
-- RSVP_Secondary_Color
-- RSVP_Slug
-- RSVP_Start_Date
-- RSVP_Title

-- Verify Event_Participants has RSVP_Party_Size
SELECT COLUMN_NAME
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Event_Participants'
  AND COLUMN_NAME = 'RSVP_Party_Size';

-- Verify Form_Fields has Custom_Field_Configuration
SELECT COLUMN_NAME
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Form_Fields'
  AND COLUMN_NAME = 'Custom_Field_Configuration';

-- Verify stored procedures exist
SELECT name, create_date, modify_date
FROM sys.procedures
WHERE name = 'api_Custom_RSVP_Project_Data_JSON'
   OR name = 'api_Custom_RSVP_Submit_JSON';
```

## Grant Permissions (After SP Deployment)

```sql
-- Grant EXECUTE on stored procedures to your API user
-- Replace 'YourAPIUser' with actual user/role name
GRANT EXECUTE ON [dbo].[api_Custom_RSVP_Project_Data_JSON] TO [YourAPIUser];
GRANT EXECUTE ON [dbo].[api_Custom_RSVP_Submit_JSON] TO [YourAPIUser];
```

## Why This Order Matters

1. **Projects fields FIRST** - Stored procedures reference these columns
2. **Other table fields** - Can run in any order, but before SPs
3. **Stored procedures LAST** - Require all columns to exist first

## Rollback (If Needed)

```sql
-- If something goes wrong, you can rollback by:
-- 1. Drop the new stored procedures (keeps old version)
DROP PROCEDURE IF EXISTS [dbo].[api_Custom_RSVP_Project_Data_JSON];
DROP PROCEDURE IF EXISTS [dbo].[api_Custom_RSVP_Submit_JSON];

-- 2. Restore from backup (if critical)
-- The field additions are safe to leave - they don't break anything
```

## Next Steps After Migration

1. ✅ Run all 6 migrations in order
2. ⏭️ Test stored procedure calls
3. ⏭️ Update TypeScript types
4. ⏭️ Migrate existing data (Event_RSVPs → Event_Participants)
5. ⏭️ Test end-to-end RSVP flow
6. ⏭️ Drop old tables
