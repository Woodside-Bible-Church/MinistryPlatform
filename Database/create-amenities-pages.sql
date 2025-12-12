-- =====================================================
-- Create MinistryPlatform Pages for Event Amenities System
-- Creates pages for Amenities lookup table and Event_Amenities junction
-- Author: Colton Wirgau
-- Date: 2025-12-12
-- =====================================================

USE MinistryPlatform;
GO

DECLARE @PageID_Amenities INT;
DECLARE @PageID_EventAmenities INT;
DECLARE @PageID_Events INT;
DECLARE @AdminRoleID INT;

-- Get Events page ID for subpage parent
SELECT @PageID_Events = Page_ID FROM dp_Pages WHERE Table_Name = 'Events';

-- Get Administrator role ID
SELECT @AdminRoleID = Role_ID FROM dp_Roles WHERE Role_Name = 'Administrators';

-- =====================================================
-- 1. Create Amenities Page (Main Lookup Table)
-- =====================================================
IF NOT EXISTS (SELECT 1 FROM dp_Pages WHERE Table_Name = 'Amenities')
BEGIN
    INSERT INTO dp_Pages (
        Display_Name,
        Singular_Name,
        [Description],
        Table_Name,
        Primary_Key,
        Default_Field_List,
        Selected_Record_Expression,
        Filter_Clause,
        Default_View,
        View_Order,
        System_Name,
        Display_Copy,
        Suppress_New_Button,
        In_Global_Search
    )
    VALUES (
        'Amenities',
        'Amenity',
        'Event amenity types (childcare, ASL, etc.) with icons and colors',
        'Amenities',
        'Amenity_ID',
        'Amenities.Amenity_ID
,Amenities.Amenity_Name
,Amenities.Amenity_Description
,Amenities.Icon_Name
,Amenities.Icon_Color
,Amenities.Display_Order
,Amenities.Is_Active',
        'Amenities.Amenity_Name',
        'Amenities.Domain_ID = @DomainID',
        NULL,
        10,
        'Amenities',
        0,
        0,
        1
    );

    SET @PageID_Amenities = SCOPE_IDENTITY();
    PRINT 'Created page: Amenities (Page_ID: ' + CAST(@PageID_Amenities AS VARCHAR) + ')';
END
ELSE
BEGIN
    SELECT @PageID_Amenities = Page_ID FROM dp_Pages WHERE Table_Name = 'Amenities';
    PRINT 'Page already exists: Amenities (Page_ID: ' + CAST(@PageID_Amenities AS VARCHAR) + ')';
END

-- =====================================================
-- 2. Create Page Fields for Amenities
-- =====================================================
-- Amenity_ID (Hidden)
IF NOT EXISTS (SELECT 1 FROM dp_Page_Fields WHERE Page_ID = @PageID_Amenities AND Field_Name = 'Amenities.Amenity_ID')
BEGIN
    INSERT INTO dp_Page_Fields (Page_ID, Field_Name, Field_Label, Required, Hidden, View_Order)
    VALUES (@PageID_Amenities, 'Amenities.Amenity_ID', 'Amenity ID', 0, 1, 1);
END

-- Amenity_Name (Required)
IF NOT EXISTS (SELECT 1 FROM dp_Page_Fields WHERE Page_ID = @PageID_Amenities AND Field_Name = 'Amenities.Amenity_Name')
BEGIN
    INSERT INTO dp_Page_Fields (Page_ID, Field_Name, Field_Label, Required, View_Order)
    VALUES (@PageID_Amenities, 'Amenities.Amenity_Name', 'Amenity Name', 1, 2);
END

-- Amenity_Description
IF NOT EXISTS (SELECT 1 FROM dp_Page_Fields WHERE Page_ID = @PageID_Amenities AND Field_Name = 'Amenities.Amenity_Description')
BEGIN
    INSERT INTO dp_Page_Fields (Page_ID, Field_Name, Field_Label, Required, View_Order)
    VALUES (@PageID_Amenities, 'Amenities.Amenity_Description', 'Description (Tooltip)', 0, 3);
END

-- Icon_Name (Required)
IF NOT EXISTS (SELECT 1 FROM dp_Page_Fields WHERE Page_ID = @PageID_Amenities AND Field_Name = 'Amenities.Icon_Name')
BEGIN
    INSERT INTO dp_Page_Fields (Page_ID, Field_Name, Field_Label, Required, View_Order)
    VALUES (@PageID_Amenities, 'Amenities.Icon_Name', 'Lucide Icon Name', 1, 4);
END

-- Icon_Color (dp_Color type - auto color picker)
IF NOT EXISTS (SELECT 1 FROM dp_Page_Fields WHERE Page_ID = @PageID_Amenities AND Field_Name = 'Amenities.Icon_Color')
BEGIN
    INSERT INTO dp_Page_Fields (Page_ID, Field_Name, Field_Label, Required, View_Order)
    VALUES (@PageID_Amenities, 'Amenities.Icon_Color', 'Icon Color', 0, 5);
END

-- Display_Order (Required)
IF NOT EXISTS (SELECT 1 FROM dp_Page_Fields WHERE Page_ID = @PageID_Amenities AND Field_Name = 'Amenities.Display_Order')
BEGIN
    INSERT INTO dp_Page_Fields (Page_ID, Field_Name, Field_Label, Required, View_Order, Default_Value)
    VALUES (@PageID_Amenities, 'Amenities.Display_Order', 'Display Order', 1, 6, '0');
END

-- Is_Active
IF NOT EXISTS (SELECT 1 FROM dp_Page_Fields WHERE Page_ID = @PageID_Amenities AND Field_Name = 'Amenities.Is_Active')
BEGIN
    INSERT INTO dp_Page_Fields (Page_ID, Field_Name, Field_Label, Required, View_Order, Default_Value)
    VALUES (@PageID_Amenities, 'Amenities.Is_Active', 'Active', 1, 7, '1');
END

PRINT 'Created page fields for Amenities';

-- =====================================================
-- 3. Create Event_Amenities Page (Junction/Subpage)
-- =====================================================
IF NOT EXISTS (SELECT 1 FROM dp_Pages WHERE Table_Name = 'Event_Amenities')
BEGIN
    INSERT INTO dp_Pages (
        Display_Name,
        Singular_Name,
        [Description],
        Table_Name,
        Primary_Key,
        Default_Field_List,
        Selected_Record_Expression,
        Filter_Clause,
        Default_View,
        View_Order,
        System_Name,
        Display_Copy,
        Suppress_New_Button,
        In_Global_Search
    )
    VALUES (
        'Event Amenities',
        'Event Amenity',
        'Links events to their available amenities',
        'Event_Amenities',
        'Event_Amenity_ID',
        'Event_Amenities.Event_Amenity_ID
,Event_ID_Table.Event_Title
,Amenity_ID_Table.Amenity_Name
,Amenity_ID_Table.Icon_Name
,Amenity_ID_Table.Icon_Color',
        'Amenity_ID_Table.Amenity_Name',
        'Event_Amenities.Domain_ID = @DomainID',
        NULL,
        20,
        'Event_Amenities',
        0,
        0,
        0
    );

    SET @PageID_EventAmenities = SCOPE_IDENTITY();
    PRINT 'Created page: Event_Amenities (Page_ID: ' + CAST(@PageID_EventAmenities AS VARCHAR) + ')';
END
ELSE
BEGIN
    SELECT @PageID_EventAmenities = Page_ID FROM dp_Pages WHERE Table_Name = 'Event_Amenities';
    PRINT 'Page already exists: Event_Amenities (Page_ID: ' + CAST(@PageID_EventAmenities AS VARCHAR) + ')';
END

-- =====================================================
-- 4. Create Page Fields for Event_Amenities
-- =====================================================
-- Event_Amenity_ID (Hidden)
IF NOT EXISTS (SELECT 1 FROM dp_Page_Fields WHERE Page_ID = @PageID_EventAmenities AND Field_Name = 'Event_Amenities.Event_Amenity_ID')
BEGIN
    INSERT INTO dp_Page_Fields (Page_ID, Field_Name, Field_Label, Required, Hidden, View_Order)
    VALUES (@PageID_EventAmenities, 'Event_Amenities.Event_Amenity_ID', 'Event Amenity ID', 0, 1, 1);
END

-- Amenity_ID (Dropdown)
IF NOT EXISTS (SELECT 1 FROM dp_Page_Fields WHERE Page_ID = @PageID_EventAmenities AND Field_Name = 'Event_Amenities.Amenity_ID')
BEGIN
    INSERT INTO dp_Page_Fields (Page_ID, Field_Name, Field_Label, Required, View_Order)
    VALUES (@PageID_EventAmenities, 'Event_Amenities.Amenity_ID', 'Amenity', 1, 2);
END

PRINT 'Created page fields for Event_Amenities';

-- =====================================================
-- 5. Create Subpage Relationship (Event_Amenities on Events)
-- =====================================================
IF NOT EXISTS (
    SELECT 1 FROM dp_Sub_Pages
    WHERE Parent_Page_ID = @PageID_Events
    AND Target_Page_ID = @PageID_EventAmenities
)
BEGIN
    INSERT INTO dp_Sub_Pages (
        Display_Name,
        View_Order,
        Parent_Page_ID,
        Parent_Filter_Key,
        Target_Page_ID,
        Target_Filter_Key,
        Default_Field_List,
        Display_Copy,
        Messaging_Default,
        On_Quick_Add
    )
    VALUES (
        'Amenities',                       -- Display name in Events UI
        10,                                -- View order (tab position)
        @PageID_Events,                    -- Parent page (Events)
        'Event_ID',                        -- Parent filter key
        @PageID_EventAmenities,            -- Target subpage
        'Event_ID',                        -- Target filter key
        'Amenity_ID_Table.Amenity_Name, Amenity_ID_Table.Icon_Name',  -- Columns to show
        0,                                 -- Display copy (bit)
        0,                                 -- Messaging default
        0                                  -- On quick add
    );

    PRINT 'Created subpage: Amenities on Events page';
END
ELSE
    PRINT 'Subpage already exists: Amenities on Events page';

-- =====================================================
-- 6. Grant Security Permissions to Administrator Role
-- =====================================================
-- Amenities page
IF NOT EXISTS (
    SELECT 1 FROM dp_Role_Pages
    WHERE Role_ID = @AdminRoleID
    AND Page_ID = @PageID_Amenities
)
BEGIN
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
    )
    VALUES (
        @AdminRoleID,
        @PageID_Amenities,
        3,  -- Access Level (3 = Full access)
        1,  -- Scope All
        0,  -- Approver
        0,  -- File Attacher
        0,  -- Data Importer
        0,  -- Data Exporter
        0,  -- Secure Records
        0,  -- Allow Comments
        0   -- Quick Add
    );

    PRINT 'Granted Administrator access to Amenities page';
END
ELSE
    PRINT 'Administrator already has access to Amenities page';

-- Event_Amenities page
IF NOT EXISTS (
    SELECT 1 FROM dp_Role_Pages
    WHERE Role_ID = @AdminRoleID
    AND Page_ID = @PageID_EventAmenities
)
BEGIN
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
    )
    VALUES (
        @AdminRoleID,
        @PageID_EventAmenities,
        3,  -- Access Level (3 = Full access)
        1,  -- Scope All
        0,  -- Approver
        0,  -- File Attacher
        0,  -- Data Importer
        0,  -- Data Exporter
        0,  -- Secure Records
        0,  -- Allow Comments
        0   -- Quick Add
    );

    PRINT 'Granted Administrator access to Event_Amenities page';
END
ELSE
    PRINT 'Administrator already has access to Event_Amenities page';

-- =====================================================
-- Summary
-- =====================================================
PRINT '';
PRINT '========================================';
PRINT 'Event Amenities Pages Created Successfully!';
PRINT '========================================';
PRINT 'Amenities Page ID: ' + CAST(@PageID_Amenities AS VARCHAR);
PRINT 'Event_Amenities Page ID: ' + CAST(@PageID_EventAmenities AS VARCHAR);
PRINT '';
PRINT 'Next Steps:';
PRINT '1. Run both scripts in MinistryPlatform';
PRINT '2. Navigate to Setup > Pages > Amenities to verify';
PRINT '3. Navigate to Events > select event > Amenities tab';
PRINT '4. Update api_Custom_RSVP_Project_Data_JSON stored procedure';
PRINT '========================================';
GO
