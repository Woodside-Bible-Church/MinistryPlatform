-- =====================================================
-- Migration: Convert Budgeted_Amount to Computed Column
-- =====================================================
--
-- PURPOSE: Make Project_Budget_Categories.Budgeted_Amount a computed
--          column that automatically sums line item estimates
--
-- BENEFITS:
-- - Data integrity: Category budgets always match line item totals
-- - No schema changes needed elsewhere (same column name)
-- - No stored procedure changes needed (same field name)
-- - No UI changes needed
-- - Categories can still exist with no line items (sum = 0)
--
-- =====================================================

PRINT 'Starting migration: Budgeted_Amount to computed column...'
GO

-- =====================================================
-- STEP 1: Create scalar function to calculate budget
-- =====================================================

PRINT 'Step 1: Creating scalar function for budget calculation...'

IF OBJECT_ID('dbo.fn_GetCategoryBudgetedAmount', 'FN') IS NOT NULL
BEGIN
    DROP FUNCTION dbo.fn_GetCategoryBudgetedAmount
    PRINT '  Dropped existing function'
END

GO

CREATE FUNCTION dbo.fn_GetCategoryBudgetedAmount
(
    @CategoryID INT
)
RETURNS DECIMAL(18,2)
WITH SCHEMABINDING
AS
BEGIN
    DECLARE @Total DECIMAL(18,2)

    SELECT @Total = SUM(Estimated_Amount)
    FROM dbo.Project_Budget_Line_Items
    WHERE Category_ID = @CategoryID

    RETURN ISNULL(@Total, 0)
END
GO

PRINT '  Created function: fn_GetCategoryBudgetedAmount'
GO

-- =====================================================
-- STEP 2: Find and drop dependent views
-- =====================================================

PRINT 'Step 2: Finding and dropping dependent views...'

DECLARE @ViewName NVARCHAR(256)
DECLARE @SQL NVARCHAR(MAX)

DECLARE view_cursor CURSOR FOR
SELECT v.name
FROM sys.views v
INNER JOIN sys.sql_dependencies d ON v.object_id = d.object_id
WHERE d.referenced_major_id = OBJECT_ID('Project_Budget_Categories')
    AND v.name LIKE 'dp_%'  -- MinistryPlatform views

OPEN view_cursor
FETCH NEXT FROM view_cursor INTO @ViewName

WHILE @@FETCH_STATUS = 0
BEGIN
    SET @SQL = 'DROP VIEW ' + QUOTENAME(@ViewName)
    EXEC sp_executesql @SQL
    PRINT '  Dropped view: ' + @ViewName

    FETCH NEXT FROM view_cursor INTO @ViewName
END

CLOSE view_cursor
DEALLOCATE view_cursor
GO

-- =====================================================
-- STEP 3: Drop default constraint on Budgeted_Amount
-- =====================================================

PRINT 'Step 3: Dropping default constraint on Budgeted_Amount...'

DECLARE @ConstraintName NVARCHAR(256)
DECLARE @SQL2 NVARCHAR(MAX)

SELECT @ConstraintName = dc.name
FROM sys.default_constraints dc
INNER JOIN sys.columns c ON dc.parent_column_id = c.column_id
    AND dc.parent_object_id = c.object_id
WHERE c.object_id = OBJECT_ID('Project_Budget_Categories')
    AND c.name = 'Budgeted_Amount'

IF @ConstraintName IS NOT NULL
BEGIN
    SET @SQL2 = 'ALTER TABLE Project_Budget_Categories DROP CONSTRAINT ' + QUOTENAME(@ConstraintName)
    EXEC sp_executesql @SQL2
    PRINT '  Dropped default constraint: ' + @ConstraintName
END
ELSE
BEGIN
    PRINT '  No default constraint found'
END
GO

-- =====================================================
-- STEP 4: Drop the existing Budgeted_Amount column
-- =====================================================

PRINT 'Step 4: Dropping existing Budgeted_Amount column...'

IF EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('Project_Budget_Categories')
    AND name = 'Budgeted_Amount'
)
BEGIN
    ALTER TABLE Project_Budget_Categories
    DROP COLUMN Budgeted_Amount

    PRINT '  Dropped Budgeted_Amount column'
END
ELSE
BEGIN
    PRINT '  Budgeted_Amount column does not exist'
END
GO

-- =====================================================
-- STEP 5: Add Budgeted_Amount as a computed column
-- =====================================================

PRINT 'Step 5: Adding Budgeted_Amount as computed column...'

-- Add computed column that uses the function
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('Project_Budget_Categories')
    AND name = 'Budgeted_Amount'
)
BEGIN
    ALTER TABLE Project_Budget_Categories
    ADD Budgeted_Amount AS dbo.fn_GetCategoryBudgetedAmount(Project_Budget_Category_ID)

    PRINT '  Added Budgeted_Amount as computed column (non-persisted)'
    PRINT '  Formula: fn_GetCategoryBudgetedAmount(Project_Budget_Category_ID)'
END
ELSE
BEGIN
    PRINT '  Budgeted_Amount already exists as computed column'
END
GO

-- =====================================================
-- VERIFICATION
-- =====================================================

PRINT ''
PRINT '=== MIGRATION VERIFICATION ==='
PRINT ''

-- Show column definition
SELECT
    c.name AS ColumnName,
    t.name AS DataType,
    c.is_computed AS IsComputed,
    c.is_nullable AS IsNullable,
    cc.definition AS ComputedDefinition
FROM sys.columns c
INNER JOIN sys.types t ON c.user_type_id = t.user_type_id
LEFT JOIN sys.computed_columns cc ON c.object_id = cc.object_id AND c.column_id = cc.column_id
WHERE c.object_id = OBJECT_ID('Project_Budget_Categories')
    AND c.name = 'Budgeted_Amount'

PRINT ''

-- Show current computed values
PRINT 'Current category budgets (now computed from line items):'
SELECT TOP 10
    pbc.Project_Budget_Category_ID,
    p.Project_Title,
    COALESCE(pbc.Budget_Category_Name, pct.Project_Category_Type) AS Category_Name,
    pbc.Budgeted_Amount AS Computed_Budget,
    (
        SELECT COUNT(*)
        FROM Project_Budget_Line_Items
        WHERE Category_ID = pbc.Project_Budget_Category_ID
    ) AS Line_Item_Count
FROM Project_Budget_Categories pbc
LEFT JOIN Projects p ON pbc.Project_ID = p.Project_ID
LEFT JOIN Project_Category_Types pct ON pbc.Project_Category_Type_ID = pct.Project_Category_Type_ID
ORDER BY p.Project_Title, pbc.Sort_Order

PRINT ''
PRINT '=== MIGRATION COMPLETE ==='
PRINT ''
PRINT 'Success! Budgeted_Amount is now automatically calculated from line items.'
PRINT ''
PRINT 'How it works:'
PRINT '- Added function: dbo.fn_GetCategoryBudgetedAmount'
PRINT '- Budgeted_Amount is a computed column (calculated on read)'
PRINT '- Adding/editing line items automatically updates category budget'
PRINT '- Categories with no line items show $0'
PRINT '- No changes needed to stored procedures or UI'
PRINT '- Cannot manually set category budget anymore (it auto-calculates)'
PRINT ''
PRINT 'IMPORTANT: Go to MP Admin and access the Project Budget Categories page'
PRINT '           This will automatically recreate the dp_Page_Views view'
GO
