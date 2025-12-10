-- Verify Administrator role has access to budget sub pages

USE MinistryPlatform;
GO

SELECT
    r.Role_Name,
    sp.Display_Name AS Sub_Page_Name,
    rsp.Access_Level,
    parent.Display_Name AS Parent_Page,
    target.Display_Name AS Target_Page
FROM dp_Role_Sub_Pages rsp
INNER JOIN dp_Roles r ON rsp.Role_ID = r.Role_ID
INNER JOIN dp_Sub_Pages sp ON rsp.Sub_Page_ID = sp.Sub_Page_ID
INNER JOIN dp_Pages parent ON sp.Parent_Page_ID = parent.Page_ID
INNER JOIN dp_Pages target ON sp.Target_Page_ID = target.Page_ID
WHERE r.Role_ID = 2
    AND parent.Table_Name = 'Projects'
    AND target.Table_Name LIKE 'Project_Budget%'
ORDER BY sp.Display_Name;

GO
