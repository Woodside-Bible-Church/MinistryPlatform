-- ===================================================================
-- Migration: Cleanup Deprecated RSVP Tables
-- Date: 2025-11-20
-- ===================================================================
-- This script drops the deprecated custom RSVP tables that have been
-- replaced by native MinistryPlatform tables.
--
-- PREREQUISITE: RSVP system must be fully migrated to use:
-- - Projects (with RSVP_* fields)
-- - Events (with Project_ID, RSVP_Capacity, etc.)
-- - Event_Participants (with RSVP_Party_Size)
-- - Forms / Form_Fields (with Custom_Field_Configuration)
--
-- WARNING: This is destructive! Create a database backup first.
-- ===================================================================

USE [MinistryPlatform]
GO

PRINT '========================================';
PRINT 'RSVP Table Cleanup Migration';
PRINT 'Starting: ' + CONVERT(VARCHAR, GETDATE(), 120);
PRINT '========================================';
PRINT '';

-- ===================================================================
-- STEP 1: Verification Queries
-- ===================================================================
PRINT 'STEP 1: Verifying tables are safe to drop...';
PRINT '';

-- Check row counts in tables to be dropped
PRINT 'Row counts in deprecated tables:';
SELECT 'Project_RSVPs' AS table_name, COUNT(*) AS row_count FROM Project_RSVPs
UNION ALL
SELECT 'Event_RSVPs', COUNT(*) FROM Event_RSVPs
UNION ALL
SELECT 'Event_RSVP_Answers', COUNT(*) FROM Event_RSVP_Answers
UNION ALL
SELECT 'Project_RSVP_Questions', COUNT(*) FROM Project_RSVP_Questions
UNION ALL
SELECT 'Question_Options', COUNT(*) FROM Question_Options
UNION ALL
SELECT 'RSVP_Email_Campaigns', COUNT(*) FROM RSVP_Email_Campaigns
UNION ALL
SELECT 'RSVP_Email_Campaign_Conditions', COUNT(*) FROM RSVP_Email_Campaign_Conditions
UNION ALL
SELECT 'RSVP_Email_Campaign_Log', COUNT(*) FROM RSVP_Email_Campaign_Log
UNION ALL
SELECT 'RSVP_Statuses', COUNT(*) FROM RSVP_Statuses;

PRINT '';
PRINT 'Checking for foreign key references to Question_Types...';
SELECT
    OBJECT_NAME(fk.parent_object_id) AS referencing_table,
    OBJECT_NAME(fk.referenced_object_id) AS referenced_table,
    COL_NAME(fk.parent_object_id, fkc.parent_column_id) AS referencing_column
FROM sys.foreign_keys fk
INNER JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
WHERE OBJECT_NAME(fk.referenced_object_id) = 'Question_Types';

PRINT '';
PRINT 'NOTE: If Question_Types is referenced by other tables besides the ones being dropped,';
PRINT '      it will be preserved. Otherwise it will be dropped.';
PRINT '';

-- ===================================================================
-- STEP 2: Drop Foreign Key Constraints
-- ===================================================================
PRINT 'STEP 2: Dropping foreign key constraints...';
PRINT '';

-- Get all foreign keys for tables we're about to drop
DECLARE @sql NVARCHAR(MAX) = '';

SELECT @sql = @sql + 'ALTER TABLE ' + QUOTENAME(OBJECT_SCHEMA_NAME(fk.parent_object_id)) + '.' + QUOTENAME(OBJECT_NAME(fk.parent_object_id)) +
              ' DROP CONSTRAINT ' + QUOTENAME(fk.name) + ';' + CHAR(13) + CHAR(10)
FROM sys.foreign_keys fk
WHERE OBJECT_NAME(fk.parent_object_id) IN (
    'Event_RSVP_Answers',
    'Event_RSVPs',
    'Project_RSVP_Questions',
    'Question_Options',
    'RSVP_Email_Campaigns',
    'RSVP_Email_Campaign_Conditions',
    'RSVP_Email_Campaign_Log'
)
   OR OBJECT_NAME(fk.referenced_object_id) IN (
    'Project_RSVPs',
    'Event_RSVPs',
    'Project_RSVP_Questions',
    'Question_Types',
    'RSVP_Statuses'
);

IF LEN(@sql) > 0
BEGIN
    PRINT 'Executing foreign key drops:';
    PRINT @sql;
    EXEC sp_executesql @sql;
    PRINT 'Foreign keys dropped successfully.';
END
ELSE
BEGIN
    PRINT 'No foreign keys found to drop.';
END

PRINT '';

-- ===================================================================
-- STEP 3: Drop Tables in Dependency Order
-- ===================================================================
PRINT 'STEP 3: Dropping deprecated tables...';
PRINT '';

-- Child tables first (tables with foreign keys to others)
IF OBJECT_ID('dbo.Event_RSVP_Answers', 'U') IS NOT NULL
BEGIN
    PRINT 'Dropping table: Event_RSVP_Answers';
    DROP TABLE dbo.Event_RSVP_Answers;
    PRINT '✓ Event_RSVP_Answers dropped';
END
ELSE
    PRINT '- Event_RSVP_Answers already dropped or does not exist';

IF OBJECT_ID('dbo.RSVP_Email_Campaign_Log', 'U') IS NOT NULL
BEGIN
    PRINT 'Dropping table: RSVP_Email_Campaign_Log';
    DROP TABLE dbo.RSVP_Email_Campaign_Log;
    PRINT '✓ RSVP_Email_Campaign_Log dropped';
END
ELSE
    PRINT '- RSVP_Email_Campaign_Log already dropped or does not exist';

IF OBJECT_ID('dbo.RSVP_Email_Campaign_Conditions', 'U') IS NOT NULL
BEGIN
    PRINT 'Dropping table: RSVP_Email_Campaign_Conditions';
    DROP TABLE dbo.RSVP_Email_Campaign_Conditions;
    PRINT '✓ RSVP_Email_Campaign_Conditions dropped';
END
ELSE
    PRINT '- RSVP_Email_Campaign_Conditions already dropped or does not exist';

IF OBJECT_ID('dbo.Question_Options', 'U') IS NOT NULL
BEGIN
    PRINT 'Dropping table: Question_Options';
    DROP TABLE dbo.Question_Options;
    PRINT '✓ Question_Options dropped';
END
ELSE
    PRINT '- Question_Options already dropped or does not exist';

PRINT '';

-- Middle-tier tables
IF OBJECT_ID('dbo.Event_RSVPs', 'U') IS NOT NULL
BEGIN
    PRINT 'Dropping table: Event_RSVPs';
    DROP TABLE dbo.Event_RSVPs;
    PRINT '✓ Event_RSVPs dropped';
END
ELSE
    PRINT '- Event_RSVPs already dropped or does not exist';

IF OBJECT_ID('dbo.Project_RSVP_Questions', 'U') IS NOT NULL
BEGIN
    PRINT 'Dropping table: Project_RSVP_Questions';
    DROP TABLE dbo.Project_RSVP_Questions;
    PRINT '✓ Project_RSVP_Questions dropped';
END
ELSE
    PRINT '- Project_RSVP_Questions already dropped or does not exist';

IF OBJECT_ID('dbo.RSVP_Email_Campaigns', 'U') IS NOT NULL
BEGIN
    PRINT 'Dropping table: RSVP_Email_Campaigns';
    DROP TABLE dbo.RSVP_Email_Campaigns;
    PRINT '✓ RSVP_Email_Campaigns dropped';
END
ELSE
    PRINT '- RSVP_Email_Campaigns already dropped or does not exist';

PRINT '';

-- Parent tables and lookup tables
IF OBJECT_ID('dbo.Project_RSVPs', 'U') IS NOT NULL
BEGIN
    PRINT 'Dropping table: Project_RSVPs';
    DROP TABLE dbo.Project_RSVPs;
    PRINT '✓ Project_RSVPs dropped';
END
ELSE
    PRINT '- Project_RSVPs already dropped or does not exist';

IF OBJECT_ID('dbo.RSVP_Statuses', 'U') IS NOT NULL
BEGIN
    PRINT 'Dropping table: RSVP_Statuses';
    DROP TABLE dbo.RSVP_Statuses;
    PRINT '✓ RSVP_Statuses dropped';
END
ELSE
    PRINT '- RSVP_Statuses already dropped or does not exist';

-- Check if Question_Types is safe to drop (only drop if no other tables reference it)
DECLARE @questionTypesReferences INT = 0;
SELECT @questionTypesReferences = COUNT(*)
FROM sys.foreign_keys fk
WHERE OBJECT_NAME(fk.referenced_object_id) = 'Question_Types'
  AND OBJECT_NAME(fk.parent_object_id) NOT IN (
    'Event_RSVP_Answers',
    'Event_RSVPs',
    'Project_RSVP_Questions',
    'Question_Options'
  );

IF @questionTypesReferences = 0 AND OBJECT_ID('dbo.Question_Types', 'U') IS NOT NULL
BEGIN
    PRINT 'Dropping table: Question_Types (no other references found)';
    DROP TABLE dbo.Question_Types;
    PRINT '✓ Question_Types dropped';
END
ELSE IF @questionTypesReferences > 0
    PRINT '- Question_Types preserved (still referenced by other tables)';
ELSE
    PRINT '- Question_Types already dropped or does not exist';

PRINT '';

-- ===================================================================
-- STEP 4: Verification
-- ===================================================================
PRINT 'STEP 4: Verifying cleanup...';
PRINT '';

PRINT 'Remaining RSVP-related tables:';
SELECT
    t.name AS table_name,
    CASE
        WHEN t.name IN ('Projects', 'Events', 'Event_Participants', 'Forms', 'Form_Fields', 'Form_Responses', 'Form_Response_Answers')
            THEN 'Native MP (in use)'
        WHEN t.name IN ('Project_Confirmation_Cards', 'Card_Types')
            THEN 'Custom (in use)'
        ELSE 'Unknown'
    END AS status
FROM sys.tables t
WHERE t.name LIKE '%RSVP%'
   OR t.name LIKE '%Project%'
   OR t.name IN ('Card_Types', 'Question_Types')
ORDER BY status, t.name;

PRINT '';
PRINT '========================================';
PRINT 'Migration completed successfully!';
PRINT 'Finished: ' + CONVERT(VARCHAR, GETDATE(), 120);
PRINT '========================================';
PRINT '';
PRINT 'NEXT STEPS:';
PRINT '1. Test RSVP widget functionality';
PRINT '2. Verify Event_Participants records are being created';
PRINT '3. Check that no errors appear in application logs';
PRINT '4. Monitor for any issues over the next few days';
PRINT '';

GO
