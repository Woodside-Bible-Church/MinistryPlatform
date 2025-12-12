-- =============================================
-- Complete Purchase Requests Registration
-- Run this AFTER refreshing metadata in MinistryPlatform
-- =============================================

USE [MinistryPlatform]
GO

PRINT '========================================='
PRINT 'Registering Purchase Requests in MinistryPlatform'
PRINT '========================================='
PRINT ''

-- =============================================
-- Step 1: Register the Page
-- =============================================
PRINT 'Step 1: Registering Page...'

IF NOT EXISTS (SELECT 1 FROM dp_Pages WHERE Table_Name = 'Project_Budget_Purchase_Requests')
BEGIN
    INSERT INTO dp_Pages (
        Display_Name,
        Singular_Name,
        View_Order,
        Table_Name,
        Primary_Key,
        Default_Field_List,
        Selected_Record_Expression,
        Suppress_New_Button,
        Display_Copy,
        Files_Publicly_Accessible,
        In_Global_Search
    ) VALUES (
        'Project Budget Purchase Requests',
        'Project Budget Purchase Request',
        150,
        'Project_Budget_Purchase_Requests',
        'Purchase_Request_ID',
        'Purchase_Request_ID, Requisition_GUID, Project_ID_Table.Project_Title, Project_Budget_Expense_Line_Item_ID_Table.Item_Name, Requested_By_Contact_ID_Table.Display_Name AS [Requested By], Requested_Date, Amount, Vendor_Name, Approval_Status, Approved_By_Contact_ID_Table.Display_Name AS [Approved By], Approved_Date',
        'Project_ID_Table.Project_Title + '' - '' + Project_Budget_Expense_Line_Item_ID_Table.Item_Name',
        0,
        1,
        1,
        0
    );
    PRINT '✓ Page registered successfully'
END
ELSE
    PRINT 'Page already exists'

GO

-- =============================================
-- Step 2: Grant Page Permissions to Administrators
-- =============================================
PRINT ''
PRINT 'Step 2: Granting page permissions...'

DECLARE @PageID INT;
SELECT @PageID = Page_ID FROM dp_Pages WHERE Table_Name = 'Project_Budget_Purchase_Requests';

IF NOT EXISTS (SELECT 1 FROM dp_Role_Pages WHERE Role_ID = 2 AND Page_ID = @PageID)
BEGIN
    INSERT INTO dp_Role_Pages (Role_ID, Page_ID, Access_Level)
    VALUES (2, @PageID, 3);
    PRINT '✓ Administrator access granted to page'
END
ELSE
    PRINT 'Page permissions already exist'

GO

-- =============================================
-- Step 3: Register API Procedures
-- =============================================
PRINT ''
PRINT 'Step 3: Registering API Procedures...'

-- Procedure 1: GetProjectPurchaseRequests
IF NOT EXISTS (SELECT 1 FROM dp_API_Procedures WHERE Procedure_Name = 'api_Custom_GetProjectPurchaseRequests_JSON')
BEGIN
    INSERT INTO dp_API_Procedures (Procedure_Name, Description)
    VALUES ('api_Custom_GetProjectPurchaseRequests_JSON', 'Get project purchase requests with optional filter by requester');
    PRINT '✓ Registered api_Custom_GetProjectPurchaseRequests_JSON'
END
ELSE
    PRINT 'api_Custom_GetProjectPurchaseRequests_JSON already exists'

-- Procedure 2: GetPurchaseRequestDetails
IF NOT EXISTS (SELECT 1 FROM dp_API_Procedures WHERE Procedure_Name = 'api_Custom_GetPurchaseRequestDetails_JSON')
BEGIN
    INSERT INTO dp_API_Procedures (Procedure_Name, Description)
    VALUES ('api_Custom_GetPurchaseRequestDetails_JSON', 'Get detailed information for a purchase request including transactions');
    PRINT '✓ Registered api_Custom_GetPurchaseRequestDetails_JSON'
END
ELSE
    PRINT 'api_Custom_GetPurchaseRequestDetails_JSON already exists'

GO

-- =============================================
-- Step 4: Grant API Procedure Permissions
-- =============================================
PRINT ''
PRINT 'Step 4: Granting API procedure permissions...'

DECLARE @ProcID1 INT, @ProcID2 INT;

SELECT @ProcID1 = API_Procedure_ID FROM dp_API_Procedures WHERE Procedure_Name = 'api_Custom_GetProjectPurchaseRequests_JSON';
SELECT @ProcID2 = API_Procedure_ID FROM dp_API_Procedures WHERE Procedure_Name = 'api_Custom_GetPurchaseRequestDetails_JSON';

-- Grant to Administrators (Role ID 2)
IF NOT EXISTS (SELECT 1 FROM dp_Role_API_Procedures WHERE Role_ID = 2 AND API_Procedure_ID = @ProcID1)
BEGIN
    INSERT INTO dp_Role_API_Procedures (Role_ID, API_Procedure_ID, Domain_ID)
    VALUES (2, @ProcID1, 1);
    PRINT '✓ Granted Administrators access to GetProjectPurchaseRequests'
END

IF NOT EXISTS (SELECT 1 FROM dp_Role_API_Procedures WHERE Role_ID = 2 AND API_Procedure_ID = @ProcID2)
BEGIN
    INSERT INTO dp_Role_API_Procedures (Role_ID, API_Procedure_ID, Domain_ID)
    VALUES (2, @ProcID2, 1);
    PRINT '✓ Granted Administrators access to GetPurchaseRequestDetails'
END

GO

-- =============================================
-- Verification
-- =============================================
PRINT ''
PRINT '========================================='
PRINT 'Verification:'
PRINT '========================================='

SELECT
    'Page Registration' AS Check_Type,
    Display_Name,
    Table_Name,
    Page_ID
FROM dp_Pages
WHERE Table_Name = 'Project_Budget_Purchase_Requests';

SELECT
    'Page Permissions' AS Check_Type,
    r.Role_Name,
    p.Display_Name AS Page_Name,
    rp.Access_Level
FROM dp_Pages p
INNER JOIN dp_Role_Pages rp ON p.Page_ID = rp.Page_ID
INNER JOIN dp_Roles r ON rp.Role_ID = r.Role_ID
WHERE p.Table_Name = 'Project_Budget_Purchase_Requests';

SELECT
    'API Procedures' AS Check_Type,
    ap.Procedure_Name,
    r.Role_Name
FROM dp_API_Procedures ap
LEFT JOIN dp_Role_API_Procedures rap ON ap.API_Procedure_ID = rap.API_Procedure_ID
LEFT JOIN dp_Roles r ON rap.Role_ID = r.Role_ID
WHERE ap.Procedure_Name LIKE '%PurchaseRequest%';

PRINT ''
PRINT '========================================='
PRINT 'Registration Complete!'
PRINT 'Now refresh metadata ONE MORE TIME in MinistryPlatform'
PRINT '========================================='

GO
