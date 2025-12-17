-- =====================================================
-- Simple Clean Slate Migration
-- Unified Line Items (No Data Migration)
-- =====================================================
--
-- PURPOSE: Clean slate migration when transaction data is test data
--          Much simpler and safer than migrating data!
--
-- =====================================================

PRINT 'Starting clean slate migration...'
PRINT 'WARNING: This will delete all transactions!'
GO

-- =====================================================
-- STEP 1: Delete all transactions (it's test data)
-- =====================================================

PRINT 'Deleting all transactions...'

DECLARE @TransactionCount INT
SELECT @TransactionCount = COUNT(*) FROM Project_Budget_Transactions

DELETE FROM Project_Budget_Transactions

PRINT 'Deleted ' + CAST(@TransactionCount AS VARCHAR) + ' transactions'
GO

-- =====================================================
-- STEP 2: Drop old foreign key constraints (if they exist)
-- =====================================================

PRINT 'Dropping old foreign key constraints...'

DECLARE @sql NVARCHAR(MAX)
DECLARE @fkName NVARCHAR(256)

-- Drop any FK constraints on the old columns
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
GO

-- =====================================================
-- STEP 3: Drop old columns
-- =====================================================

PRINT 'Dropping old columns...'

IF EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('Project_Budget_Transactions')
    AND name = 'Project_Budget_Expense_Line_Item_ID'
)
BEGIN
    ALTER TABLE Project_Budget_Transactions
    DROP COLUMN Project_Budget_Expense_Line_Item_ID
    PRINT 'Dropped Project_Budget_Expense_Line_Item_ID'
END

IF EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('Project_Budget_Transactions')
    AND name = 'Project_Budget_Income_Line_Item_ID'
)
BEGIN
    ALTER TABLE Project_Budget_Transactions
    DROP COLUMN Project_Budget_Income_Line_Item_ID
    PRINT 'Dropped Project_Budget_Income_Line_Item_ID'
END
GO

-- =====================================================
-- STEP 4: Add new unified column
-- =====================================================

PRINT 'Adding new unified column...'

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('Project_Budget_Transactions')
    AND name = 'Project_Budget_Line_Item_ID'
)
BEGIN
    ALTER TABLE Project_Budget_Transactions
    ADD Project_Budget_Line_Item_ID INT NULL
    PRINT 'Added Project_Budget_Line_Item_ID column'
END
ELSE
BEGIN
    PRINT 'Project_Budget_Line_Item_ID already exists'
END
GO

-- =====================================================
-- STEP 5: Add foreign key constraint
-- =====================================================

PRINT 'Adding foreign key constraint...'

IF NOT EXISTS (
    SELECT 1 FROM sys.foreign_keys
    WHERE name = 'FK_Project_Budget_Transactions_Line_Items'
)
BEGIN
    ALTER TABLE Project_Budget_Transactions
    ADD CONSTRAINT FK_Project_Budget_Transactions_Line_Items
    FOREIGN KEY (Project_Budget_Line_Item_ID)
    REFERENCES Project_Budget_Line_Items(Project_Budget_Line_Item_ID)

    PRINT 'Added FK constraint'
END
ELSE
BEGIN
    PRINT 'FK constraint already exists'
END
GO

-- =====================================================
-- VERIFICATION
-- =====================================================

PRINT ''
PRINT '=== MIGRATION COMPLETE ==='
PRINT ''

-- Check table structure
SELECT
    c.name AS ColumnName,
    t.name AS DataType,
    c.max_length,
    c.is_nullable
FROM sys.columns c
INNER JOIN sys.types t ON c.user_type_id = t.user_type_id
WHERE c.object_id = OBJECT_ID('Project_Budget_Transactions')
    AND c.name LIKE '%Line_Item%'
ORDER BY c.name

PRINT ''
PRINT 'Transaction count: 0 (all deleted)'
PRINT ''
PRINT 'Next steps:'
PRINT '1. Update stored procedure api_Custom_GetProjectBudgetDetails_JSON'
PRINT '2. Test creating new transactions in the app'
PRINT '3. Optionally delete old line item tables from MP Admin'
GO
