-- =====================================================
-- MinistryPlatform Database Migration
-- Unify Project Budget Line Items
-- =====================================================
--
-- PURPOSE: Migrate from separate expense/income line item tables
--          to unified Project_Budget_Line_Items table
--
-- IMPORTANT: Run these scripts in ORDER. Test in a non-production
--            environment first. Take database backups before running.
--
-- =====================================================

-- =====================================================
-- STEP 1: Add new column if it doesn't exist
-- =====================================================
-- This adds the unified Project_Budget_Line_Item_ID column
-- to the transactions table if it doesn't already exist

IF NOT EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID('Project_Budget_Transactions')
    AND name = 'Project_Budget_Line_Item_ID'
)
BEGIN
    ALTER TABLE Project_Budget_Transactions
    ADD Project_Budget_Line_Item_ID INT NULL

    PRINT 'Added Project_Budget_Line_Item_ID column to Project_Budget_Transactions'
END
ELSE
BEGIN
    PRINT 'Project_Budget_Line_Item_ID column already exists'
END
GO

-- =====================================================
-- STEP 2: Migrate existing data
-- =====================================================
-- Copy data from old columns to new unified column
-- This preserves all existing transaction->line item relationships

PRINT 'Starting data migration...'

-- Count records to migrate
DECLARE @ExpenseCount INT
DECLARE @IncomeCount INT

SELECT @ExpenseCount = COUNT(*)
FROM Project_Budget_Transactions
WHERE Project_Budget_Expense_Line_Item_ID IS NOT NULL

SELECT @IncomeCount = COUNT(*)
FROM Project_Budget_Transactions
WHERE Project_Budget_Income_Line_Item_ID IS NOT NULL

PRINT 'Found ' + CAST(@ExpenseCount AS VARCHAR) + ' expense transactions to migrate'
PRINT 'Found ' + CAST(@IncomeCount AS VARCHAR) + ' income transactions to migrate'

-- Migrate expense line item IDs
UPDATE Project_Budget_Transactions
SET Project_Budget_Line_Item_ID = Project_Budget_Expense_Line_Item_ID
WHERE Project_Budget_Expense_Line_Item_ID IS NOT NULL
  AND Project_Budget_Line_Item_ID IS NULL

PRINT 'Migrated expense line item IDs'

-- Migrate income line item IDs
UPDATE Project_Budget_Transactions
SET Project_Budget_Line_Item_ID = Project_Budget_Income_Line_Item_ID
WHERE Project_Budget_Income_Line_Item_ID IS NOT NULL
  AND Project_Budget_Line_Item_ID IS NULL

PRINT 'Migrated income line item IDs'
GO

-- =====================================================
-- STEP 3: Verify migration
-- =====================================================
-- Check that data was migrated correctly

PRINT 'Verifying migration...'

DECLARE @MismatchCount INT = 0

-- Check for records where expense ID exists but wasn't copied
SELECT @MismatchCount = COUNT(*)
FROM Project_Budget_Transactions
WHERE Project_Budget_Expense_Line_Item_ID IS NOT NULL
  AND Project_Budget_Line_Item_ID IS NULL

IF @MismatchCount > 0
BEGIN
    PRINT 'WARNING: ' + CAST(@MismatchCount AS VARCHAR) + ' expense records not migrated!'
    RAISERROR('Migration verification failed - expense records missing', 16, 1)
END

-- Check for records where income ID exists but wasn't copied
SELECT @MismatchCount = COUNT(*)
FROM Project_Budget_Transactions
WHERE Project_Budget_Income_Line_Item_ID IS NOT NULL
  AND Project_Budget_Line_Item_ID IS NULL

IF @MismatchCount > 0
BEGIN
    PRINT 'WARNING: ' + CAST(@MismatchCount AS VARCHAR) + ' income records not migrated!'
    RAISERROR('Migration verification failed - income records missing', 16, 1)
END

PRINT 'Migration verification passed!'
GO

-- =====================================================
-- STEP 4: Add FK constraint (optional but recommended)
-- =====================================================
-- Creates a foreign key from transactions to unified line items table

IF NOT EXISTS (
    SELECT 1
    FROM sys.foreign_keys
    WHERE name = 'FK_Project_Budget_Transactions_Line_Items'
)
BEGIN
    ALTER TABLE Project_Budget_Transactions
    ADD CONSTRAINT FK_Project_Budget_Transactions_Line_Items
    FOREIGN KEY (Project_Budget_Line_Item_ID)
    REFERENCES Project_Budget_Line_Items(Project_Budget_Line_Item_ID)

    PRINT 'Added FK constraint to unified line items table'
END
ELSE
BEGIN
    PRINT 'FK constraint already exists'
END
GO

-- =====================================================
-- STEP 5: Drop old FK constraints
-- =====================================================
-- Remove foreign key constraints to old tables
-- This must be done BEFORE dropping the old columns

PRINT 'Dropping old foreign key constraints...'

-- Drop expense line item FK if it exists
IF EXISTS (
    SELECT 1
    FROM sys.foreign_keys
    WHERE name = 'FK_Project_Budget_Transactions_Expense_Line_Items'
)
BEGIN
    ALTER TABLE Project_Budget_Transactions
    DROP CONSTRAINT FK_Project_Budget_Transactions_Expense_Line_Items

    PRINT 'Dropped FK_Project_Budget_Transactions_Expense_Line_Items'
END

-- Drop income line item FK if it exists
IF EXISTS (
    SELECT 1
    FROM sys.foreign_keys
    WHERE name = 'FK_Project_Budget_Transactions_Income_Line_Items'
)
BEGIN
    ALTER TABLE Project_Budget_Transactions
    DROP CONSTRAINT FK_Project_Budget_Transactions_Income_Line_Items

    PRINT 'Dropped FK_Project_Budget_Transactions_Income_Line_Items'
END

-- Handle any other FK names that might exist
DECLARE @sql NVARCHAR(MAX)
DECLARE @fkName NVARCHAR(256)

DECLARE fk_cursor CURSOR FOR
SELECT fk.name
FROM sys.foreign_keys fk
INNER JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
INNER JOIN sys.columns c ON fkc.parent_column_id = c.column_id
    AND fkc.parent_object_id = c.object_id
WHERE c.name IN ('Project_Budget_Expense_Line_Item_ID', 'Project_Budget_Income_Line_Item_ID')
    AND OBJECT_NAME(fk.parent_object_id) = 'Project_Budget_Transactions'

OPEN fk_cursor
FETCH NEXT FROM fk_cursor INTO @fkName

WHILE @@FETCH_STATUS = 0
BEGIN
    SET @sql = 'ALTER TABLE Project_Budget_Transactions DROP CONSTRAINT ' + QUOTENAME(@fkName)
    EXEC sp_executesql @sql
    PRINT 'Dropped constraint: ' + @fkName

    FETCH NEXT FROM fk_cursor INTO @fkName
END

CLOSE fk_cursor
DEALLOCATE fk_cursor

PRINT 'All old foreign key constraints dropped'
GO

-- =====================================================
-- STEP 6: Drop old columns
-- =====================================================
-- Remove the old expense and income line item ID columns
-- ONLY run this after verifying migration succeeded!

PRINT 'Dropping old columns...'

-- Drop expense line item column
IF EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID('Project_Budget_Transactions')
    AND name = 'Project_Budget_Expense_Line_Item_ID'
)
BEGIN
    ALTER TABLE Project_Budget_Transactions
    DROP COLUMN Project_Budget_Expense_Line_Item_ID

    PRINT 'Dropped Project_Budget_Expense_Line_Item_ID column'
END

-- Drop income line item column
IF EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID('Project_Budget_Transactions')
    AND name = 'Project_Budget_Income_Line_Item_ID'
)
BEGIN
    ALTER TABLE Project_Budget_Transactions
    DROP COLUMN Project_Budget_Income_Line_Item_ID

    PRINT 'Dropped Project_Budget_Income_Line_Item_ID column'
END

PRINT 'Old columns dropped successfully'
GO

-- =====================================================
-- STEP 7: Update stored procedure
-- =====================================================
-- Update the GetProjectBudgetDetails stored procedure to use unified table
-- This is a placeholder - you'll need to update this based on your actual SP

PRINT 'Updating stored procedure api_Custom_GetProjectBudgetDetails_JSON...'
PRINT 'NOTE: You will need to manually update this stored procedure to:'
PRINT '  1. Query from Project_Budget_Line_Items instead of separate tables'
PRINT '  2. Filter line items by category type (expense vs revenue)'
PRINT '  3. Update the JSON output structure if needed'
GO

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these to verify the migration was successful

PRINT ''
PRINT '=== MIGRATION COMPLETE ==='
PRINT ''
PRINT 'Run these verification queries:'
PRINT ''
PRINT '-- Check new column is populated:'
PRINT 'SELECT COUNT(*) FROM Project_Budget_Transactions WHERE Project_Budget_Line_Item_ID IS NOT NULL'
PRINT ''
PRINT '-- Check old columns are gone:'
PRINT 'SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(''Project_Budget_Transactions'')'
PRINT ''
PRINT '-- Verify FK constraint exists:'
PRINT 'SELECT * FROM sys.foreign_keys WHERE name = ''FK_Project_Budget_Transactions_Line_Items'''
PRINT ''

GO
