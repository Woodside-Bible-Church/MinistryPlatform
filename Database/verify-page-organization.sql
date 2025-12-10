-- Verify budget pages organization

USE MinistryPlatform;
GO

PRINT 'Budget Pages in Projects Page_Section:';
SELECT ps.Page_Section, p.Display_Name, p.Page_ID
FROM dp_Page_Section_Pages psp
INNER JOIN dp_Page_Sections ps ON psp.Page_Section_ID = ps.Page_Section_ID
INNER JOIN dp_Pages p ON psp.Page_ID = p.Page_ID
WHERE ps.Page_Section = 'Projects'
    AND p.Table_Name LIKE 'Project_Budget%'
ORDER BY p.Display_Name;

PRINT '';
PRINT 'Budget Sub Pages (Tabs) on Projects:';
SELECT
    sp.Display_Name AS Tab_Name,
    sp.View_Order,
    parent.Display_Name AS Parent_Page,
    target.Display_Name AS Target_Page
FROM dp_Sub_Pages sp
INNER JOIN dp_Pages parent ON sp.Parent_Page_ID = parent.Page_ID
INNER JOIN dp_Pages target ON sp.Target_Page_ID = target.Page_ID
WHERE parent.Table_Name = 'Projects'
    AND target.Table_Name LIKE 'Project_Budget%'
ORDER BY sp.View_Order;

GO
