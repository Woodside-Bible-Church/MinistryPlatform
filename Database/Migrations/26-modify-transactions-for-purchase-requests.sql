-- =============================================
-- Modify Project_Budget_Transactions for Purchase Requests
-- Author: Claude Code
-- Date: 2025-12-11
-- Description: Add FK to Purchase Requests and remove Approved field
-- =============================================

USE [MinistryPlatform]
GO

-- Add Purchase_Request_ID column if it doesn't exist
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.Project_Budget_Transactions')
    AND name = 'Purchase_Request_ID'
)
BEGIN
    PRINT 'Adding Purchase_Request_ID column to Project_Budget_Transactions...'

    ALTER TABLE [dbo].[Project_Budget_Transactions]
    ADD [Purchase_Request_ID] INT NULL;

    PRINT 'Purchase_Request_ID column added successfully.'
END
ELSE
    PRINT 'Purchase_Request_ID column already exists, skipping.'
GO

-- Add foreign key constraint if it doesn't exist
IF NOT EXISTS (
    SELECT 1 FROM sys.foreign_keys
    WHERE name = 'FK_Transactions_Purchase_Requests'
    AND parent_object_id = OBJECT_ID('dbo.Project_Budget_Transactions')
)
BEGIN
    PRINT 'Adding FK_Transactions_Purchase_Requests foreign key...'

    ALTER TABLE [dbo].[Project_Budget_Transactions]
    ADD CONSTRAINT [FK_Transactions_Purchase_Requests] FOREIGN KEY ([Purchase_Request_ID])
        REFERENCES [dbo].[Project_Budget_Purchase_Requests]([Purchase_Request_ID]);

    PRINT 'Foreign key added successfully.'
END
ELSE
    PRINT 'FK_Transactions_Purchase_Requests already exists, skipping.'
GO

-- Create index on Purchase_Request_ID if it doesn't exist
IF NOT EXISTS (
    SELECT * FROM sys.indexes
    WHERE name = 'IX_Transactions_Purchase_Request'
    AND object_id = OBJECT_ID('dbo.Project_Budget_Transactions')
)
BEGIN
    PRINT 'Creating index IX_Transactions_Purchase_Request...'

    CREATE NONCLUSTERED INDEX [IX_Transactions_Purchase_Request]
        ON [dbo].[Project_Budget_Transactions]([Purchase_Request_ID]);

    PRINT 'Index created successfully.'
END
ELSE
    PRINT 'IX_Transactions_Purchase_Request already exists, skipping.'
GO

-- Remove Approved column if it exists
IF EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.Project_Budget_Transactions')
    AND name = 'Approved'
)
BEGIN
    PRINT 'Removing Approved column from Project_Budget_Transactions...'

    ALTER TABLE [dbo].[Project_Budget_Transactions]
    DROP COLUMN [Approved];

    PRINT 'Approved column removed successfully.'
END
ELSE
    PRINT 'Approved column does not exist, skipping.'
GO
