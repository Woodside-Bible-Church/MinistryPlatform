-- Check dp_Page_Fields for Project_Budget_Categories

USE MinistryPlatform;
GO

SELECT
    pf.Page_Field_ID,
    pf.Field_Name,
    pf.Field_Label,
    pf.Data_Type,
    pf.Foreign_Key_Page_ID,
    p.Display_Name AS FK_Page
FROM dp_Page_Fields pf
LEFT JOIN dp_Pages p ON pf.Foreign_Key_Page_ID = p.Page_ID
WHERE pf.Page_ID = (SELECT Page_ID FROM dp_Pages WHERE Table_Name = 'Project_Budget_Categories')
ORDER BY pf.Field_Name;

GO
