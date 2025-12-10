-- =============================================
-- Master Budget Migration Script
-- Author: Claude Code
-- Date: 2025-12-09
-- Description: Runs all budget-related migrations in order
-- Usage: Execute this file to run all migrations
-- =============================================

USE [MinistryPlatform]
GO

PRINT '========================================='
PRINT 'Starting Budget System Migration'
PRINT '========================================='
PRINT ''

-- Phase 1: Drop old tables
PRINT 'Phase 1: Dropping old budget tables...'
:r 01-drop-old-budget-tables.sql
PRINT ''

-- Phase 2: Alter existing tables
PRINT 'Phase 2: Adding budget fields to Projects table...'
:r 02-alter-projects-table-for-budgets.sql
PRINT ''

PRINT 'Phase 2: Adding budget fields to Events table...'
:r 03-alter-events-table-for-budgets.sql
PRINT ''

-- Phase 3: Create new tables
PRINT 'Phase 3: Creating Project_Budget_Categories table...'
:r 04-create-project-budget-categories.sql
PRINT ''

PRINT 'Phase 3: Creating Project_Budget_Expense_Line_Items table...'
:r 05-create-project-budget-expense-line-items.sql
PRINT ''

PRINT 'Phase 3: Creating Project_Budget_Income_Line_Items table...'
:r 06-create-project-budget-income-line-items.sql
PRINT ''

PRINT 'Phase 3: Creating Project_Budget_Payment_Methods table...'
:r 07-create-project-budget-payment-methods.sql
PRINT ''

PRINT 'Phase 3: Creating Project_Budget_Transactions table...'
:r 08-create-project-budget-transactions.sql
PRINT ''

-- Phase 4: Field Management
PRINT 'Phase 4: Configuring Field Management...'
:r 09-add-field-management-for-budgets.sql
PRINT ''

PRINT 'Phase 4: Creating Budget Statuses lookup table...'
:r 10-create-budget-statuses-lookup.sql
PRINT ''

-- Phase 5: Domain_ID and dp_Pages
PRINT 'Phase 5: Adding Domain_ID and creating dp_Pages records...'
:r 11-add-domain-id-and-dp-pages.sql
PRINT ''

-- Phase 6: Cleanup
PRINT 'Phase 6: Removing Expected_Participant_Count field...'
:r 12-remove-expected-participant-count.sql
PRINT ''

-- Phase 7: Role Permissions
PRINT 'Phase 7: Adding budget tables to Administrator role...'
:r 13-add-budget-tables-to-admin-role.sql
PRINT ''

PRINT '========================================='
PRINT 'Budget System Migration Complete!'
PRINT '========================================='
GO
