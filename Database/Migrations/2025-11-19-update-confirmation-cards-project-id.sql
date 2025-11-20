-- ===================================================================
-- Migration: Update Project_Confirmation_Cards to use Project_ID
-- ===================================================================
-- Date: 2025-11-19
-- Purpose: Replace Project_RSVP_ID with Project_ID to use Projects table directly
-- ===================================================================

USE [MinistryPlatform]
GO

PRINT '========================================'
PRINT 'Updating Project_Confirmation_Cards to use Project_ID'
PRINT '========================================'

-- ===================================================================
-- Step 1: Add Project_ID column if it doesn't exist
-- ===================================================================
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Project_Confirmation_Cards') AND name = 'Project_ID')
BEGIN
    ALTER TABLE Project_Confirmation_Cards
    ADD Project_ID INT NULL
    PRINT '  ✓ Added Project_ID column to Project_Confirmation_Cards table'
END
ELSE
BEGIN
    PRINT '  ✓ Project_ID column already exists'
END

GO

-- ===================================================================
-- Step 2: Migrate data from Project_RSVP_ID to Project_ID
-- ===================================================================
-- If you have existing data in Project_RSVP_ID, migrate it to Project_ID
-- This assumes Project_RSVPs.Project_ID exists
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Project_Confirmation_Cards') AND name = 'Project_RSVP_ID')
   AND EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('Project_RSVPs'))
BEGIN
    UPDATE pcc
    SET pcc.Project_ID = pr.Project_ID
    FROM Project_Confirmation_Cards pcc
    INNER JOIN Project_RSVPs pr ON pcc.Project_RSVP_ID = pr.Project_RSVP_ID
    WHERE pcc.Project_ID IS NULL

    DECLARE @UpdatedRows INT = @@ROWCOUNT
    PRINT '  ✓ Migrated ' + CAST(@UpdatedRows AS NVARCHAR) + ' rows from Project_RSVP_ID to Project_ID'
END
ELSE
BEGIN
    PRINT '  ℹ No migration needed (Project_RSVPs table not found or already migrated)'
END

GO

-- ===================================================================
-- Step 3: Make Project_ID NOT NULL once data is migrated
-- ===================================================================
-- First check if all rows have Project_ID populated
DECLARE @NullCount INT
SELECT @NullCount = COUNT(*)
FROM Project_Confirmation_Cards
WHERE Project_ID IS NULL

IF @NullCount = 0
BEGIN
    -- Make Project_ID NOT NULL
    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Project_Confirmation_Cards') AND name = 'Project_ID' AND is_nullable = 1)
    BEGIN
        ALTER TABLE Project_Confirmation_Cards
        ALTER COLUMN Project_ID INT NOT NULL
        PRINT '  ✓ Made Project_ID NOT NULL'
    END
    ELSE
    BEGIN
        PRINT '  ✓ Project_ID is already NOT NULL'
    END
END
ELSE
BEGIN
    PRINT '  ⚠ Warning: ' + CAST(@NullCount AS NVARCHAR) + ' rows have NULL Project_ID - skipping NOT NULL constraint'
    PRINT '  ⚠ Please populate Project_ID for all rows before making it NOT NULL'
END

GO

-- ===================================================================
-- Step 4: Add foreign key constraint to Projects table
-- ===================================================================
IF NOT EXISTS (
    SELECT * FROM sys.foreign_keys
    WHERE name = 'FK_Project_Confirmation_Cards_Projects'
    AND parent_object_id = OBJECT_ID('Project_Confirmation_Cards')
)
BEGIN
    -- Only add FK if all rows have valid Project_ID
    IF NOT EXISTS (
        SELECT 1
        FROM Project_Confirmation_Cards pcc
        LEFT JOIN Projects p ON pcc.Project_ID = p.Project_ID
        WHERE pcc.Project_ID IS NOT NULL AND p.Project_ID IS NULL
    )
    BEGIN
        ALTER TABLE Project_Confirmation_Cards
        ADD CONSTRAINT FK_Project_Confirmation_Cards_Projects
        FOREIGN KEY (Project_ID) REFERENCES Projects(Project_ID)
        PRINT '  ✓ Added foreign key constraint to Projects table'
    END
    ELSE
    BEGIN
        PRINT '  ⚠ Warning: Some Project_ID values do not exist in Projects table'
        PRINT '  ⚠ Foreign key constraint not added - fix data first'
    END
END
ELSE
BEGIN
    PRINT '  ✓ Foreign key constraint already exists'
END

GO

-- ===================================================================
-- Step 5: Add index on Project_ID for performance
-- ===================================================================
IF NOT EXISTS (
    SELECT * FROM sys.indexes
    WHERE name = 'IX_Project_Confirmation_Cards_Project_ID'
    AND object_id = OBJECT_ID('Project_Confirmation_Cards')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_Project_Confirmation_Cards_Project_ID
    ON Project_Confirmation_Cards(Project_ID)
    PRINT '  ✓ Added index on Project_ID'
END
ELSE
BEGIN
    PRINT '  ✓ Index on Project_ID already exists'
END

GO

PRINT ''
PRINT '========================================'
PRINT 'Migration Complete!'
PRINT '========================================'
PRINT ''
PRINT 'Summary:'
PRINT '  - Added Project_ID column to Project_Confirmation_Cards'
PRINT '  - Migrated data from Project_RSVP_ID (if applicable)'
PRINT '  - Made Project_ID NOT NULL (if all rows populated)'
PRINT '  - Added foreign key to Projects table'
PRINT '  - Added index for performance'
PRINT ''
PRINT 'Note: Project_RSVP_ID column is NOT dropped yet'
PRINT '      It will be removed when Project_RSVPs table is dropped'
PRINT ''

GO
