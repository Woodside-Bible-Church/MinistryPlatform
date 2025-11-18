-- ===================================================================
-- Add Campus Slug Field to Congregations Table
-- ===================================================================
-- This enables friendly URL parameters like ?campus=lake-orion
-- ===================================================================

-- Add Campus_Slug column if it doesn't exist
IF NOT EXISTS (
    SELECT * FROM sys.columns
    WHERE object_id = OBJECT_ID(N'[dbo].[Congregations]')
    AND name = 'Campus_Slug'
)
BEGIN
    ALTER TABLE [dbo].[Congregations]
    ADD [Campus_Slug] NVARCHAR(50) NULL;
    PRINT 'Added Campus_Slug column to Congregations table';
END
GO

-- Update existing congregations with slugs based on their names
-- Convert congregation names to URL-friendly slugs
UPDATE [dbo].[Congregations]
SET [Campus_Slug] =
    LOWER(
        REPLACE(
            REPLACE(
                REPLACE(
                    REPLACE([Congregation_Name], ' ', '-'),
                '.', ''),
            '''', ''),
        '/', '-')
    )
WHERE [Campus_Slug] IS NULL;

PRINT 'Generated slugs for existing congregations';
GO

-- Example manual overrides if needed:
-- UPDATE [dbo].[Congregations] SET [Campus_Slug] = 'lake-orion' WHERE [Congregation_Name] = 'Lake Orion';
-- UPDATE [dbo].[Congregations] SET [Campus_Slug] = 'algonac' WHERE [Congregation_Name] = 'Algonac';
-- UPDATE [dbo].[Congregations] SET [Campus_Slug] = 'romeo' WHERE [Congregation_Name] = 'Romeo';

-- Display results
SELECT
    Congregation_ID,
    Congregation_Name,
    Campus_Slug
FROM [dbo].[Congregations]
ORDER BY Congregation_Name;
