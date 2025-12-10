-- =============================================
-- Make Slug field required on Projects table
-- Prerequisites: All projects must have a slug value before running this
-- =============================================

-- Verify all projects have slugs before making it required
DECLARE @projectsWithoutSlug INT;
SELECT @projectsWithoutSlug = COUNT(*)
FROM Projects
WHERE Slug IS NULL;

IF @projectsWithoutSlug > 0
BEGIN
    RAISERROR('Cannot make Slug required: %d project(s) still have NULL slugs. Please add slugs to all projects first.', 16, 1, @projectsWithoutSlug);
    RETURN;
END

-- Drop the unique index temporarily (if it exists)
IF EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'UQ_Projects_Slug'
    AND object_id = OBJECT_ID('Projects')
)
BEGIN
    DROP INDEX UQ_Projects_Slug ON Projects;
    PRINT 'Dropped unique index UQ_Projects_Slug';
END

-- Make Slug column NOT NULL
ALTER TABLE Projects
ALTER COLUMN Slug NVARCHAR(100) NOT NULL;

PRINT 'Slug column is now required (NOT NULL)';

-- Recreate the unique index (now without the WHERE clause since Slug is always NOT NULL)
CREATE UNIQUE NONCLUSTERED INDEX UQ_Projects_Slug
ON Projects(Slug);

PRINT 'Recreated unique index UQ_Projects_Slug';
GO

-- Verify the change
SELECT
    COLUMN_NAME,
    IS_NULLABLE,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Projects'
  AND COLUMN_NAME = 'Slug';
GO
