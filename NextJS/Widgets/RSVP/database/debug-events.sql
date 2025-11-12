-- ===================================================================
-- Debug: Check why events aren't showing in RSVP
-- ===================================================================

USE [MinistryPlatform]
GO

DECLARE @ProjectID INT = 4;
DECLARE @ProjectRSVPID INT = 1;

PRINT '===================================================================';
PRINT 'Checking Project_Events linkage...';
PRINT '===================================================================';

-- Check how many events are linked to the project
SELECT
    COUNT(*) AS Total_Linked_Events,
    SUM(CASE WHEN Include_In_RSVP = 1 THEN 1 ELSE 0 END) AS Events_With_RSVP_Enabled
FROM Project_Events
WHERE Project_ID = @ProjectID;

-- Check the actual events with details
SELECT
    pe.Project_ID,
    pe.Event_ID,
    e.Event_Title,
    e.Event_Start_Date,
    e.Event_End_Date,
    pe.Include_In_RSVP,
    pe.RSVP_Capacity_Modifier,
    CASE
        WHEN e.Event_Start_Date >= DATEADD(DAY, -1, GETDATE()) THEN 'Will show in RSVP'
        ELSE 'FILTERED OUT - Event too old'
    END AS Status
FROM Project_Events pe
INNER JOIN Events e ON pe.Event_ID = e.Event_ID
WHERE pe.Project_ID = @ProjectID
ORDER BY e.Event_Start_Date;

PRINT '';
PRINT 'Current date/time: ' + CONVERT(NVARCHAR, GETDATE(), 120);
PRINT 'Events must have Event_Start_Date >= ' + CONVERT(NVARCHAR, DATEADD(DAY, -1, GETDATE()), 120);
GO
