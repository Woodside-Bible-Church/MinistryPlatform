USE [MinistryPlatform]
GO

-- Add foreign key constraint if it doesn't exist
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_ProjectBudgetExpenseLineItems_Status')
BEGIN
    PRINT 'Adding foreign key constraint...'
    ALTER TABLE dbo.Project_Budget_Expense_Line_Items
    ADD CONSTRAINT FK_ProjectBudgetExpenseLineItems_Status
        FOREIGN KEY (Line_Item_Status_ID)
        REFERENCES dbo.Line_Item_Statuses(Line_Item_Status_ID);

    PRINT 'Foreign key constraint added.'
END
ELSE
    PRINT 'Foreign key constraint already exists.'
GO

-- Verify foreign key
SELECT 
    fk.name AS ForeignKeyName,
    OBJECT_NAME(fk.parent_object_id) AS TableName,
    COL_NAME(fkc.parent_object_id, fkc.parent_column_id) AS ColumnName,
    OBJECT_NAME(fk.referenced_object_id) AS ReferencedTable
FROM sys.foreign_keys fk
INNER JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
WHERE fk.name = 'FK_ProjectBudgetExpenseLineItems_Status';
GO
