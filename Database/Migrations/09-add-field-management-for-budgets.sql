-- =============================================
-- Add Field Management for Budget Fields
-- Author: Claude Code
-- Date: 2025-12-09
-- Description: Configure field management for Projects and Events pages
-- =============================================

USE [MinistryPlatform]
GO

PRINT 'Adding Field Management entries for budget fields...'

-- Projects Page (Page_ID = 957) - Budget Group
-- 1. Budgets_Enabled
IF NOT EXISTS (SELECT 1 FROM dp_Page_Fields WHERE Page_ID = 957 AND Field_Name = 'Budgets_Enabled')
BEGIN
    INSERT INTO dp_Page_Fields (Page_ID, Field_Name, Group_Name, View_Order, Field_Label, Required, Hidden)
    VALUES (957, 'Budgets_Enabled', '3. Budget', 1, 'Enabled', 0, 0);
    PRINT 'Added Budgets_Enabled field management.'
END
ELSE
    PRINT 'Budgets_Enabled field management already exists.'

-- 2. Budget_Status
IF NOT EXISTS (SELECT 1 FROM dp_Page_Fields WHERE Page_ID = 957 AND Field_Name = 'Budget_Status')
BEGIN
    INSERT INTO dp_Page_Fields (Page_ID, Field_Name, Group_Name, View_Order, Field_Label, Required, Hidden)
    VALUES (957, 'Budget_Status', '3. Budget', 2, NULL, 0, 0);
    PRINT 'Added Budget_Status field management.'
END
ELSE
    PRINT 'Budget_Status field management already exists.'

-- 3. Budget_Locked
IF NOT EXISTS (SELECT 1 FROM dp_Page_Fields WHERE Page_ID = 957 AND Field_Name = 'Budget_Locked')
BEGIN
    INSERT INTO dp_Page_Fields (Page_ID, Field_Name, Group_Name, View_Order, Field_Label, Required, Hidden)
    VALUES (957, 'Budget_Locked', '3. Budget', 3, NULL, 0, 0);
    PRINT 'Added Budget_Locked field management.'
END
ELSE
    PRINT 'Budget_Locked field management already exists.'

-- 4. Expected_Registration_Revenue
IF NOT EXISTS (SELECT 1 FROM dp_Page_Fields WHERE Page_ID = 957 AND Field_Name = 'Expected_Registration_Revenue')
BEGIN
    INSERT INTO dp_Page_Fields (Page_ID, Field_Name, Group_Name, View_Order, Field_Label, Required, Hidden)
    VALUES (957, 'Expected_Registration_Revenue', '3. Budget', 4, NULL, 0, 0);
    PRINT 'Added Expected_Registration_Revenue field management.'
END
ELSE
    PRINT 'Expected_Registration_Revenue field management already exists.'

-- Events Page (Page_ID = 308) - Project Group
-- Include_Registrations_In_Project_Budgets
IF NOT EXISTS (SELECT 1 FROM dp_Page_Fields WHERE Page_ID = 308 AND Field_Name = 'Include_Registrations_In_Project_Budgets')
BEGIN
    INSERT INTO dp_Page_Fields (Page_ID, Field_Name, Group_Name, View_Order, Field_Label, Required, Hidden)
    VALUES (308, 'Include_Registrations_In_Project_Budgets', 'Project', 1001, NULL, 0, 0);
    PRINT 'Added Include_Registrations_In_Project_Budgets field management.'
END
ELSE
    PRINT 'Include_Registrations_In_Project_Budgets field management already exists.'

PRINT 'Field Management configuration complete.'
GO
