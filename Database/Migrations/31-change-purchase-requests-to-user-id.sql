-- Change Purchase Requests to use User_ID instead of Contact_ID
-- This is more reliable since User_ID is always in the session

USE [MinistryPlatform]
GO

PRINT 'Changing Purchase Requests to use User_ID instead of Contact_ID...'

-- Step 1: Drop existing foreign key constraints
IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Purchase_Requests_Requested_By')
BEGIN
    ALTER TABLE [dbo].[Project_Budget_Purchase_Requests]
    DROP CONSTRAINT [FK_Purchase_Requests_Requested_By];
    PRINT '✓ Dropped FK_Purchase_Requests_Requested_By'
END

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Purchase_Requests_Approved_By')
BEGIN
    ALTER TABLE [dbo].[Project_Budget_Purchase_Requests]
    DROP CONSTRAINT [FK_Purchase_Requests_Approved_By];
    PRINT '✓ Dropped FK_Purchase_Requests_Approved_By'
END

-- Step 2: Rename columns (must be in separate batches)
EXEC sp_rename 'Project_Budget_Purchase_Requests.Requested_By_Contact_ID', 'Requested_By_User_ID', 'COLUMN';
PRINT '✓ Renamed Requested_By_Contact_ID to Requested_By_User_ID'
GO

EXEC sp_rename 'Project_Budget_Purchase_Requests.Approved_By_Contact_ID', 'Approved_By_User_ID', 'COLUMN';
PRINT '✓ Renamed Approved_By_Contact_ID to Approved_By_User_ID'
GO

-- Step 3: Convert existing data from Contact_ID to User_ID
-- The columns still contain Contact_IDs, we need to look up the User_IDs
UPDATE pr
SET pr.Requested_By_User_ID = u.User_ID
FROM [dbo].[Project_Budget_Purchase_Requests] pr
INNER JOIN [dbo].[dp_Users] u ON u.Contact_ID = pr.Requested_By_User_ID
WHERE pr.Requested_By_User_ID IS NOT NULL;

PRINT '✓ Converted Requested_By to User_ID'

UPDATE pr
SET pr.Approved_By_User_ID = u.User_ID
FROM [dbo].[Project_Budget_Purchase_Requests] pr
INNER JOIN [dbo].[dp_Users] u ON u.Contact_ID = pr.Approved_By_User_ID
WHERE pr.Approved_By_User_ID IS NOT NULL;

PRINT '✓ Converted Approved_By to User_ID'

-- Step 4: Add new foreign key constraints to dp_Users
ALTER TABLE [dbo].[Project_Budget_Purchase_Requests]
ADD CONSTRAINT [FK_Purchase_Requests_Requested_By]
FOREIGN KEY ([Requested_By_User_ID])
REFERENCES [dbo].[dp_Users]([User_ID]);

ALTER TABLE [dbo].[Project_Budget_Purchase_Requests]
ADD CONSTRAINT [FK_Purchase_Requests_Approved_By]
FOREIGN KEY ([Approved_By_User_ID])
REFERENCES [dbo].[dp_Users]([User_ID]);

PRINT '✓ Added foreign key constraints to dp_Users'

-- Step 5: Update page field list to reflect User_ID columns
UPDATE dp_Pages
SET Default_Field_List = 'Purchase_Request_ID, Requisition_GUID, Project_ID_Table.Project_Title, Project_Budget_Expense_Line_Item_ID_Table.Item_Name, Requested_By_User_ID_Table.Display_Name AS [Requested By], Requested_Date, Amount, Vendor_Name, Approval_Status, Approved_By_User_ID_Table.Display_Name AS [Approved By], Approved_Date'
WHERE Table_Name = 'Project_Budget_Purchase_Requests';

PRINT '✓ Updated page field list'

PRINT ''
PRINT 'Migration complete! Table now uses User_ID instead of Contact_ID'

GO
