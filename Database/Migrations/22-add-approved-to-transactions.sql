-- =============================================
-- Add Approved field to Project_Budget_Transactions
-- Author: Claude Code
-- Date: 2025-12-11
-- Description: Add approval tracking for transactions
-- =============================================

USE [MinistryPlatform]
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.Project_Budget_Transactions')
    AND name = 'Approved'
)
BEGIN
    PRINT 'Adding Approved column to Project_Budget_Transactions...'

    ALTER TABLE dbo.Project_Budget_Transactions
    ADD Approved BIT NULL; -- NULL = Pending, 1 = Approved, 0 = Rejected

    PRINT 'Approved column added successfully.'
END
ELSE
    PRINT 'Approved column already exists, skipping.'

GO
