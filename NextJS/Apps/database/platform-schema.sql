-- =============================================
-- Ministry Applications Platform - Database Schema
-- =============================================
-- This script creates the platform-level tables and stored procedures
-- for managing application access and common functionality.
--
-- INSTALLATION INSTRUCTIONS:
-- 1. Run this script in your MinistryPlatform database
-- 2. Grant appropriate permissions to API user
-- 3. Register API procedures in dp_API_Procedures table
-- =============================================

USE [MinistryPlatform]
GO

-- =============================================
-- SECTION 1: PLATFORM TABLES
-- =============================================

-- Applications table - defines all available apps
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Applications]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Applications](
        [Application_ID] [int] IDENTITY(1,1) NOT NULL,
        [Application_Name] [nvarchar](50) NOT NULL,
        [Application_Key] [nvarchar](50) NOT NULL, -- URL-friendly key (e.g., 'counter', 'groups')
        [Description] [nvarchar](500) NULL,
        [Icon] [nvarchar](50) NULL, -- Icon name for UI
        [Route] [nvarchar](100) NOT NULL, -- URL route (e.g., '/counter')
        [Is_Active] [bit] NOT NULL DEFAULT(1),
        [Sort_Order] [int] NOT NULL DEFAULT(0),
        [Domain_ID] [int] NOT NULL DEFAULT(1),
        CONSTRAINT [PK_Applications] PRIMARY KEY CLUSTERED ([Application_ID] ASC),
        CONSTRAINT [UQ_Applications_Key] UNIQUE ([Application_Key]),
        CONSTRAINT [FK_Applications_Domain] FOREIGN KEY([Domain_ID])
            REFERENCES [dbo].[dp_Domains] ([Domain_ID])
    );

    -- Insert default applications
    INSERT INTO [dbo].[Applications]
        ([Application_Name], [Application_Key], [Description], [Icon], [Route], [Sort_Order])
    VALUES
        ('Counter', 'counter', 'Track event metrics, head counts, and attendance', 'Activity', '/counter', 1);

    PRINT 'Applications table created successfully';
END
ELSE
BEGIN
    PRINT 'Applications table already exists';
END
GO

-- Application_User_Groups table - maps which User_Groups have access to which Applications
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Application_User_Groups]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Application_User_Groups](
        [Application_User_Group_ID] [int] IDENTITY(1,1) NOT NULL,
        [Application_ID] [int] NOT NULL,
        [User_Group_ID] [int] NOT NULL,
        [Domain_ID] [int] NOT NULL DEFAULT(1),
        CONSTRAINT [PK_Application_User_Groups] PRIMARY KEY CLUSTERED ([Application_User_Group_ID] ASC),
        CONSTRAINT [FK_Application_User_Groups_Applications] FOREIGN KEY([Application_ID])
            REFERENCES [dbo].[Applications] ([Application_ID]),
        CONSTRAINT [FK_Application_User_Groups_User_Groups] FOREIGN KEY([User_Group_ID])
            REFERENCES [dbo].[dp_User_Groups] ([User_Group_ID]),
        CONSTRAINT [FK_Application_User_Groups_Domain] FOREIGN KEY([Domain_ID])
            REFERENCES [dbo].[dp_Domains] ([Domain_ID]),
        CONSTRAINT [UQ_Application_User_Groups] UNIQUE ([Application_ID], [User_Group_ID])
    );

    PRINT 'Application_User_Groups table created successfully';
END
ELSE
BEGIN
    PRINT 'Application_User_Groups table already exists';
END
GO

-- =============================================
-- SECTION 2: PLATFORM STORED PROCEDURES
-- =============================================

-- =============================================
-- Stored Procedure: api_Custom_Platform_GetUserApplications_JSON
-- Description: Get all applications a user has access to
-- Parameters: @UserName, @DomainID
-- Returns: Nested JSON array of applications
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

    SELECT
        a.Application_ID,
        a.Application_Name,
        a.Application_Key,
        a.Description,
        a.Icon,
        a.Route,
        a.Sort_Order
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
    ORDER BY
        a.Sort_Order,
        a.Application_Name
    FOR JSON PATH;
END
GO

PRINT 'Stored procedure api_Custom_Platform_GetUserApplications_JSON created successfully';
GO

-- =============================================
-- Stored Procedure: api_Custom_Platform_CheckUserAccess_JSON
-- Description: Check if a user has access to a specific application
-- Parameters: @UserName, @DomainID, @ApplicationKey
-- Returns: JSON object with access status
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[api_Custom_Platform_CheckUserAccess_JSON]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[api_Custom_Platform_CheckUserAccess_JSON]
GO

CREATE PROCEDURE [dbo].[api_Custom_Platform_CheckUserAccess_JSON]
    @UserName NVARCHAR(75) = NULL,
    @DomainID INT = 1,
    @ApplicationKey NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @HasAccess BIT = 0;
    DECLARE @ContactID INT;

    -- Get Contact_ID from UserName
    IF @UserName IS NOT NULL
    BEGIN
        SELECT @ContactID = Contact_ID
        FROM dp_Users
        WHERE User_Name = @UserName AND Domain_ID = @DomainID;
    END

    SELECT @HasAccess = 1
    FROM
        Applications a
        INNER JOIN Application_User_Groups aug ON a.Application_ID = aug.Application_ID
        INNER JOIN dp_User_Groups ug ON aug.User_Group_ID = ug.User_Group_ID
        INNER JOIN dp_User_User_Groups ugu ON ug.User_Group_ID = ugu.User_Group_ID
        INNER JOIN dp_Users u ON ugu.User_ID = u.User_ID
    WHERE
        u.Contact_ID = @ContactID
        AND a.Application_Key = @ApplicationKey
        AND a.Is_Active = 1
        AND a.Domain_ID = @DomainID;

    SELECT @HasAccess AS Has_Access FOR JSON PATH, WITHOUT_ARRAY_WRAPPER;
END
GO

PRINT 'Stored procedure api_Custom_Platform_CheckUserAccess_JSON created successfully';
GO

-- =============================================
-- SECTION 3: COUNTER APP STORED PROCEDURES
-- =============================================
-- Note: Assumes Event_Metrics and Metrics tables already exist

-- =============================================
-- Stored Procedure: api_Custom_Counter_GetActiveCongregations_JSON
-- Description: Get all active congregations/campuses for the counter
-- Parameters: @UserName, @DomainID
-- Returns: Nested JSON array of active congregations
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[api_Custom_Counter_GetActiveCongregations_JSON]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[api_Custom_Counter_GetActiveCongregations_JSON]
GO

CREATE PROCEDURE [dbo].[api_Custom_Counter_GetActiveCongregations_JSON]
    @UserName NVARCHAR(75) = NULL,
    @DomainID INT = 1
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Today DATE = CAST(GETDATE() AS DATE);

    SELECT
        c.Congregation_ID,
        c.Congregation_Name,
        c.Start_Date,
        c.End_Date,
        c.Available_Online
    FROM
        Congregations c
    WHERE
        c.Start_Date <= @Today
        AND (c.End_Date IS NULL OR c.End_Date >= @Today)
        AND c.Available_Online = 1
    ORDER BY
        c.Congregation_Name
    FOR JSON PATH;
END
GO

PRINT 'Stored procedure api_Custom_Counter_GetActiveCongregations_JSON created successfully';
GO

-- =============================================
-- Stored Procedure: api_Custom_Counter_GetEventsByDate_JSON
-- Description: Get events for a specific date and congregation with existing metrics
-- Parameters: @UserName, @DomainID, @EventDate, @CongregationID
-- Returns: Nested JSON array of events with metrics
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[api_Custom_Counter_GetEventsByDate_JSON]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[api_Custom_Counter_GetEventsByDate_JSON]
GO

CREATE PROCEDURE [dbo].[api_Custom_Counter_GetEventsByDate_JSON]
    @UserName NVARCHAR(75) = NULL,
    @DomainID INT = 1,
    @EventDate DATE,
    @CongregationID INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        e.Event_ID,
        e.Event_Title,
        e.Event_Start_Date,
        e.Event_End_Date,
        e.Congregation_ID,
        e.Event_Type_ID,
        et.Event_Type,
        -- Nested metrics array
        (
            SELECT
                em.Event_Metric_ID,
                em.Metric_ID,
                m.Metric_Title,
                m.Is_Headcount,
                em.Numerical_Value,
                em.Group_ID
            FROM
                Event_Metrics em
                INNER JOIN Metrics m ON em.Metric_ID = m.Metric_ID
            WHERE
                em.Event_ID = e.Event_ID
            ORDER BY
                CASE WHEN m.Is_Headcount = 1 THEN 0 ELSE 1 END,
                m.Metric_Title
            FOR JSON PATH
        ) AS Metrics
    FROM
        Events e
        INNER JOIN Event_Types et ON e.Event_Type_ID = et.Event_Type_ID
    WHERE
        CAST(e.Event_Start_Date AS DATE) = @EventDate
        AND e.Congregation_ID = @CongregationID
    ORDER BY
        e.Event_Start_Date
    FOR JSON PATH;
END
GO

PRINT 'Stored procedure api_Custom_Counter_GetEventsByDate_JSON created successfully';
GO

-- =============================================
-- Stored Procedure: api_Custom_Counter_GetMetrics_JSON
-- Description: Get all available metrics for tracking
-- Parameters: @UserName, @DomainID
-- Returns: Nested JSON array of metrics
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[api_Custom_Counter_GetMetrics_JSON]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[api_Custom_Counter_GetMetrics_JSON]
GO

CREATE PROCEDURE [dbo].[api_Custom_Counter_GetMetrics_JSON]
    @UserName NVARCHAR(75) = NULL,
    @DomainID INT = 1
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        Metric_ID,
        Metric_Title,
        Is_Headcount
    FROM
        Metrics
    ORDER BY
        CASE WHEN Is_Headcount = 1 THEN 0 ELSE 1 END,
        Metric_Title
    FOR JSON PATH;
END
GO

PRINT 'Stored procedure api_Custom_Counter_GetMetrics_JSON created successfully';
GO

-- =============================================
-- Stored Procedure: api_Custom_Counter_GetEventMetrics_JSON
-- Description: Get all metrics for a specific event
-- Parameters: @UserName, @DomainID, @EventID
-- Returns: Nested JSON array of event metrics with metric details
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[api_Custom_Counter_GetEventMetrics_JSON]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[api_Custom_Counter_GetEventMetrics_JSON]
GO

CREATE PROCEDURE [dbo].[api_Custom_Counter_GetEventMetrics_JSON]
    @UserName NVARCHAR(75) = NULL,
    @DomainID INT = 1,
    @EventID INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        em.Event_Metric_ID,
        em.Event_ID,
        em.Metric_ID,
        m.Metric_Title,
        m.Is_Headcount,
        em.Numerical_Value,
        em.Group_ID,
        g.Group_Name
    FROM
        Event_Metrics em
        INNER JOIN Metrics m ON em.Metric_ID = m.Metric_ID
        LEFT JOIN Groups g ON em.Group_ID = g.Group_ID
    WHERE
        em.Event_ID = @EventID
    ORDER BY
        CASE WHEN m.Is_Headcount = 1 THEN 0 ELSE 1 END,
        m.Metric_Title
    FOR JSON PATH;
END
GO

PRINT 'Stored procedure api_Custom_Counter_GetEventMetrics_JSON created successfully';
GO

-- =============================================
-- SETUP COMPLETE
-- =============================================
PRINT '=============================================';
PRINT 'Ministry Applications Platform setup complete!';
PRINT '';
PRINT 'Next steps:';
PRINT '1. Register stored procedures in MP Admin → System Setup → API Procedures';
PRINT '2. Create pages in MP Admin for Applications and Application_User_Groups tables';
PRINT '3. Assign security role access to the pages and API procedures';
PRINT '4. Create User Groups for each application (e.g., "Counter App Users")';
PRINT '5. Link User Groups to Applications via Application_User_Groups table';
PRINT '6. Add users to User Groups via dp_User_User_Groups';
PRINT '7. Grant EXECUTE permissions to your API user';
PRINT '=============================================';
GO
