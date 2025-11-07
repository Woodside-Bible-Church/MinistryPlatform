-- ============================================================================
-- RSVP Widget Database Schema
-- ============================================================================
-- This schema supports event RSVP functionality for multi-campus events
-- (Christmas, Easter, etc.)
--
-- Features:
-- - Track RSVPs for events across 14 campuses
-- - Capacity management per event
-- - Event series grouping (link related events together)
-- - Guest RSVP support (no authentication required)
-- - Party size tracking
-- - New visitor identification
--
-- MinistryPlatform Integration:
-- - Uses existing Events, Contacts, and Congregations tables
-- - Extends MP with RSVP tracking capabilities
-- - Custom stored procedures return JSON for widget consumption
-- ============================================================================

-- ============================================================================
-- TABLE: Event_RSVPs
-- ============================================================================
-- Stores individual RSVPs for events across all campuses
-- Supports both authenticated contacts and guest submissions

CREATE TABLE [dbo].[Event_RSVPs] (
    [Event_RSVP_ID] INT IDENTITY(1,1) NOT NULL,
    [Event_ID] INT NOT NULL,                          -- FK → Events.Event_ID
    [Contact_ID] INT NULL,                            -- FK → Contacts.Contact_ID (nullable for guests)

    -- Personal Information (collected from form)
    [First_Name] NVARCHAR(50) NOT NULL,
    [Last_Name] NVARCHAR(50) NOT NULL,
    [Email_Address] NVARCHAR(255) NOT NULL,
    [Phone_Number] NVARCHAR(20) NULL,

    -- RSVP Details
    [Party_Size] INT NOT NULL DEFAULT 1,              -- Total attendees including submitter
    [Is_New_Visitor] BIT NOT NULL DEFAULT 0,          -- First time visitor checkbox

    -- Metadata
    [RSVP_Date] DATETIME NOT NULL DEFAULT GETDATE(),
    [Domain_ID] INT NOT NULL DEFAULT 1,

    -- Primary Key
    CONSTRAINT [PK_Event_RSVPs] PRIMARY KEY CLUSTERED ([Event_RSVP_ID] ASC),

    -- Foreign Keys
    CONSTRAINT [FK_Event_RSVPs_Event_ID] FOREIGN KEY ([Event_ID])
        REFERENCES [dbo].[Events] ([Event_ID]),
    CONSTRAINT [FK_Event_RSVPs_Contact_ID] FOREIGN KEY ([Contact_ID])
        REFERENCES [dbo].[Contacts] ([Contact_ID]),
    CONSTRAINT [FK_Event_RSVPs_Domain] FOREIGN KEY ([Domain_ID])
        REFERENCES [dbo].[dp_Domains] ([Domain_ID])
);

-- Indexes for performance
CREATE NONCLUSTERED INDEX [IX_Event_RSVPs_Event_ID]
    ON [dbo].[Event_RSVPs] ([Event_ID]);

CREATE NONCLUSTERED INDEX [IX_Event_RSVPs_Contact_ID]
    ON [dbo].[Event_RSVPs] ([Contact_ID]);

CREATE NONCLUSTERED INDEX [IX_Event_RSVPs_Email_Address]
    ON [dbo].[Event_RSVPs] ([Email_Address]);

GO

-- ============================================================================
-- TABLE: Event_Capacity
-- ============================================================================
-- Stores capacity limits for events (set by staff)
-- Allows different capacity per event/campus

CREATE TABLE [dbo].[Event_Capacity] (
    [Event_Capacity_ID] INT IDENTITY(1,1) NOT NULL,
    [Event_ID] INT NOT NULL,                          -- FK → Events.Event_ID
    [Max_Capacity] INT NOT NULL,                      -- Total seats available
    [Domain_ID] INT NOT NULL DEFAULT 1,

    -- Primary Key
    CONSTRAINT [PK_Event_Capacity] PRIMARY KEY CLUSTERED ([Event_Capacity_ID] ASC),

    -- Foreign Keys
    CONSTRAINT [FK_Event_Capacity_Event_ID] FOREIGN KEY ([Event_ID])
        REFERENCES [dbo].[Events] ([Event_ID]),
    CONSTRAINT [FK_Event_Capacity_Domain] FOREIGN KEY ([Domain_ID])
        REFERENCES [dbo].[dp_Domains] ([Domain_ID]),

    -- Ensure only one capacity record per event
    CONSTRAINT [UQ_Event_Capacity_Event_ID] UNIQUE ([Event_ID])
);

-- Indexes
CREATE NONCLUSTERED INDEX [IX_Event_Capacity_Event_ID]
    ON [dbo].[Event_Capacity] ([Event_ID]);

GO

-- ============================================================================
-- TABLE: Event_Series
-- ============================================================================
-- Groups related events together (e.g., all Christmas 2024 services across campuses)
-- Allows widget to show all related service times at once

CREATE TABLE [dbo].[Event_Series] (
    [Event_Series_ID] INT IDENTITY(1,1) NOT NULL,
    [Series_Name] NVARCHAR(100) NOT NULL,             -- e.g., "Christmas 2024", "Easter 2025"
    [Series_Description] NVARCHAR(500) NULL,
    [Start_Date] DATE NOT NULL,                       -- First event in series
    [End_Date] DATE NOT NULL,                         -- Last event in series
    [Is_Active] BIT NOT NULL DEFAULT 1,               -- Enable/disable series
    [Domain_ID] INT NOT NULL DEFAULT 1,

    -- Primary Key
    CONSTRAINT [PK_Event_Series] PRIMARY KEY CLUSTERED ([Event_Series_ID] ASC),

    -- Foreign Keys
    CONSTRAINT [FK_Event_Series_Domain] FOREIGN KEY ([Domain_ID])
        REFERENCES [dbo].[dp_Domains] ([Domain_ID])
);

GO

-- ============================================================================
-- TABLE: Event_Series_Events (Junction Table)
-- ============================================================================
-- Links events to series (many-to-one relationship)

CREATE TABLE [dbo].[Event_Series_Events] (
    [Event_Series_Event_ID] INT IDENTITY(1,1) NOT NULL,
    [Event_Series_ID] INT NOT NULL,                   -- FK → Event_Series.Event_Series_ID
    [Event_ID] INT NOT NULL,                          -- FK → Events.Event_ID
    [Display_Order] INT NULL,                         -- Sort order for display

    -- Primary Key
    CONSTRAINT [PK_Event_Series_Events] PRIMARY KEY CLUSTERED ([Event_Series_Event_ID] ASC),

    -- Foreign Keys
    CONSTRAINT [FK_Event_Series_Events_Series_ID] FOREIGN KEY ([Event_Series_ID])
        REFERENCES [dbo].[Event_Series] ([Event_Series_ID]),
    CONSTRAINT [FK_Event_Series_Events_Event_ID] FOREIGN KEY ([Event_ID])
        REFERENCES [dbo].[Events] ([Event_ID]),

    -- Ensure event isn't added to series twice
    CONSTRAINT [UQ_Event_Series_Events] UNIQUE ([Event_Series_ID], [Event_ID])
);

-- Indexes
CREATE NONCLUSTERED INDEX [IX_Event_Series_Events_Series_ID]
    ON [dbo].[Event_Series_Events] ([Event_Series_ID]);

CREATE NONCLUSTERED INDEX [IX_Event_Series_Events_Event_ID]
    ON [dbo].[Event_Series_Events] ([Event_ID]);

GO

-- ============================================================================
-- STORED PROCEDURE: api_Custom_RSVP_Event_Series_JSON
-- ============================================================================
-- Returns all events in a series with RSVP counts and capacity
-- Used by widget to display service times and availability
--
-- Parameters:
--   @SeriesID - Filter to specific series (or NULL for all active series)
--   @CongregationID - Filter to specific campus (or NULL for all campuses)
--
-- Returns: JSON array of events with capacity and RSVP statistics

IF OBJECT_ID('[dbo].[api_Custom_RSVP_Event_Series_JSON]', 'P') IS NOT NULL
    DROP PROCEDURE [dbo].[api_Custom_RSVP_Event_Series_JSON];
GO

CREATE PROCEDURE [dbo].[api_Custom_RSVP_Event_Series_JSON]
    @SeriesID INT = NULL,
    @CongregationID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- Get events with RSVP statistics
    SELECT
        e.Event_ID,
        e.Event_Title,
        e.Event_Start_Date,
        e.Event_End_Date,
        c.Congregation_Name AS Campus_Name,
        c.Congregation_ID,

        -- Capacity information
        ISNULL(ec.Max_Capacity, 0) AS Max_Capacity,

        -- RSVP statistics
        COUNT(DISTINCT er.Event_RSVP_ID) AS Total_RSVPs,
        ISNULL(SUM(er.Party_Size), 0) AS Total_Attendees,

        -- Calculated fields
        CASE
            WHEN ec.Max_Capacity IS NULL THEN 0
            WHEN ec.Max_Capacity = 0 THEN 0
            ELSE CAST(ISNULL(SUM(er.Party_Size), 0) AS FLOAT) / ec.Max_Capacity * 100
        END AS Capacity_Percentage,

        CASE
            WHEN ec.Max_Capacity IS NULL THEN 1
            WHEN ec.Max_Capacity = 0 THEN 1
            WHEN ISNULL(SUM(er.Party_Size), 0) >= ec.Max_Capacity THEN 0
            ELSE 1
        END AS Is_Available

    FROM Events e
    INNER JOIN Event_Series_Events ese ON e.Event_ID = ese.Event_ID
    LEFT JOIN Congregations c ON e.Congregation_ID = c.Congregation_ID
    LEFT JOIN Event_Capacity ec ON e.Event_ID = ec.Event_ID
    LEFT JOIN Event_RSVPs er ON e.Event_ID = er.Event_ID

    WHERE
        (@SeriesID IS NULL OR ese.Event_Series_ID = @SeriesID)
        AND (@CongregationID IS NULL OR e.Congregation_ID = @CongregationID)
        AND e.Event_Start_Date >= GETDATE()  -- Only future events

    GROUP BY
        e.Event_ID,
        e.Event_Title,
        e.Event_Start_Date,
        e.Event_End_Date,
        c.Congregation_Name,
        c.Congregation_ID,
        ec.Max_Capacity,
        ese.Display_Order

    ORDER BY
        c.Congregation_Name,
        e.Event_Start_Date;

    -- Note: Do NOT use FOR JSON PATH when calling via MinistryPlatform /procs/ API
    -- MinistryPlatform automatically converts the result to JSON
END;
GO

-- ============================================================================
-- STORED PROCEDURE: api_Custom_RSVP_Submit_JSON
-- ============================================================================
-- Creates new RSVP and returns confirmation data
--
-- Parameters:
--   @EventID - Event to RSVP for
--   @ContactID - MinistryPlatform contact (NULL for guests)
--   @FirstName, @LastName, @EmailAddress, @PhoneNumber - Contact details
--   @PartySize - Number of attendees
--   @IsNewVisitor - First time visitor flag
--
-- Returns: JSON object with RSVP confirmation and event details

IF OBJECT_ID('[dbo].[api_Custom_RSVP_Submit_JSON]', 'P') IS NOT NULL
    DROP PROCEDURE [dbo].[api_Custom_RSVP_Submit_JSON];
GO

CREATE PROCEDURE [dbo].[api_Custom_RSVP_Submit_JSON]
    @EventID INT,
    @ContactID INT = NULL,
    @FirstName NVARCHAR(50),
    @LastName NVARCHAR(50),
    @EmailAddress NVARCHAR(255),
    @PhoneNumber NVARCHAR(20) = NULL,
    @PartySize INT = 1,
    @IsNewVisitor BIT = 0
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @NewRSVPID INT;

    -- Insert RSVP
    INSERT INTO Event_RSVPs (
        Event_ID,
        Contact_ID,
        First_Name,
        Last_Name,
        Email_Address,
        Phone_Number,
        Party_Size,
        Is_New_Visitor,
        RSVP_Date
    )
    VALUES (
        @EventID,
        @ContactID,
        @FirstName,
        @LastName,
        @EmailAddress,
        @PhoneNumber,
        @PartySize,
        @IsNewVisitor,
        GETDATE()
    );

    SET @NewRSVPID = SCOPE_IDENTITY();

    -- Return confirmation data
    SELECT
        er.Event_RSVP_ID,
        er.Event_ID,
        er.First_Name,
        er.Last_Name,
        er.Email_Address,
        er.Party_Size,
        e.Event_Title,
        e.Event_Start_Date,
        e.Event_End_Date,
        c.Congregation_Name AS Campus_Name,
        c.Address_Line_1 AS Campus_Address_Line_1,
        c.Address_Line_2 AS Campus_Address_Line_2,
        c.City AS Campus_City,
        c.[State/Region] AS Campus_State,
        c.Postal_Code AS Campus_Postal_Code
    FROM Event_RSVPs er
    INNER JOIN Events e ON er.Event_ID = e.Event_ID
    LEFT JOIN Congregations c ON e.Congregation_ID = c.Congregation_ID
    WHERE er.Event_RSVP_ID = @NewRSVPID;
END;
GO

-- ============================================================================
-- STORED PROCEDURE: api_Custom_RSVP_Active_Series_JSON
-- ============================================================================
-- Returns all active event series (for admin/widget configuration)
--
-- Returns: JSON array of active series with event counts

IF OBJECT_ID('[dbo].[api_Custom_RSVP_Active_Series_JSON]', 'P') IS NOT NULL
    DROP PROCEDURE [dbo].[api_Custom_RSVP_Active_Series_JSON];
GO

CREATE PROCEDURE [dbo].[api_Custom_RSVP_Active_Series_JSON]
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        Event_Series_ID,
        Series_Name,
        Series_Description,
        Start_Date,
        End_Date,
        (SELECT COUNT(*) FROM Event_Series_Events ese WHERE ese.Event_Series_ID = es.Event_Series_ID) AS Event_Count
    FROM Event_Series es
    WHERE Is_Active = 1
    AND End_Date >= CAST(GETDATE() AS DATE)
    ORDER BY Start_Date DESC;
END;
GO

-- ============================================================================
-- STORED PROCEDURE: api_Custom_RSVP_My_RSVPs_JSON
-- ============================================================================
-- Returns RSVPs for a specific contact (for "My RSVPs" page)
--
-- Parameters:
--   @ContactID - Contact to retrieve RSVPs for
--
-- Returns: JSON array of RSVPs with event details

IF OBJECT_ID('[dbo].[api_Custom_RSVP_My_RSVPs_JSON]', 'P') IS NOT NULL
    DROP PROCEDURE [dbo].[api_Custom_RSVP_My_RSVPs_JSON];
GO

CREATE PROCEDURE [dbo].[api_Custom_RSVP_My_RSVPs_JSON]
    @ContactID INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        er.Event_RSVP_ID,
        er.Event_ID,
        er.Party_Size,
        er.Is_New_Visitor,
        er.RSVP_Date,
        e.Event_Title,
        e.Event_Start_Date,
        e.Event_End_Date,
        c.Congregation_Name AS Campus_Name
    FROM Event_RSVPs er
    INNER JOIN Events e ON er.Event_ID = e.Event_ID
    LEFT JOIN Congregations c ON e.Congregation_ID = c.Congregation_ID
    WHERE er.Contact_ID = @ContactID
    ORDER BY e.Event_Start_Date DESC;
END;
GO

-- ============================================================================
-- SAMPLE DATA (for testing)
-- ============================================================================

-- Insert Event Series
INSERT INTO Event_Series (Series_Name, Series_Description, Start_Date, End_Date, Is_Active)
VALUES ('Christmas 2024', 'Christmas and Christmas Eve services across all campuses', '2024-12-24', '2024-12-25', 1);

-- Note: Actual events would be created in MinistryPlatform UI and linked via Event_Series_Events
-- This is just an example of how to link events to a series:
--
-- DECLARE @SeriesID INT = (SELECT Event_Series_ID FROM Event_Series WHERE Series_Name = 'Christmas 2024');
-- INSERT INTO Event_Series_Events (Event_Series_ID, Event_ID, Display_Order)
-- VALUES (@SeriesID, <Event_ID>, 1);
--
-- INSERT INTO Event_Capacity (Event_ID, Max_Capacity)
-- VALUES (<Event_ID>, 500);

-- ============================================================================
-- PERMISSIONS
-- ============================================================================
-- Grant permissions to MinistryPlatform API user
-- Adjust role names based on your MP configuration

-- GRANT SELECT, INSERT ON Event_RSVPs TO [MP_API_User];
-- GRANT SELECT ON Event_Capacity TO [MP_API_User];
-- GRANT SELECT ON Event_Series TO [MP_API_User];
-- GRANT SELECT ON Event_Series_Events TO [MP_API_User];
-- GRANT EXECUTE ON api_Custom_RSVP_Event_Series_JSON TO [MP_API_User];
-- GRANT EXECUTE ON api_Custom_RSVP_Submit_JSON TO [MP_API_User];
-- GRANT EXECUTE ON api_Custom_RSVP_Active_Series_JSON TO [MP_API_User];
-- GRANT EXECUTE ON api_Custom_RSVP_My_RSVPs_JSON TO [MP_API_User];

-- ============================================================================
-- USAGE NOTES
-- ============================================================================
--
-- Calling Stored Procedures from Next.js:
--
-- 1. Get Events for a Series (Christmas services at Lake Orion):
--    GET /ministryplatformapi/procs/api_Custom_RSVP_Event_Series_JSON?@SeriesID=1&@CongregationID=5
--
-- 2. Submit RSVP:
--    POST /ministryplatformapi/procs/api_Custom_RSVP_Submit_JSON
--    Body: {
--      @EventID: 123,
--      @ContactID: 456,  // or null for guests
--      @FirstName: "John",
--      @LastName: "Doe",
--      @EmailAddress: "john@example.com",
--      @PhoneNumber: "810-555-1234",
--      @PartySize: 4,
--      @IsNewVisitor: 1
--    }
--
-- 3. Get My RSVPs:
--    GET /ministryplatformapi/procs/api_Custom_RSVP_My_RSVPs_JSON?@ContactID=456
--
-- 4. Get Active Series:
--    GET /ministryplatformapi/procs/api_Custom_RSVP_Active_Series_JSON
--
-- ============================================================================
