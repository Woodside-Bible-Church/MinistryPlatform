-- =============================================
-- Add Approved Bit Field to Expense Line Items
-- Date: 2025-12-11
-- Description: Add nullable Approved field (1=Approved, 0=Rejected, NULL=Pending)
-- =============================================

USE [MinistryPlatform]
GO

PRINT 'Adding Approved field to Project_Budget_Expense_Line_Items...'

-- Add Approved column if it doesn't exist
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Project_Budget_Expense_Line_Items') AND name = 'Approved')
BEGIN
    PRINT 'Adding Approved column...'
    ALTER TABLE dbo.Project_Budget_Expense_Line_Items
    ADD Approved BIT NULL;

    PRINT 'Approved column added.'
    PRINT 'Values: 1 = Approved, 0 = Rejected, NULL = Pending'
END
ELSE
    PRINT 'Approved column already exists.'
GO

-- Verify the column
PRINT ''
PRINT 'Verification:'
SELECT
    c.name AS ColumnName,
    t.name AS DataType,
    c.is_nullable AS IsNullable
FROM sys.columns c
INNER JOIN sys.types t ON c.user_type_id = t.user_type_id
WHERE c.object_id = OBJECT_ID('dbo.Project_Budget_Expense_Line_Items')
    AND c.name = 'Approved';

PRINT ''
PRINT 'Approved field added successfully!'
PRINT 'Use 1 for Approved, 0 for Rejected, NULL for Pending'
GO
