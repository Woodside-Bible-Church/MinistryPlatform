-- =============================================
-- Add Budget Fields to Projects Table
-- Author: Claude Code
-- Date: 2025-12-09
-- Description: Add budget tracking fields to Projects table
-- =============================================

USE [MinistryPlatform]
GO

-- Add Budgets_Enabled field
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Projects') AND name = 'Budgets_Enabled')
BEGIN
    PRINT 'Adding Budgets_Enabled column to Projects table...'
    ALTER TABLE dbo.Projects ADD Budgets_Enabled BIT NOT NULL DEFAULT 0
    PRINT 'Budgets_Enabled column added.'
END
ELSE
    PRINT 'Budgets_Enabled column already exists, skipping.'

-- Add Budget_Status field
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Projects') AND name = 'Budget_Status')
BEGIN
    PRINT 'Adding Budget_Status column to Projects table...'
    ALTER TABLE dbo.Projects ADD Budget_Status VARCHAR(50) NULL
    PRINT 'Budget_Status column added.'
END
ELSE
    PRINT 'Budget_Status column already exists, skipping.'

-- Add Budget_Locked field
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Projects') AND name = 'Budget_Locked')
BEGIN
    PRINT 'Adding Budget_Locked column to Projects table...'
    ALTER TABLE dbo.Projects ADD Budget_Locked BIT NOT NULL DEFAULT 0
    PRINT 'Budget_Locked column added.'
END
ELSE
    PRINT 'Budget_Locked column already exists, skipping.'

-- Add Expected_Registration_Revenue field
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Projects') AND name = 'Expected_Registration_Revenue')
BEGIN
    PRINT 'Adding Expected_Registration_Revenue column to Projects table...'
    ALTER TABLE dbo.Projects ADD Expected_Registration_Revenue MONEY NULL
    PRINT 'Expected_Registration_Revenue column added.'
END
ELSE
    PRINT 'Expected_Registration_Revenue column already exists, skipping.'

GO
