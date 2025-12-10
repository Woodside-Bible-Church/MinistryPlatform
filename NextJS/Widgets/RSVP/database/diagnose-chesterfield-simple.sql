-- ===================================================================
-- Diagnostic Query: Chesterfield RSVP Issue - Simple Version
-- ===================================================================
USE [MinistryPlatform]
GO

-- Find Congregation IDs
DECLARE @Chesterfield_ID INT, @Algonac_ID INT;

SELECT @Chesterfield_ID = Congregation_ID
FROM Congregations
WHERE Congregation_Name LIKE '%Chesterfield%';

SELECT @Algonac_ID = Congregation_ID
FROM Congregations
WHERE Congregation_Name LIKE '%Algonac%';

PRINT 'Chesterfield Congregation_ID: ' + CAST(@Chesterfield_ID AS VARCHAR);
PRINT 'Algonac Congregation_ID: ' + CAST(@Algonac_ID AS VARCHAR);
PRINT '';

-- Get all events for active RSVP projects with RSVP counts
SELECT
    e.Event_ID,
    e.Event_Title,
    FORMAT(e.Event_Start_Date, 'ddd - MMM dd, h:mm tt') AS Event_Time,
    c.Congregation_Name AS Campus,
    e.RSVP_Capacity,
    e.RSVP_Capacity_Modifier,
    e.Include_In_RSVP,
    -- Count RSVPs (Participation_Status_ID = 2)
    (SELECT COUNT(*)
     FROM Event_Participants ep
     WHERE ep.Event_ID = e.Event_ID
     AND ep.Participation_Status_ID = 2) AS RSVP_Count,
    -- Calculate capacity percentage
    CASE
        WHEN e.RSVP_Capacity IS NULL THEN 0
        WHEN e.RSVP_Capacity = 0 THEN 0
        ELSE CAST(
            ((SELECT COUNT(*) FROM Event_Participants ep
              WHERE ep.Event_ID = e.Event_ID
              AND ep.Participation_Status_ID = 2) + ISNULL(e.RSVP_Capacity_Modifier, 0)) * 100.0
            / e.RSVP_Capacity AS INT
        )
    END AS Capacity_Percentage
FROM Events e
INNER JOIN Projects p ON e.Project_ID = p.Project_ID
LEFT JOIN Congregations c ON e.Congregation_ID = c.Congregation_ID
WHERE p.RSVP_Is_Active = 1
  AND e.Include_In_RSVP = 1
  AND (e.Congregation_ID = @Chesterfield_ID OR e.Congregation_ID = @Algonac_ID)
ORDER BY c.Congregation_Name, e.Event_Start_Date;

-- Show individual participants for Chesterfield
PRINT '';
PRINT '===================================================================';
PRINT 'Chesterfield Participants:';
PRINT '===================================================================';

SELECT
    ep.Event_Participant_ID,
    e.Event_ID,
    FORMAT(e.Event_Start_Date, 'ddd - MMM dd, h:mm tt') AS Event_Time,
    c.First_Name + ' ' + c.Last_Name AS Participant_Name,
    ep.Participation_Status_ID,
    ps.Participation_Status,
    ep.RSVP_Party_Size,
    FORMAT(ep._Setup_Date, 'yyyy-MM-dd HH:mm:ss') AS Created_Date
FROM Event_Participants ep
INNER JOIN Events e ON ep.Event_ID = e.Event_ID
INNER JOIN Projects p ON e.Project_ID = p.Project_ID
LEFT JOIN Contacts c ON ep.Participant_ID = c.Contact_ID
LEFT JOIN Participation_Statuses ps ON ep.Participation_Status_ID = ps.Participation_Status_ID
WHERE p.RSVP_Is_Active = 1
  AND e.Include_In_RSVP = 1
  AND e.Congregation_ID = @Chesterfield_ID
ORDER BY e.Event_Start_Date, ep._Setup_Date DESC;

-- Show individual participants for Algonac
PRINT '';
PRINT '===================================================================';
PRINT 'Algonac Participants:';
PRINT '===================================================================';

SELECT
    ep.Event_Participant_ID,
    e.Event_ID,
    FORMAT(e.Event_Start_Date, 'ddd - MMM dd, h:mm tt') AS Event_Time,
    c.First_Name + ' ' + c.Last_Name AS Participant_Name,
    ep.Participation_Status_ID,
    ps.Participation_Status,
    ep.RSVP_Party_Size,
    FORMAT(ep._Setup_Date, 'yyyy-MM-dd HH:mm:ss') AS Created_Date
FROM Event_Participants ep
INNER JOIN Events e ON ep.Event_ID = e.Event_ID
INNER JOIN Projects p ON e.Project_ID = p.Project_ID
LEFT JOIN Contacts c ON ep.Participant_ID = c.Contact_ID
LEFT JOIN Participation_Statuses ps ON ep.Participation_Status_ID = ps.Participation_Status_ID
WHERE p.RSVP_Is_Active = 1
  AND e.Include_In_RSVP = 1
  AND e.Congregation_ID = @Algonac_ID
ORDER BY e.Event_Start_Date, ep._Setup_Date DESC;
