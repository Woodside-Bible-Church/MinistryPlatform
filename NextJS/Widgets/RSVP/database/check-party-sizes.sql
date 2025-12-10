-- Check RSVP_Party_Size for Chesterfield events
USE [MinistryPlatform]
GO

DECLARE @Chesterfield_ID INT;
SELECT @Chesterfield_ID = Congregation_ID
FROM Congregations
WHERE Congregation_Name LIKE '%Chesterfield%';

-- Show detailed participant data with party sizes
SELECT
    e.Event_ID,
    FORMAT(e.Event_Start_Date, 'MMM dd, h:mm tt') AS Event_Time,
    e.RSVP_Capacity,
    ep.Event_Participant_ID,
    c.First_Name + ' ' + c.Last_Name AS Participant,
    ep.Participation_Status_ID,
    ps.Participation_Status,
    ep.RSVP_Party_Size,
    FORMAT(ep._Setup_Date, 'MM/dd HH:mm') AS Created
FROM Event_Participants ep
INNER JOIN Events e ON ep.Event_ID = e.Event_ID
INNER JOIN Projects p ON e.Project_ID = p.Project_ID
LEFT JOIN Contacts c ON ep.Participant_ID = c.Contact_ID
LEFT JOIN Participation_Statuses ps ON ep.Participation_Status_ID = ps.Participation_Status_ID
WHERE p.RSVP_Is_Active = 1
  AND e.Include_In_RSVP = 1
  AND e.Congregation_ID = @Chesterfield_ID
ORDER BY e.Event_Start_Date, ep._Setup_Date DESC;

-- Summary by event
PRINT '';
PRINT 'Summary:';
SELECT
    e.Event_ID,
    FORMAT(e.Event_Start_Date, 'MMM dd, h:mm tt') AS Event_Time,
    e.RSVP_Capacity,
    COUNT(ep.Event_Participant_ID) AS Total_RSVPs,
    SUM(ISNULL(ep.RSVP_Party_Size, 1)) AS Total_Attendees
FROM Event_Participants ep
INNER JOIN Events e ON ep.Event_ID = e.Event_ID
INNER JOIN Projects p ON e.Project_ID = p.Project_ID
WHERE p.RSVP_Is_Active = 1
  AND e.Include_In_RSVP = 1
  AND e.Congregation_ID = @Chesterfield_ID
  AND ep.Participation_Status_ID = 2
GROUP BY e.Event_ID, e.Event_Start_Date, e.RSVP_Capacity
ORDER BY e.Event_Start_Date;
