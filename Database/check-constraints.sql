-- Check constraints on audit fields

USE MinistryPlatform;
GO

SELECT
    dc.name AS ConstraintName,
    c.name AS ColumnName,
    dc.definition
FROM sys.default_constraints dc
INNER JOIN sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
WHERE dc.parent_object_id = OBJECT_ID('Project_Budget_Transactions')
    AND c.name IN ('Created_By_User_ID', 'Created_Date', 'Modified_By_User_ID', 'Modified_Date');

GO
