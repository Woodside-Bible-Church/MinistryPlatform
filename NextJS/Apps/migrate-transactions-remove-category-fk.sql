-- =====================================================
-- Migrate Transactions to Remove Redundant Category FK
-- =====================================================

PRINT 'Starting migration to remove redundant category FK from transactions...'
GO

-- =====================================================
-- STEP 1: Drop stored procedures that reference the column
-- =====================================================

PRINT 'Dropping stored procedures that reference category column in transactions...'

IF OBJECT_ID('dbo.api_Custom_GetTransactionDetails_JSON', 'P') IS NOT NULL
BEGIN
    DROP PROCEDURE dbo.api_Custom_GetTransactionDetails_JSON
    PRINT 'Dropped api_Custom_GetTransactionDetails_JSON'
END

IF OBJECT_ID('dbo.api_Custom_GetProjectTransactions_JSON', 'P') IS NOT NULL
BEGIN
    DROP PROCEDURE dbo.api_Custom_GetProjectTransactions_JSON
    PRINT 'Dropped api_Custom_GetProjectTransactions_JSON'
END

IF OBJECT_ID('dbo.api_Custom_GetProjectBudgetCategories_JSON', 'P') IS NOT NULL
BEGIN
    DROP PROCEDURE dbo.api_Custom_GetProjectBudgetCategories_JSON
    PRINT 'Dropped api_Custom_GetProjectBudgetCategories_JSON'
END

IF OBJECT_ID('dbo.api_Custom_GetProjectBudgetDetails_JSON', 'P') IS NOT NULL
BEGIN
    DROP PROCEDURE dbo.api_Custom_GetProjectBudgetDetails_JSON
    PRINT 'Dropped api_Custom_GetProjectBudgetDetails_JSON'
END

IF OBJECT_ID('dbo.api_Custom_GetProjectBudgetDetails_JSON_optimized', 'P') IS NOT NULL
BEGIN
    DROP PROCEDURE dbo.api_Custom_GetProjectBudgetDetails_JSON_optimized
    PRINT 'Dropped api_Custom_GetProjectBudgetDetails_JSON_optimized'
END

GO

-- =====================================================
-- STEP 2: Drop FK constraint from Transactions to Categories
-- =====================================================

PRINT 'Dropping FK constraint from Transactions to Categories...'

DECLARE @sql NVARCHAR(MAX)
DECLARE @fkName NVARCHAR(256)

DECLARE fk_cursor CURSOR FOR
SELECT fk.name
FROM sys.foreign_keys fk
INNER JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
INNER JOIN sys.columns c ON fkc.parent_column_id = c.column_id
    AND fkc.parent_object_id = c.object_id
WHERE c.name = 'Project_Budget_Category_ID'
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
-- STEP 3: Drop index on category column (if exists)
-- =====================================================

PRINT 'Dropping index on category column...'

DECLARE @indexName NVARCHAR(256)
DECLARE index_cursor CURSOR FOR
SELECT i.name
FROM sys.indexes i
INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
WHERE c.name = 'Project_Budget_Category_ID'
    AND OBJECT_NAME(i.object_id) = 'Project_Budget_Transactions'
    AND i.is_primary_key = 0
    AND i.is_unique_constraint = 0

OPEN index_cursor
FETCH NEXT FROM index_cursor INTO @indexName

WHILE @@FETCH_STATUS = 0
BEGIN
    DECLARE @dropIndexSql NVARCHAR(MAX)
    SET @dropIndexSql = 'DROP INDEX ' + QUOTENAME(@indexName) + ' ON Project_Budget_Transactions'
    EXEC sp_executesql @dropIndexSql
    PRINT 'Dropped index: ' + @indexName

    FETCH NEXT FROM index_cursor INTO @indexName
END

CLOSE index_cursor
DEALLOCATE index_cursor
GO

-- =====================================================
-- STEP 4: Drop the redundant category column
-- =====================================================

PRINT 'Dropping redundant category column...'

IF EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('Project_Budget_Transactions')
    AND name = 'Project_Budget_Category_ID'
)
BEGIN
    ALTER TABLE Project_Budget_Transactions
    DROP COLUMN Project_Budget_Category_ID
    PRINT 'Dropped Project_Budget_Category_ID column'
END
ELSE
BEGIN
    PRINT 'Project_Budget_Category_ID column does not exist'
END
GO

-- =====================================================
-- VERIFICATION
-- =====================================================

PRINT ''
PRINT '=== MIGRATION COMPLETE ==='
PRINT ''

-- Check that the column is gone
SELECT
    c.name AS ColumnName,
    t.name AS DataType,
    c.max_length,
    c.is_nullable
FROM sys.columns c
INNER JOIN sys.types t ON c.user_type_id = t.user_type_id
WHERE c.object_id = OBJECT_ID('Project_Budget_Transactions')
    AND c.name LIKE '%Category%'
ORDER BY c.name

PRINT ''
PRINT 'Next steps:'
PRINT '1. Deploy updated stored procedures:'
PRINT '   - api_Custom_GetTransactionDetails_JSON'
PRINT '   - api_Custom_GetProjectTransactions_JSON'
PRINT '   - api_Custom_GetProjectBudgetCategories_JSON'
PRINT '   - api_Custom_GetProjectBudgetDetails_JSON'
PRINT '   - api_Custom_GetProjectBudgetDetails_JSON_optimized'
PRINT '2. Test creating new transactions in the app'
GO
