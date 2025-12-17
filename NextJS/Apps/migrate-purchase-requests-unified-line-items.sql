-- =====================================================
-- Migrate Purchase Requests to Unified Line Items
-- Clean Slate Approach
-- =====================================================

PRINT 'Starting Purchase Requests migration to unified line items...'
PRINT 'WARNING: This will delete all purchase requests and transactions!'
GO

-- =====================================================
-- STEP 1: Delete all transactions
-- =====================================================

PRINT 'Deleting all transactions...'

DECLARE @TransactionCount INT
SELECT @TransactionCount = COUNT(*) FROM Project_Budget_Transactions

DELETE FROM Project_Budget_Transactions

PRINT 'Deleted ' + CAST(@TransactionCount AS VARCHAR) + ' transactions'
GO

-- =====================================================
-- STEP 2: Delete all purchase requests
-- =====================================================

PRINT 'Deleting all purchase requests...'

DECLARE @PRCount INT
SELECT @PRCount = COUNT(*) FROM Project_Budget_Purchase_Requests

DELETE FROM Project_Budget_Purchase_Requests

PRINT 'Deleted ' + CAST(@PRCount AS VARCHAR) + ' purchase requests'
GO

-- =====================================================
-- STEP 3: Drop stored procedures that reference the old column
-- =====================================================

PRINT 'Dropping stored procedures that reference old column...'

IF OBJECT_ID('dbo.api_Custom_GetProjectPurchaseRequests_JSON', 'P') IS NOT NULL
BEGIN
    DROP PROCEDURE dbo.api_Custom_GetProjectPurchaseRequests_JSON
    PRINT 'Dropped api_Custom_GetProjectPurchaseRequests_JSON'
END

IF OBJECT_ID('dbo.api_Custom_GetPurchaseRequestDetails_JSON', 'P') IS NOT NULL
BEGIN
    DROP PROCEDURE dbo.api_Custom_GetPurchaseRequestDetails_JSON
    PRINT 'Dropped api_Custom_GetPurchaseRequestDetails_JSON'
END

IF OBJECT_ID('dbo.api_Custom_GetLineItemDetails_JSON', 'P') IS NOT NULL
BEGIN
    DROP PROCEDURE dbo.api_Custom_GetLineItemDetails_JSON
    PRINT 'Dropped api_Custom_GetLineItemDetails_JSON'
END

GO

-- =====================================================
-- STEP 4: Drop FK constraint from Purchase Requests to old table
-- =====================================================

PRINT 'Dropping FK constraint from Purchase Requests...'

DECLARE @sql NVARCHAR(MAX)
DECLARE @fkName NVARCHAR(256)

DECLARE fk_cursor CURSOR FOR
SELECT fk.name
FROM sys.foreign_keys fk
INNER JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
INNER JOIN sys.columns c ON fkc.parent_column_id = c.column_id
    AND fkc.parent_object_id = c.object_id
WHERE c.name = 'Project_Budget_Expense_Line_Item_ID'
    AND OBJECT_NAME(fk.parent_object_id) = 'Project_Budget_Purchase_Requests'

OPEN fk_cursor
FETCH NEXT FROM fk_cursor INTO @fkName

WHILE @@FETCH_STATUS = 0
BEGIN
    SET @sql = 'ALTER TABLE Project_Budget_Purchase_Requests DROP CONSTRAINT ' + QUOTENAME(@fkName)
    EXEC sp_executesql @sql
    PRINT 'Dropped constraint: ' + @fkName

    FETCH NEXT FROM fk_cursor INTO @fkName
END

CLOSE fk_cursor
DEALLOCATE fk_cursor
GO

-- =====================================================
-- STEP 5: Drop index on old column
-- =====================================================

PRINT 'Dropping index on old column...'

IF EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_Purchase_Requests_Line_Item'
    AND object_id = OBJECT_ID('Project_Budget_Purchase_Requests')
)
BEGIN
    DROP INDEX IX_Purchase_Requests_Line_Item ON Project_Budget_Purchase_Requests
    PRINT 'Dropped index IX_Purchase_Requests_Line_Item'
END
GO

-- =====================================================
-- STEP 6: Drop old column
-- =====================================================

PRINT 'Dropping old column...'

IF EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('Project_Budget_Purchase_Requests')
    AND name = 'Project_Budget_Expense_Line_Item_ID'
)
BEGIN
    ALTER TABLE Project_Budget_Purchase_Requests
    DROP COLUMN Project_Budget_Expense_Line_Item_ID
    PRINT 'Dropped Project_Budget_Expense_Line_Item_ID'
END
GO

-- =====================================================
-- STEP 7: Add new unified column
-- =====================================================

PRINT 'Adding new unified column...'

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('Project_Budget_Purchase_Requests')
    AND name = 'Project_Budget_Line_Item_ID'
)
BEGIN
    ALTER TABLE Project_Budget_Purchase_Requests
    ADD Project_Budget_Line_Item_ID INT NULL
    PRINT 'Added Project_Budget_Line_Item_ID column'
END
ELSE
BEGIN
    PRINT 'Project_Budget_Line_Item_ID already exists'
END
GO

-- =====================================================
-- STEP 8: Add FK constraint to unified table
-- =====================================================

PRINT 'Adding FK constraint to unified line items table...'

IF NOT EXISTS (
    SELECT 1 FROM sys.foreign_keys
    WHERE name = 'FK_Purchase_Requests_Line_Items'
)
BEGIN
    ALTER TABLE Project_Budget_Purchase_Requests
    ADD CONSTRAINT FK_Purchase_Requests_Line_Items
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
-- STEP 9: Recreate index on new column
-- =====================================================

PRINT 'Creating index on new column...'

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_Purchase_Requests_Line_Item'
    AND object_id = OBJECT_ID('Project_Budget_Purchase_Requests')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_Purchase_Requests_Line_Item
    ON Project_Budget_Purchase_Requests (Project_Budget_Line_Item_ID)
    PRINT 'Created index IX_Purchase_Requests_Line_Item'
END
ELSE
BEGIN
    PRINT 'Index already exists'
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
WHERE c.object_id = OBJECT_ID('Project_Budget_Purchase_Requests')
    AND c.name LIKE '%Line_Item%'
ORDER BY c.name

PRINT ''
PRINT 'Purchase request count: 0 (all deleted)'
PRINT 'Transaction count: 0 (all deleted)'
PRINT ''
PRINT 'Next steps:'
PRINT '1. Deploy updated stored procedures:'
PRINT '   - api_Custom_GetProjectPurchaseRequests_JSON'
PRINT '   - api_Custom_GetPurchaseRequestDetails_JSON'
PRINT '   - api_Custom_GetLineItemDetails_JSON'
PRINT '2. Update MinistryPlatform page fields to reference new column'
PRINT '3. Test creating new purchase requests in the app'
PRINT '4. Test creating transactions from approved purchase requests'
GO
