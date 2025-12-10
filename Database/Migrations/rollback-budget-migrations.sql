-- =============================================
-- Rollback Budget System Migration
-- Author: Claude Code
-- Date: 2025-12-09
-- Description: Rolls back all budget-related changes
-- WARNING: This will drop all budget tables and remove budget fields
--          All budget data will be lost!
-- =============================================

USE [MinistryPlatform]
GO

PRINT '========================================='
PRINT 'STARTING BUDGET SYSTEM ROLLBACK'
PRINT 'WARNING: This will delete all budget data!'
PRINT '========================================='
PRINT ''

-- Phase 1: Remove role permissions
PRINT 'Phase 1: Removing role permissions for budget tables...'

DELETE FROM dp_Role_Pages
WHERE Role_ID = 2
AND Page_ID IN (
    SELECT Page_ID FROM dp_Pages WHERE Table_Name IN (
        'Project_Budget_Statuses',
        'Project_Budget_Payment_Methods',
        'Project_Budget_Categories',
        'Project_Budget_Expense_Line_Items',
        'Project_Budget_Income_Line_Items',
        'Project_Budget_Transactions'
    )
);

PRINT 'Role permissions removed.'
PRINT ''

-- Phase 2: Remove dp_Pages records
PRINT 'Phase 2: Removing dp_Pages records...'

DELETE FROM dp_Pages WHERE Table_Name = 'Project_Budget_Transactions';
DELETE FROM dp_Pages WHERE Table_Name = 'Project_Budget_Income_Line_Items';
DELETE FROM dp_Pages WHERE Table_Name = 'Project_Budget_Expense_Line_Items';
DELETE FROM dp_Pages WHERE Table_Name = 'Project_Budget_Categories';
DELETE FROM dp_Pages WHERE Table_Name = 'Project_Budget_Payment_Methods';
DELETE FROM dp_Pages WHERE Table_Name = 'Project_Budget_Statuses';

PRINT 'dp_Pages records removed.'
PRINT ''

-- Phase 3: Remove Field Management entries
PRINT 'Phase 3: Removing Field Management entries...'

DELETE FROM dp_Page_Fields WHERE Page_ID = 957 AND Field_Name = 'Budgets_Enabled';
DELETE FROM dp_Page_Fields WHERE Page_ID = 957 AND Field_Name = 'Budget_Status_ID';
DELETE FROM dp_Page_Fields WHERE Page_ID = 957 AND Field_Name = 'Budget_Locked';
DELETE FROM dp_Page_Fields WHERE Page_ID = 957 AND Field_Name = 'Expected_Registration_Revenue';
DELETE FROM dp_Page_Fields WHERE Page_ID = 308 AND Field_Name = 'Include_Registrations_In_Project_Budgets';

PRINT 'Field Management entries removed.'
PRINT ''

-- Phase 4: Drop FK constraints to dp_Domains
PRINT 'Phase 4: Dropping Domain_ID FK constraints...'

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_ProjectBudgetTransactions_Domain')
    ALTER TABLE dbo.Project_Budget_Transactions DROP CONSTRAINT FK_ProjectBudgetTransactions_Domain;

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_ProjectBudgetIncomeLineItems_Domain')
    ALTER TABLE dbo.Project_Budget_Income_Line_Items DROP CONSTRAINT FK_ProjectBudgetIncomeLineItems_Domain;

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_ProjectBudgetExpenseLineItems_Domain')
    ALTER TABLE dbo.Project_Budget_Expense_Line_Items DROP CONSTRAINT FK_ProjectBudgetExpenseLineItems_Domain;

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_ProjectBudgetCategories_Domain')
    ALTER TABLE dbo.Project_Budget_Categories DROP CONSTRAINT FK_ProjectBudgetCategories_Domain;

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_ProjectBudgetPaymentMethods_Domain')
    ALTER TABLE dbo.Project_Budget_Payment_Methods DROP CONSTRAINT FK_ProjectBudgetPaymentMethods_Domain;

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_ProjectBudgetStatuses_Domain')
    ALTER TABLE dbo.Project_Budget_Statuses DROP CONSTRAINT FK_ProjectBudgetStatuses_Domain;

PRINT 'Domain_ID FK constraints dropped.'
PRINT ''

-- Phase 5: Drop new budget tables (in reverse order of creation)
PRINT 'Phase 5: Dropping budget tables...'

IF OBJECT_ID('dbo.Project_Budget_Transactions', 'U') IS NOT NULL
BEGIN
    PRINT 'Dropping Project_Budget_Transactions...'
    DROP TABLE dbo.Project_Budget_Transactions
END

IF OBJECT_ID('dbo.Project_Budget_Expense_Line_Items', 'U') IS NOT NULL
BEGIN
    PRINT 'Dropping Project_Budget_Expense_Line_Items...'
    DROP TABLE dbo.Project_Budget_Expense_Line_Items
END

IF OBJECT_ID('dbo.Project_Budget_Income_Line_Items', 'U') IS NOT NULL
BEGIN
    PRINT 'Dropping Project_Budget_Income_Line_Items...'
    DROP TABLE dbo.Project_Budget_Income_Line_Items
END

IF OBJECT_ID('dbo.Project_Budget_Categories', 'U') IS NOT NULL
BEGIN
    PRINT 'Dropping Project_Budget_Categories...'
    DROP TABLE dbo.Project_Budget_Categories
END

IF OBJECT_ID('dbo.Project_Budget_Payment_Methods', 'U') IS NOT NULL
BEGIN
    PRINT 'Dropping Project_Budget_Payment_Methods...'
    DROP TABLE dbo.Project_Budget_Payment_Methods
END

IF OBJECT_ID('dbo.Project_Budget_Statuses', 'U') IS NOT NULL
BEGIN
    PRINT 'Dropping Project_Budget_Statuses...'
    DROP TABLE dbo.Project_Budget_Statuses
END

PRINT 'Budget tables dropped.'
PRINT ''

-- Phase 6: Remove budget columns from Events table
PRINT 'Phase 6: Removing budget columns from Events table...'

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Events') AND name = 'Include_Registrations_In_Project_Budgets')
BEGIN
    ALTER TABLE dbo.Events DROP COLUMN Include_Registrations_In_Project_Budgets
    PRINT 'Include_Registrations_In_Project_Budgets column removed from Events.'
END

PRINT ''

-- Phase 7: Remove budget columns from Projects table
PRINT 'Phase 7: Removing budget columns from Projects table...'

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Projects') AND name = 'Expected_Registration_Revenue')
BEGIN
    ALTER TABLE dbo.Projects DROP COLUMN Expected_Registration_Revenue
    PRINT 'Expected_Registration_Revenue column removed.'
END

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Projects') AND name = 'Budget_Locked')
BEGIN
    ALTER TABLE dbo.Projects DROP COLUMN Budget_Locked
    PRINT 'Budget_Locked column removed.'
END

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Projects') AND name = 'Budget_Status_ID')
BEGIN
    ALTER TABLE dbo.Projects DROP COLUMN Budget_Status_ID
    PRINT 'Budget_Status_ID column removed.'
END

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Projects') AND name = 'Budgets_Enabled')
BEGIN
    ALTER TABLE dbo.Projects DROP COLUMN Budgets_Enabled
    PRINT 'Budgets_Enabled column removed.'
END

PRINT ''
PRINT '========================================='
PRINT 'Budget System Rollback Complete!'
PRINT 'All budget data has been removed.'
PRINT '========================================='
GO
