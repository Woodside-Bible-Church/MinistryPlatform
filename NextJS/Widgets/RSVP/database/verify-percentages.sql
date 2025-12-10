-- Verify the fixed calculations directly
USE [MinistryPlatform]
GO

DECLARE @Chesterfield_ID INT;
SELECT @Chesterfield_ID = Congregation_ID
FROM Congregations
WHERE Congregation_Name LIKE '%Chesterfield%';

-- Test the exact same calculation that the stored proc uses now
SELECT
    e.Event_ID,
    FORMAT(e.Event_Start_Date, 'MMM dd, h:mm tt') AS Event_Time,
    e.RSVP_Capacity,
    -- Count RSVPs (records)
    (SELECT COUNT(*) FROM Event_Participants ep
     WHERE ep.Event_ID = e.Event_ID
     AND ep.Participation_Status_ID = 2) AS RSVP_Count,
    -- Sum attendees (party sizes) - THIS IS THE FIX
    (SELECT SUM(ISNULL(ep.RSVP_Party_Size, 1)) FROM Event_Participants ep
     WHERE ep.Event_ID = e.Event_ID
     AND ep.Participation_Status_ID = 2) AS Total_Attendees,
    -- OLD calculation (wrong)
    CASE
        WHEN e.RSVP_Capacity IS NULL OR e.RSVP_Capacity = 0 THEN 0
        ELSE CAST(
            ((SELECT COUNT(*) FROM Event_Participants ep
              WHERE ep.Event_ID = e.Event_ID
              AND ep.Participation_Status_ID = 2) + ISNULL(e.RSVP_Capacity_Modifier, 0)) * 100.0
            / e.RSVP_Capacity AS INT
        )
    END AS Old_Percentage,
    -- NEW calculation (fixed)
    CASE
        WHEN e.RSVP_Capacity IS NULL OR e.RSVP_Capacity = 0 THEN 0
        ELSE CAST(
            ((SELECT SUM(ISNULL(ep.RSVP_Party_Size, 1)) FROM Event_Participants ep
              WHERE ep.Event_ID = e.Event_ID
              AND ep.Participation_Status_ID = 2) + ISNULL(e.RSVP_Capacity_Modifier, 0)) * 100.0
            / e.RSVP_Capacity AS INT
        )
    END AS New_Percentage
FROM Events e
INNER JOIN Projects p ON e.Project_ID = p.Project_ID
WHERE p.RSVP_Is_Active = 1
  AND e.Include_In_RSVP = 1
  AND e.Congregation_ID = @Chesterfield_ID
ORDER BY e.Event_Start_Date;
