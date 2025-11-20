-- ===================================================================
-- Migration: Update Event_RSVPs to use Project_ID instead of Project_RSVP_ID
-- ===================================================================
-- Date: 2025-11-19
-- Purpose: Migrate Event_RSVPs table to reference Projects directly
--          instead of going through Project_RSVPs junction table
-- ===================================================================

USE [MinistryPlatform]
GO

PRINT '========================================';
PRINT 'Starting Event_RSVPs Migration';
PRINT '========================================';

-- ===================================================================
-- Step 1: Add Project_ID column if it doesn't exist
-- ===================================================================
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Event_RSVPs') AND name = 'Project_ID')
BEGIN
    EXEC('ALTER TABLE Event_RSVPs ADD Project_ID INT NULL')
    PRINT '  ✓ Added Project_ID column'
END
ELSE
BEGIN
    PRINT '  ✓ Project_ID column already exists'
END

GO

-- ===================================================================
-- Step 2: Migrate data from Project_RSVP_ID to Project_ID
-- ===================================================================
PRINT 'Migrating data from Project_RSVP_ID to Project_ID...'

UPDATE er
SET er.Project_ID = pr.Project_ID
FROM Event_RSVPs er
INNER JOIN Project_RSVPs pr ON er.Project_RSVP_ID = pr.Project_RSVP_ID
WHERE er.Project_ID IS NULL
  AND er.Project_RSVP_ID IS NOT NULL

PRINT '  ✓ Migrated ' + CAST(@@ROWCOUNT AS NVARCHAR) + ' rows'

GO

-- ===================================================================
-- Step 3: Add foreign key constraint
-- ===================================================================
IF NOT EXISTS (
    SELECT * FROM sys.foreign_keys
    WHERE name = 'FK_Event_RSVPs_Projects'
    AND parent_object_id = OBJECT_ID('Event_RSVPs')
)
BEGIN
    ALTER TABLE Event_RSVPs
    ADD CONSTRAINT FK_Event_RSVPs_Projects
    FOREIGN KEY (Project_ID) REFERENCES Projects(Project_ID)
    PRINT '  ✓ Added foreign key constraint to Projects'
END
ELSE
BEGIN
    PRINT '  ✓ Foreign key constraint already exists'
END

GO

-- ===================================================================
-- Step 4: Add index for performance
-- ===================================================================
IF NOT EXISTS (
    SELECT * FROM sys.indexes
    WHERE name = 'IX_Event_RSVPs_Project_ID'
    AND object_id = OBJECT_ID('Event_RSVPs')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_Event_RSVPs_Project_ID
    ON Event_RSVPs (Project_ID)
    INCLUDE (Event_ID, Contact_ID, Submission_Date)
    PRINT '  ✓ Created index on Project_ID'
END
ELSE
BEGIN
    PRINT '  ✓ Index already exists'
END

GO

-- ===================================================================
-- Validation: Check for any unmigrated rows
-- ===================================================================
PRINT ''
PRINT 'Validation:'

DECLARE @UnmigratedCount INT
SELECT @UnmigratedCount = COUNT(*)
FROM Event_RSVPs
WHERE Project_ID IS NULL
  AND Project_RSVP_ID IS NOT NULL

IF @UnmigratedCount > 0
BEGIN
    PRINT '  ⚠ WARNING: ' + CAST(@UnmigratedCount AS NVARCHAR) + ' rows still have NULL Project_ID'
    PRINT '  These rows could not be migrated (orphaned Project_RSVP_ID values)'
END
ELSE
BEGIN
    PRINT '  ✓ All rows successfully migrated'
END

-- Check total counts
DECLARE @TotalRows INT
SELECT @TotalRows = COUNT(*) FROM Event_RSVPs
PRINT '  ✓ Total rows in Event_RSVPs: ' + CAST(@TotalRows AS NVARCHAR)

GO

-- ===================================================================
-- Step 5: Drop foreign key constraint on Project_RSVP_ID (if exists)
-- ===================================================================
IF EXISTS (
    SELECT * FROM sys.foreign_keys
    WHERE name = 'FK_Event_RSVPs_Project_RSVPs'
    AND parent_object_id = OBJECT_ID('Event_RSVPs')
)
BEGIN
    ALTER TABLE Event_RSVPs
    DROP CONSTRAINT FK_Event_RSVPs_Project_RSVPs
    PRINT '  ✓ Dropped foreign key constraint FK_Event_RSVPs_Project_RSVPs'
END
ELSE
BEGIN
    PRINT '  ✓ No FK constraint to drop'
END

GO

-- ===================================================================
-- Step 6: Drop the Project_RSVP_ID column
-- ===================================================================
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Event_RSVPs') AND name = 'Project_RSVP_ID')
BEGIN
    ALTER TABLE Event_RSVPs
    DROP COLUMN Project_RSVP_ID
    PRINT '  ✓ Dropped Project_RSVP_ID column'
END
ELSE
BEGIN
    PRINT '  ✓ Project_RSVP_ID column already removed'
END

GO

PRINT ''
PRINT '========================================';
PRINT 'Event_RSVPs Migration Complete!';
PRINT '========================================';
PRINT ''
PRINT 'Summary:'
PRINT '  - Added Project_ID column'
PRINT '  - Migrated data from Project_RSVP_ID to Project_ID'
PRINT '  - Added foreign key constraint to Projects'
PRINT '  - Created index on Project_ID'
PRINT '  - Dropped Project_RSVP_ID column'
PRINT ''

GO
