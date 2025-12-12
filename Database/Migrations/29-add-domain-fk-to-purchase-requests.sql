-- Add Domain_ID foreign key constraint to Project_Budget_Purchase_Requests
-- This is required for MinistryPlatform REST API access

USE [MinistryPlatform]
GO

-- Add foreign key constraint if it doesn't exist
IF NOT EXISTS (
    SELECT 1
    FROM sys.foreign_keys
    WHERE name = 'FK_PurchaseRequests_Domain'
    AND parent_object_id = OBJECT_ID('dbo.Project_Budget_Purchase_Requests')
)
BEGIN
    PRINT 'Adding Domain_ID foreign key constraint...'

    ALTER TABLE [dbo].[Project_Budget_Purchase_Requests]
    ADD CONSTRAINT [FK_PurchaseRequests_Domain]
    FOREIGN KEY ([Domain_ID])
    REFERENCES [dbo].[dp_Domains]([Domain_ID]);

    PRINT 'Foreign key constraint added successfully.'
END
ELSE
    PRINT 'Foreign key constraint already exists.'

GO
