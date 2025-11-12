-- ===================================================================
-- Link Events to Christmas Services 2024 Project
-- ===================================================================
-- Links all Christmas service events to the RSVP project
-- Project ID: 4
-- Project_RSVP ID: 1
-- ===================================================================

USE [MinistryPlatform]
GO

DECLARE @ProjectID INT = 4;  -- Christmas Services 2024

-- List of Event IDs from screenshot
DECLARE @EventIDs TABLE (Event_ID INT);

INSERT INTO @EventIDs (Event_ID) VALUES
(305244),
(307675),
(307762),
(307952),
(307953),
(307954),
(307955),
(307956),
(307957),
(307958),
(307959),
(307960),
(307961),
(307962),
(307963),
(307964),
(307965),
(308015);

-- ===================================================================
-- Link events to project with RSVP enabled
-- ===================================================================
INSERT INTO Project_Events (
    Project_ID,
    Event_ID,
    Include_In_RSVP,
    RSVP_Capacity_Modifier,
    Domain_ID
)
SELECT
    @ProjectID,
    e.Event_ID,
    1,  -- Include in RSVP
    0,  -- No capacity modifier (show actual count)
    1   -- Domain_ID
FROM @EventIDs e
WHERE NOT EXISTS (
    SELECT 1
    FROM Project_Events pe
    WHERE pe.Project_ID = @ProjectID
    AND pe.Event_ID = e.Event_ID
);

-- ===================================================================
-- Summary
-- ===================================================================
DECLARE @LinkedCount INT;
SELECT @LinkedCount = COUNT(*)
FROM Project_Events
WHERE Project_ID = @ProjectID;

PRINT '';
PRINT '===================================================================';
PRINT 'Successfully linked events to Christmas Services 2024 project!';
PRINT '';
PRINT 'Project ID: ' + CAST(@ProjectID AS NVARCHAR);
PRINT 'Total events linked: ' + CAST(@LinkedCount AS NVARCHAR);
PRINT '';
PRINT 'Next steps:';
PRINT '  1. Test the RSVP widget at http://localhost:3003/api/rsvp/project?projectRsvpId=1';
PRINT '  2. Events should now appear in the Events array';
PRINT '  3. Begin building the dynamic UI components';
PRINT '===================================================================';
GO
