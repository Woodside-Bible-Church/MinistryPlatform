-- Verify fixed sub pages structure

USE MinistryPlatform;
GO

PRINT 'Sub Pages on Projects:';
SELECT
    sp.Display_Name AS Tab_Name,
    sp.View_Order,
    sp.Default_Field_List,
    target.Display_Name AS Target_Page
FROM dp_Sub_Pages sp
INNER JOIN dp_Pages parent ON sp.Parent_Page_ID = parent.Page_ID
INNER JOIN dp_Pages target ON sp.Target_Page_ID = target.Page_ID
WHERE parent.Table_Name = 'Projects'
    AND target.Table_Name LIKE 'Project_Budget%'
ORDER BY sp.View_Order;

PRINT '';
PRINT 'Sub Pages on Budget Categories:';
SELECT
    sp.Display_Name AS Tab_Name,
    sp.View_Order,
    sp.Default_Field_List,
    target.Display_Name AS Target_Page
FROM dp_Sub_Pages sp
INNER JOIN dp_Pages parent ON sp.Parent_Page_ID = parent.Page_ID
INNER JOIN dp_Pages target ON sp.Target_Page_ID = target.Page_ID
WHERE parent.Table_Name = 'Project_Budget_Categories'
ORDER BY sp.View_Order;

GO
