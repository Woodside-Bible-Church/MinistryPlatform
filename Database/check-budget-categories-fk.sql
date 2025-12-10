-- Check FK field names for Project_Budget_Categories

USE MinistryPlatform;
GO

SELECT COLUMN_NAME, DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Project_Budget_Categories'
ORDER BY ORDINAL_POSITION;

-- Check the current sub page definition
SELECT sp.Sub_Page_ID, sp.Display_Name, sp.Default_Field_List
FROM dp_Sub_Pages sp
INNER JOIN dp_Pages p ON sp.Parent_Page_ID = p.Page_ID
WHERE p.Table_Name = 'Projects'
    AND sp.Display_Name = 'Budget Categories';

GO
