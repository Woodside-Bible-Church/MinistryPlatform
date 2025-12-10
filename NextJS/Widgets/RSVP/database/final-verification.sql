-- Final verification with ROUND()
USE [MinistryPlatform]
GO

DECLARE @Chesterfield_ID INT;
SELECT @Chesterfield_ID = Congregation_ID
FROM Congregations
WHERE Congregation_Name LIKE '%Chesterfield%';

SELECT
    e.Event_ID,
    FORMAT(e.Event_Start_Date, 'MMM dd, h:mm tt') AS Event_Time,
    e.RSVP_Capacity,
    -- Sum attendees (party sizes)
    (SELECT SUM(ISNULL(ep.RSVP_Party_Size, 1)) FROM Event_Participants ep
     WHERE ep.Event_ID = e.Event_ID
     AND ep.Participation_Status_ID = 2) AS Total_Attendees,
    -- With ROUND() - CORRECT
    CASE
        WHEN e.RSVP_Capacity IS NULL OR e.RSVP_Capacity = 0 THEN 0
        ELSE ROUND(
            ((SELECT SUM(ISNULL(ep.RSVP_Party_Size, 1)) FROM Event_Participants ep
              WHERE ep.Event_ID = e.Event_ID
              AND ep.Participation_Status_ID = 2) + ISNULL(e.RSVP_Capacity_Modifier, 0)) * 100.0
            / e.RSVP_Capacity, 0
        )
    END AS Capacity_Percentage
FROM Events e
INNER JOIN Projects p ON e.Project_ID = p.Project_ID
WHERE p.RSVP_Is_Active = 1
  AND e.Include_In_RSVP = 1
  AND e.Congregation_ID = @Chesterfield_ID
ORDER BY e.Event_Start_Date;
