-- ===================================================================
-- Find ALL references to dropped table pages in MP metadata
-- ===================================================================

USE [MinistryPlatform]
GO

DECLARE @DroppedTableNames TABLE (Table_Name NVARCHAR(255));
INSERT INTO @DroppedTableNames VALUES
    ('Project_RSVPs'),
    ('Event_RSVPs'),
    ('Event_RSVP_Answers'),
    ('Project_RSVP_Questions'),
    ('Question_Options'),
    ('RSVP_Email_Campaigns'),
    ('RSVP_Email_Campaign_Conditions'),
    ('RSVP_Email_Campaign_Log');

DECLARE @PageIDs TABLE (Page_ID INT);
INSERT INTO @PageIDs
SELECT Page_ID FROM dp_Pages WHERE Table_Name IN (SELECT Table_Name FROM @DroppedTableNames);

PRINT '========================================';
PRINT 'Finding ALL Page References';
PRINT '========================================';
PRINT '';

-- Check dp_Pages
PRINT '1. Pages that still exist:';
SELECT Page_ID, Display_Name, Table_Name FROM dp_Pages WHERE Page_ID IN (SELECT Page_ID FROM @PageIDs);
PRINT '';

-- Check dp_Sub_Pages
PRINT '2. Sub_Pages references:';
SELECT Sub_Page_ID, Display_Name, Parent_Page_ID, Target_Page_ID
FROM dp_Sub_Pages
WHERE Parent_Page_ID IN (SELECT Page_ID FROM @PageIDs)
   OR Target_Page_ID IN (SELECT Page_ID FROM @PageIDs);
PRINT '';

-- Check dp_Role_Pages
PRINT '3. Role_Pages references:';
SELECT Role_Page_ID, Role_ID, Page_ID FROM dp_Role_Pages WHERE Page_ID IN (SELECT Page_ID FROM @PageIDs);
PRINT '';

-- Check dp_Page_Section_Pages
PRINT '4. Page_Section_Pages (navigation) references:';
SELECT * FROM dp_Page_Section_Pages WHERE Page_ID IN (SELECT Page_ID FROM @PageIDs);
PRINT '';

-- Check dp_Page_Views
PRINT '5. Page_Views references:';
IF OBJECT_ID('dp_Page_Views', 'U') IS NOT NULL
    SELECT * FROM dp_Page_Views WHERE Page_ID IN (SELECT Page_ID FROM @PageIDs);
ELSE
    PRINT 'Table dp_Page_Views does not exist';
PRINT '';

-- Check for any other tables with Page_ID columns
PRINT '6. Other tables with Page_ID references:';
SELECT DISTINCT
    t.name AS table_name,
    c.name AS column_name
FROM sys.columns c
INNER JOIN sys.tables t ON c.object_id = t.object_id
WHERE c.name LIKE '%Page_ID%'
  AND t.name LIKE 'dp_%'
  AND t.name NOT IN ('dp_Pages', 'dp_Sub_Pages', 'dp_Role_Pages', 'dp_Page_Section_Pages', 'dp_Page_Views')
ORDER BY t.name;

PRINT '';
PRINT '========================================';

GO
