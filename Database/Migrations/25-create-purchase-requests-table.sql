-- =============================================
-- Create Project_Budget_Purchase_Requests Table
-- Author: Claude Code
-- Date: 2025-12-11
-- Description: Create table for expense approval workflow (Purchase Requests)
-- =============================================

USE [MinistryPlatform]
GO

-- Create the Purchase Requests table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Project_Budget_Purchase_Requests')
BEGIN
    PRINT 'Creating Project_Budget_Purchase_Requests table...'

    CREATE TABLE [dbo].[Project_Budget_Purchase_Requests] (
        [Purchase_Request_ID] INT IDENTITY(1,1) NOT NULL,
        [Requisition_GUID] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
        [Project_ID] INT NOT NULL,
        [Project_Budget_Expense_Line_Item_ID] INT NOT NULL,
        [Requested_By_Contact_ID] INT NOT NULL,
        [Requested_Date] DATETIME NOT NULL DEFAULT GETDATE(),
        [Amount] DECIMAL(18, 2) NOT NULL,
        [Description] NVARCHAR(500) NULL,
        [Vendor_Name] NVARCHAR(100) NULL,
        [Approval_Status] NVARCHAR(50) NOT NULL DEFAULT 'Pending',
        [Approved_By_Contact_ID] INT NULL,
        [Approved_Date] DATETIME NULL,
        [Rejection_Reason] NVARCHAR(500) NULL,
        [Domain_ID] INT NOT NULL DEFAULT 1,
        [__ExternalId] INT NULL,

        CONSTRAINT [PK_Project_Budget_Purchase_Requests] PRIMARY KEY CLUSTERED ([Purchase_Request_ID]),
        CONSTRAINT [FK_Purchase_Requests_Projects] FOREIGN KEY ([Project_ID])
            REFERENCES [dbo].[Projects]([Project_ID]),
        CONSTRAINT [FK_Purchase_Requests_Expense_Line_Items] FOREIGN KEY ([Project_Budget_Expense_Line_Item_ID])
            REFERENCES [dbo].[Project_Budget_Expense_Line_Items]([Project_Budget_Expense_Line_Item_ID]),
        CONSTRAINT [FK_Purchase_Requests_Requested_By] FOREIGN KEY ([Requested_By_Contact_ID])
            REFERENCES [dbo].[Contacts]([Contact_ID]),
        CONSTRAINT [FK_Purchase_Requests_Approved_By] FOREIGN KEY ([Approved_By_Contact_ID])
            REFERENCES [dbo].[Contacts]([Contact_ID])
    );

    PRINT 'Project_Budget_Purchase_Requests table created successfully.'
END
ELSE
    PRINT 'Project_Budget_Purchase_Requests table already exists, skipping.'
GO

-- Create indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Purchase_Requests_Project' AND object_id = OBJECT_ID('dbo.Project_Budget_Purchase_Requests'))
BEGIN
    PRINT 'Creating index IX_Purchase_Requests_Project...'
    CREATE NONCLUSTERED INDEX [IX_Purchase_Requests_Project]
        ON [dbo].[Project_Budget_Purchase_Requests]([Project_ID]);
    PRINT 'Index created.'
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Purchase_Requests_Requisition_GUID' AND object_id = OBJECT_ID('dbo.Project_Budget_Purchase_Requests'))
BEGIN
    PRINT 'Creating index IX_Purchase_Requests_Requisition_GUID...'
    CREATE NONCLUSTERED INDEX [IX_Purchase_Requests_Requisition_GUID]
        ON [dbo].[Project_Budget_Purchase_Requests]([Requisition_GUID]);
    PRINT 'Index created.'
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Purchase_Requests_Requested_By' AND object_id = OBJECT_ID('dbo.Project_Budget_Purchase_Requests'))
BEGIN
    PRINT 'Creating index IX_Purchase_Requests_Requested_By...'
    CREATE NONCLUSTERED INDEX [IX_Purchase_Requests_Requested_By]
        ON [dbo].[Project_Budget_Purchase_Requests]([Requested_By_Contact_ID]);
    PRINT 'Index created.'
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Purchase_Requests_Status' AND object_id = OBJECT_ID('dbo.Project_Budget_Purchase_Requests'))
BEGIN
    PRINT 'Creating index IX_Purchase_Requests_Status...'
    CREATE NONCLUSTERED INDEX [IX_Purchase_Requests_Status]
        ON [dbo].[Project_Budget_Purchase_Requests]([Approval_Status]);
    PRINT 'Index created.'
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Purchase_Requests_Line_Item' AND object_id = OBJECT_ID('dbo.Project_Budget_Purchase_Requests'))
BEGIN
    PRINT 'Creating index IX_Purchase_Requests_Line_Item...'
    CREATE NONCLUSTERED INDEX [IX_Purchase_Requests_Line_Item]
        ON [dbo].[Project_Budget_Purchase_Requests]([Project_Budget_Expense_Line_Item_ID]);
    PRINT 'Index created.'
END

GO
