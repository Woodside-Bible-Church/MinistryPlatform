-- =============================================
-- Migration: Add Public Access Support to Applications
-- =============================================
-- This migration adds fields to support unauthenticated/public access
-- for specific applications.
--
-- Usage:
-- 1. Run this script in your MinistryPlatform database
-- 2. Update applications that should allow public access
-- 3. Configure public features via Public_Features JSON field
--
-- Example Public_Features JSON:
-- {
--   "allowPublicView": true,
--   "publicActions": ["view", "submit"],
--   "authRequiredFor": ["edit", "delete", "admin"]
-- }
-- =============================================

USE [MinistryPlatform]
GO

-- Add Requires_Authentication column
IF NOT EXISTS (
    SELECT * FROM sys.columns
    WHERE object_id = OBJECT_ID(N'[dbo].[Applications]')
    AND name = 'Requires_Authentication'
)
BEGIN
    ALTER TABLE [dbo].[Applications]
    ADD [Requires_Authentication] BIT NOT NULL DEFAULT(1);

    PRINT 'Added Requires_Authentication column to Applications table';
END
ELSE
BEGIN
    PRINT 'Requires_Authentication column already exists';
END
GO

-- Add Public_Features column
IF NOT EXISTS (
    SELECT * FROM sys.columns
    WHERE object_id = OBJECT_ID(N'[dbo].[Applications]')
    AND name = 'Public_Features'
)
BEGIN
    ALTER TABLE [dbo].[Applications]
    ADD [Public_Features] NVARCHAR(MAX) NULL;

    PRINT 'Added Public_Features column to Applications table';
END
ELSE
BEGIN
    PRINT 'Public_Features column already exists';
END
GO

-- =============================================
-- Update GetUserApplications stored procedure
-- to include new fields
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[api_Custom_Platform_GetUserApplications_JSON]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[api_Custom_Platform_GetUserApplications_JSON]
GO

CREATE PROCEDURE [dbo].[api_Custom_Platform_GetUserApplications_JSON]
    @UserName NVARCHAR(75) = NULL,
    @DomainID INT = 1
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @ContactID INT;

    -- Get Contact_ID from UserName
    IF @UserName IS NOT NULL
    BEGIN
        SELECT @ContactID = Contact_ID
        FROM dp_Users
        WHERE User_Name = @UserName AND Domain_ID = @DomainID;
    END

    -- Return apps user has explicit access to
    SELECT
        a.Application_ID,
        a.Application_Name,
        a.Application_Key,
        a.Description,
        a.Icon,
        a.Route,
        a.Sort_Order,
        a.Requires_Authentication,
        a.Public_Features
    FROM
        Applications a
        INNER JOIN Application_User_Groups aug ON a.Application_ID = aug.Application_ID
        INNER JOIN dp_User_Groups ug ON aug.User_Group_ID = ug.User_Group_ID
        INNER JOIN dp_User_User_Groups ugu ON ug.User_Group_ID = ugu.User_Group_ID
        INNER JOIN dp_Users u ON ugu.User_ID = u.User_ID
    WHERE
        u.Contact_ID = @ContactID
        AND a.Is_Active = 1
        AND a.Domain_ID = @DomainID

    UNION

    -- Also return public apps (apps that don't require authentication)
    SELECT
        a.Application_ID,
        a.Application_Name,
        a.Application_Key,
        a.Description,
        a.Icon,
        a.Route,
        a.Sort_Order,
        a.Requires_Authentication,
        a.Public_Features
    FROM
        Applications a
    WHERE
        a.Is_Active = 1
        AND a.Domain_ID = @DomainID
        AND a.Requires_Authentication = 0

    ORDER BY
        Sort_Order,
        Application_Name
    FOR JSON PATH;
END
GO

PRINT 'Updated api_Custom_Platform_GetUserApplications_JSON to include public apps';
GO

-- =============================================
-- Create new stored procedure for public apps
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[api_Custom_Platform_GetPublicApplications_JSON]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[api_Custom_Platform_GetPublicApplications_JSON]
GO

CREATE PROCEDURE [dbo].[api_Custom_Platform_GetPublicApplications_JSON]
    @DomainID INT = 1
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        a.Application_ID,
        a.Application_Name,
        a.Application_Key,
        a.Description,
        a.Icon,
        a.Route,
        a.Sort_Order,
        a.Requires_Authentication,
        a.Public_Features
    FROM
        Applications a
    WHERE
        a.Is_Active = 1
        AND a.Domain_ID = @DomainID
        AND a.Requires_Authentication = 0
    ORDER BY
        a.Sort_Order,
        a.Application_Name
    FOR JSON PATH;
END
GO

PRINT 'Created api_Custom_Platform_GetPublicApplications_JSON stored procedure';
GO

-- =============================================
-- MIGRATION COMPLETE
-- =============================================
PRINT '=============================================';
PRINT 'Public Access Support Migration Complete!';
PRINT '';
PRINT 'Next steps:';
PRINT '1. Register new stored procedure api_Custom_Platform_GetPublicApplications_JSON in dp_API_Procedures';
PRINT '2. To make an app public, run:';
PRINT '   UPDATE Applications SET Requires_Authentication = 0 WHERE Application_Key = ''your-app-key''';
PRINT '3. Optionally set Public_Features JSON to configure public functionality';
PRINT '4. Update middleware and app components to check Requires_Authentication flag';
PRINT '=============================================';
GO
