-- =============================================
-- Create Line_Item_Statuses Lookup Table
-- Date: 2025-12-11
-- Description: Create lookup table for budget line item statuses
-- =============================================

USE [MinistryPlatform]
GO

PRINT 'Creating Line_Item_Statuses table...'

-- Create the lookup table
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Line_Item_Statuses')
BEGIN
    CREATE TABLE dbo.Line_Item_Statuses (
        Line_Item_Status_ID INT PRIMARY KEY IDENTITY(1,1),
        Status_Name NVARCHAR(50) NOT NULL UNIQUE,
        Description NVARCHAR(255) NULL,
        Sort_Order INT NULL,
        Domain_ID INT NOT NULL DEFAULT 1,

        CONSTRAINT FK_LineItemStatuses_Domain
            FOREIGN KEY (Domain_ID)
            REFERENCES dbo.dp_Domains(Domain_ID)
    );

    PRINT 'Line_Item_Statuses table created.'

    -- Seed initial status values
    PRINT 'Seeding initial status values...'
    INSERT INTO dbo.Line_Item_Statuses (Status_Name, Description, Sort_Order, Domain_ID)
    VALUES
        ('Pending', 'Line item is awaiting approval', 1, 1),
        ('Approved', 'Line item has been approved', 2, 1),
        ('Rejected', 'Line item has been rejected', 3, 1);

    PRINT 'Initial status values seeded.'
END
ELSE
    PRINT 'Line_Item_Statuses table already exists.'
GO

-- =============================================
-- Register Line_Item_Statuses as a Page
-- =============================================

PRINT 'Registering Line_Item_Statuses in MinistryPlatform...'

-- Create dp_Pages record
IF NOT EXISTS (SELECT 1 FROM dp_Pages WHERE Table_Name = 'Line_Item_Statuses')
BEGIN
    PRINT 'Creating dp_Pages record for Line_Item_Statuses...'
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
        'Line Item Statuses',
        'Line Item Status',
        750,
        'Line_Item_Statuses',
        'Line_Item_Status_ID',
        'Line_Item_Statuses.Status_Name, Line_Item_Statuses.Description, Line_Item_Statuses.Sort_Order',
        'Line_Item_Statuses.Status_Name',
        0,
        1
    );
    PRINT 'dp_Pages record created for Line_Item_Statuses.'
END
ELSE
    PRINT 'dp_Pages record already exists for Line_Item_Statuses.'
GO

-- Grant Administrator role permissions
DECLARE @PageID INT;
SELECT @PageID = Page_ID FROM dp_Pages WHERE Table_Name = 'Line_Item_Statuses';

IF NOT EXISTS (SELECT 1 FROM dp_Role_Pages WHERE Role_ID = 2 AND Page_ID = @PageID)
BEGIN
    PRINT 'Adding Line_Item_Statuses to Administrator role...'
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
    PRINT 'Line_Item_Statuses added to Administrator role.'
END
ELSE
    PRINT 'Line_Item_Statuses already has Administrator role permissions.'
GO

-- Verify registration
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
WHERE p.Table_Name = 'Line_Item_Statuses';

PRINT ''
PRINT 'Line_Item_Statuses registration complete!'

-- Display current statuses
PRINT ''
PRINT 'Current Line Item Statuses:'
SELECT Line_Item_Status_ID, Status_Name, Description, Sort_Order
FROM dbo.Line_Item_Statuses
ORDER BY Sort_Order;
GO
