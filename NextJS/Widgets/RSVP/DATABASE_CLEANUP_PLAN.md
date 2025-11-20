# RSVP Database Cleanup Plan

## Summary

Now that the RSVP system has been successfully migrated to use native MinistryPlatform tables, we can safely remove the deprecated custom tables and unused columns.

## Tables to Drop (Deprecated Custom Tables)

### 1. **Project_RSVPs** ❌ DEPRECATED
- **Status:** No longer used
- **Replaced by:** `Projects` table (RSVP fields added directly)
- **Migration complete:** Yes

### 2. **Event_RSVPs** ❌ DEPRECATED
- **Status:** No longer used
- **Replaced by:** `Event_Participants` table
- **Migration complete:** Yes

### 3. **Event_RSVP_Answers** ❌ DEPRECATED
- **Status:** No longer used
- **Replaced by:** `Form_Response_Answers` table
- **Migration complete:** Yes

### 4. **Project_RSVP_Questions** ❌ DEPRECATED
- **Status:** No longer used
- **Replaced by:** `Form_Fields` table with `Custom_Field_Configuration` JSON
- **Migration complete:** Yes

### 5. **Question_Options** ❌ DEPRECATED
- **Status:** No longer used
- **Replaced by:** JSON in `Form_Fields.Custom_Field_Configuration`
- **Migration complete:** Yes

### 6. **RSVP_Email_Campaigns** ❌ DEPRECATED
- **Status:** Email features not implemented yet
- **Action:** Drop table (can rebuild if needed later)

### 7. **RSVP_Email_Campaign_Conditions** ❌ DEPRECATED
- **Status:** Email features not implemented yet
- **Action:** Drop table (can rebuild if needed later)

### 8. **RSVP_Email_Campaign_Log** ❌ DEPRECATED
- **Status:** Email features not implemented yet
- **Action:** Drop table (can rebuild if needed later)

### 9. **RSVP_Statuses** ✅ KEEP
- **Status:** Pre-existing MP lookup table (NOT custom)
- **Used by:** Event_Participants.RSVP_Status_ID (FK reference)
- **Values:** 1=Yes, 2=No, 3=Maybe
- **Action:** Do not drop - this was mistakenly included because it has "RSVP" in the name

### 10. **Question_Types** ❓ MAYBE DROP
- **Status:** Used only by deprecated tables
- **Action:** Drop if no other systems use it
- **Check first:** Query for references

### 11. **Card_Types** ✅ KEEP
- **Status:** Still in use
- **Used by:** `Project_Confirmation_Cards` table
- **Action:** Do not drop

## Tables to Keep (Still in Use)

### Native MP Tables (Modified)
1. **Projects** - Added RSVP_* fields
2. **Events** - Added Project_ID, Include_In_RSVP, RSVP_Capacity, RSVP_Capacity_Modifier
3. **Event_Participants** - Added RSVP_Party_Size field
4. **Forms** - Native MP table (no modifications)
5. **Form_Fields** - Added Custom_Field_Configuration field
6. **Form_Responses** - Native MP table (no modifications)
7. **Form_Response_Answers** - Native MP table (no modifications)

### Custom Tables (Still in Use)
1. **Project_Confirmation_Cards** - Custom table for confirmation page cards
2. **Card_Types** - Lookup table for confirmation card types

### Pre-existing MP Lookup Tables
1. **RSVP_Statuses** - Pre-existing lookup table (1=Yes, 2=No, 3=Maybe)
   - Used by Event_Participants.RSVP_Status_ID

## Columns to Drop from Events Table

Based on the original Project_Events junction table, these fields were moved to Events but may no longer be needed:

### Fields from Project_Events Junction Table

Need to verify which of these are still used:
- **Project_ID** ✅ KEEP - Links event to project
- **Include_In_RSVP** ✅ KEEP - Boolean flag to show in RSVP widget
- **RSVP_Capacity** ✅ KEEP - Per-event capacity limit
- **RSVP_Capacity_Modifier** ✅ KEEP - Adjust displayed RSVP count

All fields are currently in use! No columns to drop from Events table.

## Note About Project_Events Table

**Project_Events is a NATIVE MinistryPlatform junction table**, not a custom table. While we moved the RSVP-specific fields (`Include_In_RSVP`, `RSVP_Capacity_Modifier`) to the Events table and no longer query Project_Events in our stored procedures, we should NOT drop this table because:

1. It's part of the standard MP schema
2. Other MP systems may rely on it
3. It's used for general project-event linking beyond just RSVP

**Action:** Keep Project_Events table. It appeared in verification queries because we searched for "Project" in table names, but it should remain untouched.

## Drop Order (Dependency Order)

Drop tables in this specific order to avoid foreign key conflicts:

```sql
-- Step 1: Drop child tables first (tables with foreign keys to others)
DROP TABLE IF EXISTS Event_RSVP_Answers;           -- References Event_RSVPs, Project_RSVP_Questions
DROP TABLE IF EXISTS RSVP_Email_Campaign_Log;      -- References RSVP_Email_Campaigns
DROP TABLE IF EXISTS RSVP_Email_Campaign_Conditions; -- References RSVP_Email_Campaigns
DROP TABLE IF EXISTS Question_Options;              -- References Project_RSVP_Questions

-- Step 2: Drop middle-tier tables
DROP TABLE IF EXISTS Event_RSVPs;                  -- References Project_RSVPs
DROP TABLE IF EXISTS Project_RSVP_Questions;       -- References Project_RSVPs, Question_Types
DROP TABLE IF EXISTS RSVP_Email_Campaigns;         -- References Project_RSVPs

-- Step 3: Drop parent tables and lookup tables
DROP TABLE IF EXISTS Project_RSVPs;                -- Parent table
-- Note: RSVP_Statuses is NOT dropped - it's a pre-existing MP lookup table
DROP TABLE IF EXISTS Question_Types;               -- Lookup table (check for other references first)
```

## Verification Queries

Before dropping tables, run these queries to verify they're truly unused:

### Check for Foreign Key References
```sql
-- Check if Question_Types is referenced by any other tables
SELECT
    OBJECT_NAME(fk.parent_object_id) AS referencing_table,
    OBJECT_NAME(fk.referenced_object_id) AS referenced_table,
    COL_NAME(fk.parent_object_id, fkc.parent_column_id) AS referencing_column
FROM sys.foreign_keys fk
INNER JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
WHERE OBJECT_NAME(fk.referenced_object_id) = 'Question_Types';
```

### Check Table Row Counts
```sql
-- Verify tables are empty or can be safely dropped
SELECT 'Project_RSVPs' AS table_name, COUNT(*) AS row_count FROM Project_RSVPs
UNION ALL
SELECT 'Event_RSVPs', COUNT(*) FROM Event_RSVPs
UNION ALL
SELECT 'Event_RSVP_Answers', COUNT(*) FROM Event_RSVP_Answers
UNION ALL
SELECT 'Project_RSVP_Questions', COUNT(*) FROM Project_RSVP_Questions
UNION ALL
SELECT 'Question_Options', COUNT(*) FROM Question_Options;
```

### Check for Stored Procedure References
```sql
-- Find stored procedures that reference deprecated tables
SELECT DISTINCT
    OBJECT_NAME(id) AS stored_procedure_name,
    OBJECT_DEFINITION(id) AS proc_definition
FROM sys.syscomments
WHERE text LIKE '%Project_RSVPs%'
   OR text LIKE '%Event_RSVPs%'
   OR text LIKE '%Event_RSVP_Answers%'
   OR text LIKE '%Project_RSVP_Questions%'
   OR text LIKE '%Question_Options%';
```

## Migration File

Will create: `/Database/Migrations/2025-11-20-cleanup-deprecated-rsvp-tables.sql`

## Testing Plan

After dropping tables:
1. ✅ Widget loads without errors
2. ✅ Can view available service times
3. ✅ Can submit RSVP successfully
4. ✅ Confirmation page displays correctly
5. ✅ Event_Participants record created
6. ✅ Form_Response and answers recorded
7. ✅ Capacity tracking works
8. ✅ No database errors in logs

## Rollback Plan

If issues arise after cleanup:
1. Restore database backup
2. Investigate which table/column is still needed
3. Update documentation
4. Rerun cleanup with corrections

## Timeline

- **Verification queries:** 15 minutes
- **Create migration script:** 15 minutes
- **Test on dev database:** 30 minutes
- **Execute on production:** 15 minutes
- **Verify widget works:** 15 minutes

**Total:** ~90 minutes
