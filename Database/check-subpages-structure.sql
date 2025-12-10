-- Check dp_Sub_Pages structure

USE MinistryPlatform;
GO

SELECT COLUMN_NAME, DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'dp_Sub_Pages'
ORDER BY ORDINAL_POSITION;

-- Get a sample sub page to see the pattern
SELECT TOP 1 *
FROM dp_Sub_Pages;

GO
