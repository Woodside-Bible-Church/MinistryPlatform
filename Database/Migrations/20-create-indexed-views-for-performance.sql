/*
 * Performance Optimization Phase 1: Indexed Views for Line Item Actuals
 *
 * This migration creates indexed views to pre-aggregate transaction amounts,
 * eliminating the need for correlated subqueries in the GetProjectBudgetDetails
 * stored procedure.
 *
 * Expected Performance Improvement: 20-30% (1358ms -> ~950-1100ms)
 *
 * Created: 2025-12-11
 * Related: Database/PERFORMANCE_ANALYSIS.md
 */

-- Set options required for indexed views
SET ANSI_NULLS ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET ARITHABORT ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET QUOTED_IDENTIFIER ON;
SET NUMERIC_ROUNDABORT OFF;
GO

-- ============================================================================
-- 1. Indexed View: Expense Line Item Actuals
-- ============================================================================
-- Pre-aggregates transaction amounts per expense line item
-- Replaces correlated subquery that runs ~45 times per page load

IF OBJECT_ID('dbo.vw_Custom_Project_Budget_Expense_LineItem_Actuals', 'V') IS NOT NULL
    DROP VIEW dbo.vw_Custom_Project_Budget_Expense_LineItem_Actuals;
GO

CREATE VIEW dbo.vw_Custom_Project_Budget_Expense_LineItem_Actuals
WITH SCHEMABINDING
AS
SELECT
    pbt.Project_Budget_Expense_Line_Item_ID,
    pbt.Project_ID,
    SUM(pbt.Amount) AS Total_Actual,
    COUNT_BIG(*) AS Transaction_Count
FROM dbo.Project_Budget_Transactions pbt
WHERE pbt.Transaction_Type = 'Expense'
    AND pbt.Project_Budget_Expense_Line_Item_ID IS NOT NULL
GROUP BY
    pbt.Project_Budget_Expense_Line_Item_ID,
    pbt.Project_ID;
GO

-- Create clustered index to materialize the view
CREATE UNIQUE CLUSTERED INDEX IX_ExpenseLineItemActuals_LineItemID
    ON dbo.vw_Custom_Project_Budget_Expense_LineItem_Actuals (Project_Budget_Expense_Line_Item_ID);
GO

-- Create non-clustered index for filtering by project
CREATE NONCLUSTERED INDEX IX_ExpenseLineItemActuals_ProjectID
    ON dbo.vw_Custom_Project_Budget_Expense_LineItem_Actuals (Project_ID);
GO

PRINT '✓ Created indexed view: vw_Custom_Project_Budget_Expense_LineItem_Actuals';
GO

-- ============================================================================
-- 2. Indexed View: Income Line Item Actuals
-- ============================================================================
-- Pre-aggregates transaction amounts per income line item
-- Replaces correlated subquery that runs ~6 times per page load

IF OBJECT_ID('dbo.vw_Custom_Project_Budget_Income_LineItem_Actuals', 'V') IS NOT NULL
    DROP VIEW dbo.vw_Custom_Project_Budget_Income_LineItem_Actuals;
GO

CREATE VIEW dbo.vw_Custom_Project_Budget_Income_LineItem_Actuals
WITH SCHEMABINDING
AS
SELECT
    pbt.Project_Budget_Income_Line_Item_ID,
    pbt.Project_ID,
    SUM(pbt.Amount) AS Total_Actual,
    COUNT_BIG(*) AS Transaction_Count
FROM dbo.Project_Budget_Transactions pbt
WHERE pbt.Transaction_Type = 'Income'
    AND pbt.Project_Budget_Income_Line_Item_ID IS NOT NULL
GROUP BY
    pbt.Project_Budget_Income_Line_Item_ID,
    pbt.Project_ID;
GO

-- Create clustered index to materialize the view
CREATE UNIQUE CLUSTERED INDEX IX_IncomeLineItemActuals_LineItemID
    ON dbo.vw_Custom_Project_Budget_Income_LineItem_Actuals (Project_Budget_Income_Line_Item_ID);
GO

-- Create non-clustered index for filtering by project
CREATE NONCLUSTERED INDEX IX_IncomeLineItemActuals_ProjectID
    ON dbo.vw_Custom_Project_Budget_Income_LineItem_Actuals (Project_ID);
GO

PRINT '✓ Created indexed view: vw_Custom_Project_Budget_Income_LineItem_Actuals';
GO

-- ============================================================================
-- 3. Indexed View: Registration Discounts by Type
-- ============================================================================
-- Pre-aggregates registration discounts grouped by discount type
-- Replaces correlated subquery that runs ~17 times per page load

IF OBJECT_ID('dbo.vw_Custom_Project_Registration_Discounts', 'V') IS NOT NULL
    DROP VIEW dbo.vw_Custom_Project_Registration_Discounts;
GO

-- Note: Using INNER JOIN instead of LEFT JOIN for indexed view compatibility
-- Rows with NULL Product_Option_Price_ID are filtered out
-- Line_Total is NOT NULL column, so no ISNULL needed in aggregate
CREATE VIEW dbo.vw_Custom_Project_Registration_Discounts
WITH SCHEMABINDING
AS
SELECT
    e.Project_ID,
    pop.Option_Title,
    pop.Product_Option_Price_ID,
    -- Using * -1 instead of ABS() to avoid function on aggregate for indexed view
    SUM(id.Line_Total * -1) AS Total_Discount_Amount,
    COUNT_BIG(*) AS Discount_Count
FROM dbo.Invoice_Detail id
INNER JOIN dbo.Event_Participants ep ON id.Event_Participant_ID = ep.Event_Participant_ID
INNER JOIN dbo.Events e ON ep.Event_ID = e.Event_ID
INNER JOIN dbo.Product_Option_Prices pop ON id.Product_Option_Price_ID = pop.Product_Option_Price_ID
WHERE e.Project_ID IS NOT NULL
    AND e.Include_Registrations_In_Project_Budgets = 1
    AND id.Line_Total < 0  -- Negative amounts are discounts
    AND id.Product_Option_Price_ID IS NOT NULL
GROUP BY
    e.Project_ID,
    pop.Option_Title,
    pop.Product_Option_Price_ID;
GO

-- Create clustered index to materialize the view
CREATE UNIQUE CLUSTERED INDEX IX_RegistrationDiscounts_ProjectOption
    ON dbo.vw_Custom_Project_Registration_Discounts (Project_ID, Product_Option_Price_ID);
GO

PRINT '✓ Created indexed view: vw_Custom_Project_Registration_Discounts';
GO

-- ============================================================================
-- 4. Indexed View: Registration Income by Event
-- ============================================================================
-- Pre-aggregates registration income grouped by event
-- Replaces correlated subquery that runs ~8 times per page load

IF OBJECT_ID('dbo.vw_Custom_Project_Registration_Income', 'V') IS NOT NULL
    DROP VIEW dbo.vw_Custom_Project_Registration_Income;
GO

-- Note: Using INNER JOIN instead of LEFT JOIN for indexed view compatibility
-- This assumes all Event_Participants have Invoice_Detail records
-- Line_Total is NOT NULL column, so no ISNULL needed
CREATE VIEW dbo.vw_Custom_Project_Registration_Income
WITH SCHEMABINDING
AS
SELECT
    e.Project_ID,
    e.Event_ID,
    e.Event_Title,
    SUM(id.Line_Total) AS Total_Income,
    COUNT_BIG(*) AS Registration_Count
FROM dbo.Events e
INNER JOIN dbo.Event_Participants ep ON e.Event_ID = ep.Event_ID
INNER JOIN dbo.Invoice_Detail id ON ep.Event_Participant_ID = id.Event_Participant_ID
WHERE e.Project_ID IS NOT NULL
    AND e.Include_Registrations_In_Project_Budgets = 1
GROUP BY
    e.Project_ID,
    e.Event_ID,
    e.Event_Title;
GO

-- Create clustered index to materialize the view
CREATE UNIQUE CLUSTERED INDEX IX_RegistrationIncome_ProjectEvent
    ON dbo.vw_Custom_Project_Registration_Income (Project_ID, Event_ID);
GO

PRINT '✓ Created indexed view: vw_Custom_Project_Registration_Income';
GO

-- ============================================================================
-- Verification: Check view definitions and indexes
-- ============================================================================

PRINT '';
PRINT '======================================================================';
PRINT 'Performance Optimization Phase 1 Complete';
PRINT '======================================================================';
PRINT '';
PRINT 'Created indexed views:';
PRINT '  • vw_Custom_Project_Budget_Expense_LineItem_Actuals (expense line item actuals)';
PRINT '  • vw_Custom_Project_Budget_Income_LineItem_Actuals (income line item actuals)';
PRINT '  • vw_Custom_Project_Registration_Discounts (registration discounts by type)';
PRINT '  • vw_Custom_Project_Registration_Income (registration income by event)';
PRINT '';
PRINT 'Next Steps:';
PRINT '  1. Update api_Custom_GetProjectBudgetDetails_JSON to use these views';
PRINT '  2. Run benchmark tests to measure performance improvement';
PRINT '  3. Expected improvement: 20-30% (1358ms -> ~950-1100ms)';
PRINT '';
PRINT '======================================================================';
GO
