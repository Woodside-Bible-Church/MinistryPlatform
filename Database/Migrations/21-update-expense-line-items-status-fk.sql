-- =============================================
-- Update Expense Line Items to use Line_Item_Status FK
-- Date: 2025-12-11
-- Description: Replace free-text Status field with FK to Line_Item_Statuses
-- =============================================

USE [MinistryPlatform]
GO

PRINT 'Updating Project_Budget_Expense_Line_Items to use Line_Item_Status_ID...'

-- Step 1: Add new Line_Item_Status_ID column
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Project_Budget_Expense_Line_Items') AND name = 'Line_Item_Status_ID')
BEGIN
    PRINT 'Adding Line_Item_Status_ID column...'
    ALTER TABLE dbo.Project_Budget_Expense_Line_Items
    ADD Line_Item_Status_ID INT NULL;

    PRINT 'Line_Item_Status_ID column added.'
END
ELSE
    PRINT 'Line_Item_Status_ID column already exists.'
GO

-- Step 2: Migrate existing data from Status text to Status ID
PRINT 'Migrating existing status data...'

-- Get the status IDs
DECLARE @PendingID INT, @ApprovedID INT, @RejectedID INT;

SELECT @PendingID = Line_Item_Status_ID FROM Line_Item_Statuses WHERE Status_Name = 'Pending';
SELECT @ApprovedID = Line_Item_Status_ID FROM Line_Item_Statuses WHERE Status_Name = 'Approved';
SELECT @RejectedID = Line_Item_Status_ID FROM Line_Item_Statuses WHERE Status_Name = 'Rejected';

-- Update existing records
UPDATE dbo.Project_Budget_Expense_Line_Items
SET Line_Item_Status_ID = CASE
    WHEN LOWER(LTRIM(RTRIM(Status))) = 'approved' THEN @ApprovedID
    WHEN LOWER(LTRIM(RTRIM(Status))) = 'rejected' THEN @RejectedID
    WHEN LOWER(LTRIM(RTRIM(Status))) = 'pending' THEN @PendingID
    WHEN Status IS NULL THEN @PendingID
    ELSE @PendingID  -- Default to Pending for any unknown values
END
WHERE Line_Item_Status_ID IS NULL;

PRINT 'Existing status data migrated.'
GO

-- Step 3: Make Line_Item_Status_ID NOT NULL with default
PRINT 'Making Line_Item_Status_ID required...'

-- Get Pending status ID to use as default
DECLARE @PendingID INT;
SELECT @PendingID = Line_Item_Status_ID FROM Line_Item_Statuses WHERE Status_Name = 'Pending';

-- First make the column NOT NULL
ALTER TABLE dbo.Project_Budget_Expense_Line_Items
ALTER COLUMN Line_Item_Status_ID INT NOT NULL;

-- Then add the default constraint using the variable
DECLARE @DefaultConstraintSQL NVARCHAR(MAX);
SET @DefaultConstraintSQL = 'ALTER TABLE dbo.Project_Budget_Expense_Line_Items ADD CONSTRAINT DF_ProjectBudgetExpenseLineItems_Status DEFAULT ' + CAST(@PendingID AS NVARCHAR(10)) + ' FOR Line_Item_Status_ID';
EXEC sp_executesql @DefaultConstraintSQL;

PRINT 'Line_Item_Status_ID is now required with default.'
GO

-- Step 4: Add foreign key constraint
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

-- Step 5: Drop old Status column
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Project_Budget_Expense_Line_Items') AND name = 'Status')
BEGIN
    PRINT 'Dropping old Status column...'
    ALTER TABLE dbo.Project_Budget_Expense_Line_Items
    DROP COLUMN Status;

    PRINT 'Old Status column dropped.'
END
ELSE
    PRINT 'Old Status column already removed.'
GO

-- Verify update
PRINT ''
PRINT 'Verification - Line Item Status Distribution:'
SELECT
    lis.Status_Name,
    lis.Sort_Order,
    COUNT(*) AS Count
FROM dbo.Project_Budget_Expense_Line_Items pbeli
INNER JOIN dbo.Line_Item_Statuses lis ON pbeli.Line_Item_Status_ID = lis.Line_Item_Status_ID
GROUP BY lis.Status_Name, lis.Sort_Order
ORDER BY lis.Sort_Order;

PRINT ''
PRINT 'Project_Budget_Expense_Line_Items status field updated successfully!'
GO
