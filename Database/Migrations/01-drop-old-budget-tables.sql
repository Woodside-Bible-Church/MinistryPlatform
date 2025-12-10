-- =============================================
-- Drop Old Budget Tables
-- Author: Claude Code
-- Date: 2025-12-09
-- Description: Remove old Project_Budgets and Project_Expenses tables
--              (no meaningful data to migrate)
-- =============================================

USE [MinistryPlatform]
GO

-- Drop old tables if they exist
IF OBJECT_ID('dbo.Project_Expenses', 'U') IS NOT NULL
BEGIN
    PRINT 'Dropping Project_Expenses table...'
    DROP TABLE dbo.Project_Expenses
    PRINT 'Project_Expenses table dropped.'
END
ELSE
    PRINT 'Project_Expenses table does not exist, skipping.'

IF OBJECT_ID('dbo.Project_Budgets', 'U') IS NOT NULL
BEGIN
    PRINT 'Dropping Project_Budgets table...'
    DROP TABLE dbo.Project_Budgets
    PRINT 'Project_Budgets table dropped.'
END
ELSE
    PRINT 'Project_Budgets table does not exist, skipping.'

GO
