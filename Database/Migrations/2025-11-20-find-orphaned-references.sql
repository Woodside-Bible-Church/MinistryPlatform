-- ===================================================================
-- Query: Find Orphaned References to Dropped Tables
-- Date: 2025-11-20
-- ===================================================================
-- This script finds foreign keys, triggers, and other references
-- to the dropped RSVP tables that may be causing errors
-- ===================================================================

USE [MinistryPlatform]
GO

PRINT '========================================';
PRINT 'Finding Orphaned References';
PRINT '========================================';
PRINT '';

-- ===================================================================
-- Check for Foreign Keys referencing dropped tables
-- ===================================================================
PRINT 'Foreign keys referencing dropped tables:';
PRINT '';

SELECT
    'FK: ' + fk.name AS constraint_name,
    OBJECT_SCHEMA_NAME(fk.parent_object_id) + '.' + OBJECT_NAME(fk.parent_object_id) AS referencing_table,
    OBJECT_SCHEMA_NAME(fk.referenced_object_id) + '.' + OBJECT_NAME(fk.referenced_object_id) AS referenced_table,
    COL_NAME(fk.parent_object_id, fkc.parent_column_id) AS referencing_column,
    COL_NAME(fk.referenced_object_id, fkc.referenced_column_id) AS referenced_column,
    'DROP: ALTER TABLE ' + QUOTENAME(OBJECT_SCHEMA_NAME(fk.parent_object_id)) + '.' +
        QUOTENAME(OBJECT_NAME(fk.parent_object_id)) + ' DROP CONSTRAINT ' + QUOTENAME(fk.name) + ';' AS drop_command
FROM sys.foreign_keys fk
INNER JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
WHERE OBJECT_NAME(fk.referenced_object_id) IN (
    'Project_RSVPs',
    'Event_RSVPs',
    'Event_RSVP_Answers',
    'Project_RSVP_Questions',
    'Question_Options',
    'RSVP_Email_Campaigns',
    'RSVP_Email_Campaign_Conditions',
    'RSVP_Email_Campaign_Log'
)
   OR OBJECT_NAME(fk.parent_object_id) IN (
    'Project_RSVPs',
    'Event_RSVPs',
    'Event_RSVP_Answers',
    'Project_RSVP_Questions',
    'Question_Options',
    'RSVP_Email_Campaigns',
    'RSVP_Email_Campaign_Conditions',
    'RSVP_Email_Campaign_Log'
);

PRINT '';
PRINT '========================================';

-- ===================================================================
-- Check for Triggers referencing dropped tables
-- ===================================================================
PRINT 'Triggers that may reference dropped tables:';
PRINT '';

SELECT
    'TRIGGER: ' + t.name AS trigger_name,
    OBJECT_SCHEMA_NAME(t.parent_id) + '.' + OBJECT_NAME(t.parent_id) AS table_name,
    t.type_desc,
    'DROP: DROP TRIGGER ' + QUOTENAME(OBJECT_SCHEMA_NAME(t.parent_id)) + '.' + QUOTENAME(t.name) + ';' AS drop_command
FROM sys.triggers t
WHERE OBJECT_NAME(t.parent_id) IN (
    'Event_Participants',
    'Events',
    'Projects',
    'Form_Responses',
    'Form_Response_Answers'
)
  AND (
    OBJECT_DEFINITION(t.object_id) LIKE '%Event_RSVPs%'
    OR OBJECT_DEFINITION(t.object_id) LIKE '%Event_RSVP_Answers%'
    OR OBJECT_DEFINITION(t.object_id) LIKE '%Project_RSVPs%'
    OR OBJECT_DEFINITION(t.object_id) LIKE '%Project_RSVP_Questions%'
  );

PRINT '';
PRINT '========================================';

-- ===================================================================
-- Check for Stored Procedures referencing dropped tables
-- ===================================================================
PRINT 'Stored procedures that reference dropped tables:';
PRINT '';

SELECT DISTINCT
    'PROC: ' + OBJECT_SCHEMA_NAME(o.object_id) + '.' + o.name AS proc_name,
    CASE
        WHEN OBJECT_DEFINITION(o.object_id) LIKE '%Event_RSVPs%' THEN 'References Event_RSVPs'
        WHEN OBJECT_DEFINITION(o.object_id) LIKE '%Project_RSVPs%' THEN 'References Project_RSVPs'
        WHEN OBJECT_DEFINITION(o.object_id) LIKE '%Event_RSVP_Answers%' THEN 'References Event_RSVP_Answers'
        WHEN OBJECT_DEFINITION(o.object_id) LIKE '%Project_RSVP_Questions%' THEN 'References Project_RSVP_Questions'
    END AS reference_type
FROM sys.objects o
WHERE o.type = 'P'  -- Stored Procedures
  AND (
    OBJECT_DEFINITION(o.object_id) LIKE '%Event_RSVPs%'
    OR OBJECT_DEFINITION(o.object_id) LIKE '%Event_RSVP_Answers%'
    OR OBJECT_DEFINITION(o.object_id) LIKE '%Project_RSVPs%'
    OR OBJECT_DEFINITION(o.object_id) LIKE '%Project_RSVP_Questions%'
  )
ORDER BY proc_name;

PRINT '';
PRINT '========================================';

-- ===================================================================
-- Check for Views referencing dropped tables
-- ===================================================================
PRINT 'Views that reference dropped tables:';
PRINT '';

SELECT DISTINCT
    'VIEW: ' + OBJECT_SCHEMA_NAME(o.object_id) + '.' + o.name AS view_name,
    CASE
        WHEN OBJECT_DEFINITION(o.object_id) LIKE '%Event_RSVPs%' THEN 'References Event_RSVPs'
        WHEN OBJECT_DEFINITION(o.object_id) LIKE '%Project_RSVPs%' THEN 'References Project_RSVPs'
        WHEN OBJECT_DEFINITION(o.object_id) LIKE '%Event_RSVP_Answers%' THEN 'References Event_RSVP_Answers'
        WHEN OBJECT_DEFINITION(o.object_id) LIKE '%Project_RSVP_Questions%' THEN 'References Project_RSVP_Questions'
    END AS reference_type
FROM sys.objects o
WHERE o.type = 'V'  -- Views
  AND (
    OBJECT_DEFINITION(o.object_id) LIKE '%Event_RSVPs%'
    OR OBJECT_DEFINITION(o.object_id) LIKE '%Event_RSVP_Answers%'
    OR OBJECT_DEFINITION(o.object_id) LIKE '%Project_RSVPs%'
    OR OBJECT_DEFINITION(o.object_id) LIKE '%Project_RSVP_Questions%'
  )
ORDER BY view_name;

PRINT '';
PRINT '========================================';
PRINT 'Search complete.';
PRINT '========================================';

GO
