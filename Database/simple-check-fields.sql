-- Check page fields simply

USE MinistryPlatform;
GO

SELECT TOP 5 *
FROM dp_Page_Fields
WHERE Page_ID = (SELECT Page_ID FROM dp_Pages WHERE Table_Name = 'Project_Budget_Categories');

GO
