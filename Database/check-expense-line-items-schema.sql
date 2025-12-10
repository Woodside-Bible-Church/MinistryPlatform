-- Check Project_Budget_Expense_Line_Items schema

USE MinistryPlatform;
GO

SELECT COLUMN_NAME, DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Project_Budget_Expense_Line_Items'
ORDER BY ORDINAL_POSITION;

GO
