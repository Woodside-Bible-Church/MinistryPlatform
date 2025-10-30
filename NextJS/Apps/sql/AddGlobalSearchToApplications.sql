-- =============================================
-- Author:      Ministry Platform Integration
-- Create date: 2025-10-30
-- Description: Add global search capabilities to Applications table
-- Usage:       Run this script in SQL Server Management Studio
-- =============================================

-- Add columns for global search if they don't exist
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Applications') AND name = 'Searchable')
BEGIN
    ALTER TABLE dbo.Applications
    ADD Searchable BIT NOT NULL DEFAULT 0;

    PRINT 'Added Searchable column to Applications table';
END
ELSE
BEGIN
    PRINT 'Searchable column already exists in Applications table';
END

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Applications') AND name = 'Search_Endpoint')
BEGIN
    ALTER TABLE dbo.Applications
    ADD Search_Endpoint NVARCHAR(255) NULL;

    PRINT 'Added Search_Endpoint column to Applications table';
END
ELSE
BEGIN
    PRINT 'Search_Endpoint column already exists in Applications table';
END

GO

-- =============================================
-- Mark People Search as searchable
-- =============================================
UPDATE dbo.Applications
SET Searchable = 1,
    Search_Endpoint = '/api/people-search/global-search'
WHERE Application_Key = 'people-search';

-- =============================================
-- Example: Mark Counter as searchable (name only, no content)
-- =============================================
/*
UPDATE dbo.Applications
SET Searchable = 0,  -- Not searchable for content, only name matching
    Search_Endpoint = NULL
WHERE Application_Key = 'counter';
*/

GO

-- Verify changes
SELECT
    Application_ID,
    Application_Name,
    Application_Key,
    Searchable,
    Search_Endpoint
FROM dbo.Applications
ORDER BY Application_Name;
