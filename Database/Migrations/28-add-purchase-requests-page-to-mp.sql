-- =============================================
-- Add Table Project_Budget_Purchase_Requests to MinistryPlatform
-- Date: 2025-12-11
-- Description: Register Project_Budget_Purchase_Requests as a page and grant API access
-- =============================================

USE [MinistryPlatform]
GO

PRINT 'Registering Project_Budget_Purchase_Requests in MinistryPlatform...'

-- Step 1: Domain_ID already added in table creation (25-create-purchase-requests-table.sql)
PRINT 'Domain_ID already exists in Project_Budget_Purchase_Requests.'

-- Step 2: Create dp_Pages record
IF NOT EXISTS (SELECT 1 FROM dp_Pages WHERE Table_Name = 'Project_Budget_Purchase_Requests')
BEGIN
    PRINT 'Creating dp_Pages record for Project_Budget_Purchase_Requests...'
    INSERT INTO dp_Pages (
        Display_Name,
        Singular_Name,
        View_Order,
        Table_Name,
        Primary_Key,
        Default_Field_List,
        Selected_Record_Expression,
        Suppress_New_Button,
        Display_Copy
    ) VALUES (
        'Project Budget Purchase Requests',
        'Project Budget Purchase Request',
        150,
        'Project_Budget_Purchase_Requests',
        'Purchase_Request_ID',
        'Purchase_Request_ID, Requisition_GUID, Project_ID_Table.Project_Title, Project_Budget_Expense_Line_Item_ID_Table.Item_Name, Requested_By_Contact_ID_Table.Display_Name AS [Requested By], Requested_Date, Amount, Vendor_Name, Approval_Status, Approved_By_Contact_ID_Table.Display_Name AS [Approved By], Approved_Date',
        'Project_ID_Table.Project_Title + '' - '' + Project_Budget_Expense_Line_Item_ID_Table.Item_Name',
        0,
        1
    );
    PRINT 'dp_Pages record created for Project_Budget_Purchase_Requests.'
END
ELSE
    PRINT 'dp_Pages record already exists for Project_Budget_Purchase_Requests.'

-- Step 3: Grant Administrator role permissions
DECLARE @PageID INT;
SELECT @PageID = Page_ID FROM dp_Pages WHERE Table_Name = 'Project_Budget_Purchase_Requests';

IF NOT EXISTS (SELECT 1 FROM dp_Role_Pages WHERE Role_ID = 2 AND Page_ID = @PageID)
BEGIN
    PRINT 'Adding Project_Budget_Purchase_Requests to Administrator role...'
    INSERT INTO dp_Role_Pages (
        Role_ID,
        Page_ID,
        Access_Level,
        Scope_All,
        Approver,
        File_Attacher,
        Data_Importer,
        Data_Exporter,
        Secure_Records,
        Allow_Comments,
        Quick_Add
    ) VALUES (
        2,
        @PageID,
        3,
        0,
        0,
        1,
        0,
        1,
        0,
        0,
        0
    );
    PRINT 'Project_Budget_Purchase_Requests added to Administrator role.'
END
ELSE
    PRINT 'Project_Budget_Purchase_Requests already has Administrator role permissions.'

-- Step 4: Verify registration
PRINT ''
PRINT 'Verification:'
SELECT
    p.Page_ID,
    p.Display_Name,
    p.Table_Name,
    rp.Access_Level,
    r.Role_Name
FROM dp_Pages p
LEFT JOIN dp_Role_Pages rp ON p.Page_ID = rp.Page_ID
LEFT JOIN dp_Roles r ON rp.Role_ID = r.Role_ID
WHERE p.Table_Name = 'Project_Budget_Purchase_Requests';

PRINT ''
PRINT 'Project_Budget_Purchase_Requests registration complete!'
PRINT ''
PRINT 'API endpoint: https://my.woodsidebible.org/ministryplatformapi/tables/Project_Budget_Purchase_Requests'
GO
