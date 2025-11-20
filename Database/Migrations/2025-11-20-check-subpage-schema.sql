-- Quick check of dp_Sub_Pages schema
USE [MinistryPlatform]
GO

PRINT 'dp_Sub_Pages columns:';
SELECT
    c.name AS column_name,
    t.name AS data_type,
    c.max_length,
    c.is_nullable
FROM sys.columns c
INNER JOIN sys.types t ON c.user_type_id = t.user_type_id
WHERE c.object_id = OBJECT_ID('dp_Sub_Pages')
ORDER BY c.column_id;

GO
