-- =====================================================
-- ROLLBACK SCRIPT
-- Unified Line Items Migration
-- =====================================================
--
-- PURPOSE: Rollback the unified line items migration if needed
--
-- WARNING: Only run this if the migration failed or needs to be undone
--          This will restore the old expense/income columns
--
-- =====================================================

PRINT 'Starting rollback of unified line items migration...'
GO

-- =====================================================
-- STEP 1: Re-add old columns if they don't exist
-- =====================================================

IF NOT EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID('Project_Budget_Transactions')
    AND name = 'Project_Budget_Expense_Line_Item_ID'
)
BEGIN
    ALTER TABLE Project_Budget_Transactions
    ADD Project_Budget_Expense_Line_Item_ID INT NULL

    PRINT 'Re-added Project_Budget_Expense_Line_Item_ID column'
END

IF NOT EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID('Project_Budget_Transactions')
    AND name = 'Project_Budget_Income_Line_Item_ID'
)
BEGIN
    ALTER TABLE Project_Budget_Transactions
    ADD Project_Budget_Income_Line_Item_ID INT NULL

    PRINT 'Re-added Project_Budget_Income_Line_Item_ID column'
END
GO

-- =====================================================
-- STEP 2: Restore data from unified column to old columns
-- =====================================================

PRINT 'Restoring data to old columns...'

-- Restore expense transactions
UPDATE Project_Budget_Transactions
SET Project_Budget_Expense_Line_Item_ID = Project_Budget_Line_Item_ID
WHERE Transaction_Type = 'Expense'
  AND Project_Budget_Line_Item_ID IS NOT NULL

-- Restore income transactions
UPDATE Project_Budget_Transactions
SET Project_Budget_Income_Line_Item_ID = Project_Budget_Line_Item_ID
WHERE Transaction_Type = 'Income'
  AND Project_Budget_Line_Item_ID IS NOT NULL

PRINT 'Data restored to old columns'
GO

-- =====================================================
-- STEP 3: Drop new FK constraint
-- =====================================================

IF EXISTS (
    SELECT 1
    FROM sys.foreign_keys
    WHERE name = 'FK_Project_Budget_Transactions_Line_Items'
)
BEGIN
    ALTER TABLE Project_Budget_Transactions
    DROP CONSTRAINT FK_Project_Budget_Transactions_Line_Items

    PRINT 'Dropped new FK constraint'
END
GO

-- =====================================================
-- STEP 4: Drop unified column
-- =====================================================

IF EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID('Project_Budget_Transactions')
    AND name = 'Project_Budget_Line_Item_ID'
)
BEGIN
    ALTER TABLE Project_Budget_Transactions
    DROP COLUMN Project_Budget_Line_Item_ID

    PRINT 'Dropped Project_Budget_Line_Item_ID column'
END
GO

-- =====================================================
-- STEP 5: Re-add old FK constraints (optional)
-- =====================================================

PRINT 'NOTE: You will need to manually re-add FK constraints to old tables if they existed'
PRINT 'Check your backup or MP admin to see what constraints existed before migration'
GO

PRINT ''
PRINT '=== ROLLBACK COMPLETE ==='
PRINT 'Verify the old columns are restored with data'
GO
