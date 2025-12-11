USE [MinistryPlatform]
GO

-- Check current schema
SELECT 
    c.name AS ColumnName,
    t.name AS DataType,
    c.max_length AS MaxLength,
    c.is_nullable AS IsNullable
FROM sys.columns c
INNER JOIN sys.types t ON c.user_type_id = t.user_type_id
WHERE c.object_id = OBJECT_ID('dbo.Project_Budget_Expense_Line_Items')
    AND c.name IN ('Status', 'Line_Item_Status_ID')
ORDER BY c.name;

-- Check for foreign key constraint
SELECT 
    fk.name AS ForeignKeyName,
    OBJECT_NAME(fk.parent_object_id) AS TableName,
    COL_NAME(fkc.parent_object_id, fkc.parent_column_id) AS ColumnName,
    OBJECT_NAME(fk.referenced_object_id) AS ReferencedTable
FROM sys.foreign_keys fk
INNER JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
WHERE fk.parent_object_id = OBJECT_ID('dbo.Project_Budget_Expense_Line_Items')
    AND fk.name = 'FK_ProjectBudgetExpenseLineItems_Status';

-- Check status distribution
SELECT
    lis.Status_Name,
    lis.Sort_Order,
    COUNT(*) AS Count
FROM dbo.Project_Budget_Expense_Line_Items pbeli
INNER JOIN dbo.Line_Item_Statuses lis ON pbeli.Line_Item_Status_ID = lis.Line_Item_Status_ID
GROUP BY lis.Status_Name, lis.Sort_Order
ORDER BY lis.Sort_Order;
GO
