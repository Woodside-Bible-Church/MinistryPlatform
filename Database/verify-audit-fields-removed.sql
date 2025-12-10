-- Verify audit fields have been removed

USE MinistryPlatform;
GO

PRINT 'Current columns in Project_Budget_Transactions:';
SELECT COLUMN_NAME, DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Project_Budget_Transactions'
ORDER BY ORDINAL_POSITION;

GO
