-- =============================================
-- Rollback Line_Item_Statuses Lookup Table
-- Date: 2025-12-11
-- Description: Remove lookup table and FK, restore simple Status field
-- =============================================

USE [MinistryPlatform]
GO

PRINT 'Rolling back Line_Item_Statuses implementation...'

-- Step 1: Drop foreign key constraint if it exists
IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_ProjectBudgetExpenseLineItems_Status')
BEGIN
    PRINT 'Dropping foreign key constraint...'
    ALTER TABLE dbo.Project_Budget_Expense_Line_Items
    DROP CONSTRAINT FK_ProjectBudgetExpenseLineItems_Status;
    PRINT 'Foreign key constraint dropped.'
END
ELSE
    PRINT 'Foreign key constraint does not exist.'
GO

-- Step 2: Drop Line_Item_Status_ID column if it exists
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Project_Budget_Expense_Line_Items') AND name = 'Line_Item_Status_ID')
BEGIN
    PRINT 'Dropping Line_Item_Status_ID column...'

    -- Drop default constraint first if it exists
    DECLARE @DefaultConstraintName NVARCHAR(255);
    SELECT @DefaultConstraintName = dc.name
    FROM sys.default_constraints dc
    INNER JOIN sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
    WHERE c.object_id = OBJECT_ID('dbo.Project_Budget_Expense_Line_Items')
        AND c.name = 'Line_Item_Status_ID';

    IF @DefaultConstraintName IS NOT NULL
    BEGIN
        DECLARE @DropDefaultSQL NVARCHAR(MAX);
        SET @DropDefaultSQL = 'ALTER TABLE dbo.Project_Budget_Expense_Line_Items DROP CONSTRAINT ' + @DefaultConstraintName;
        EXEC sp_executesql @DropDefaultSQL;
        PRINT 'Default constraint dropped.';
    END

    ALTER TABLE dbo.Project_Budget_Expense_Line_Items
    DROP COLUMN Line_Item_Status_ID;
    PRINT 'Line_Item_Status_ID column dropped.'
END
ELSE
    PRINT 'Line_Item_Status_ID column does not exist.'
GO

-- Step 3: Remove page permissions
DECLARE @PageID INT;
SELECT @PageID = Page_ID FROM dp_Pages WHERE Table_Name = 'Line_Item_Statuses';

IF @PageID IS NOT NULL
BEGIN
    PRINT 'Removing page permissions...'
    DELETE FROM dp_Role_Pages WHERE Page_ID = @PageID;
    PRINT 'Page permissions removed.'
END
GO

-- Step 4: Remove page registration
IF EXISTS (SELECT 1 FROM dp_Pages WHERE Table_Name = 'Line_Item_Statuses')
BEGIN
    PRINT 'Removing page registration...'
    DELETE FROM dp_Pages WHERE Table_Name = 'Line_Item_Statuses';
    PRINT 'Page registration removed.'
END
GO

-- Step 5: Drop Line_Item_Statuses table
IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Line_Item_Statuses')
BEGIN
    PRINT 'Dropping Line_Item_Statuses table...'
    DROP TABLE dbo.Line_Item_Statuses;
    PRINT 'Line_Item_Statuses table dropped.'
END
ELSE
    PRINT 'Line_Item_Statuses table does not exist.'
GO

PRINT ''
PRINT 'Rollback complete!'
GO
