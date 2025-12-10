-- =============================================
-- Add Slug field to Projects table
-- This duplicates RSVP_Slug functionality but broadens it for all projects
-- IMPORTANT: Do NOT delete RSVP_Slug as it's being used by live RSVP project
-- =============================================

-- Check if the column already exists before adding
IF NOT EXISTS (
    SELECT 1
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'Projects'
    AND COLUMN_NAME = 'Slug'
)
BEGIN
    -- Add the new Slug column (nullable, NVARCHAR(100), unique)
    ALTER TABLE Projects
    ADD Slug NVARCHAR(100) NULL;

    PRINT 'Added Slug column to Projects table';
END
ELSE
BEGIN
    PRINT 'Slug column already exists in Projects table';
END
GO

-- Migrate existing RSVP_Slug data to new Slug column
UPDATE Projects
SET Slug = RSVP_Slug
WHERE RSVP_Slug IS NOT NULL
  AND Slug IS NULL;

PRINT 'Migrated existing RSVP_Slug data to Slug column';
GO

-- Add unique constraint on Slug (only for non-null values)
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'UQ_Projects_Slug'
    AND object_id = OBJECT_ID('Projects')
)
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX UQ_Projects_Slug
    ON Projects(Slug)
    WHERE Slug IS NOT NULL;

    PRINT 'Added unique constraint on Slug column';
END
ELSE
BEGIN
    PRINT 'Unique constraint on Slug already exists';
END
GO

-- Verify the migration
SELECT
    Project_ID,
    Project_Title,
    RSVP_Slug,
    Slug,
    CASE
        WHEN RSVP_Slug IS NOT NULL AND Slug IS NULL THEN 'Migration needed'
        WHEN RSVP_Slug IS NOT NULL AND Slug IS NOT NULL THEN 'Migrated'
        WHEN RSVP_Slug IS NULL AND Slug IS NULL THEN 'No slug'
        ELSE 'Check manually'
    END AS Migration_Status
FROM Projects
ORDER BY Project_ID;
GO
