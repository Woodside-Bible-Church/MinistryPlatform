-- =============================================
-- Remove Approved field from Project_Budget_Expense_Line_Items
-- Author: Claude Code
-- Date: 2025-12-11
-- Description: Remove approval tracking from line items (moved to transactions)
-- =============================================

USE [MinistryPlatform]
GO

IF EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.Project_Budget_Expense_Line_Items')
    AND name = 'Approved'
)
BEGIN
    PRINT 'Removing Approved column from Project_Budget_Expense_Line_Items...'

    ALTER TABLE dbo.Project_Budget_Expense_Line_Items
    DROP COLUMN Approved;

    PRINT 'Approved column removed successfully.'
END
ELSE
    PRINT 'Approved column does not exist, skipping.'

GO
