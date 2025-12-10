-- Check events linked to Project 7 and their registration income

USE MinistryPlatform;
GO

-- 1. Check events linked to Project 7
PRINT 'Events for Project 7:';
SELECT
    e.Event_ID,
    e.Event_Title,
    e.Event_Start_Date,
    e.Event_End_Date,
    e.Include_Registrations_In_Project_Budgets,
    COUNT(ep.Event_Participant_ID) AS Participant_Count
FROM Events e
LEFT JOIN Event_Participants ep ON e.Event_ID = ep.Event_ID
WHERE e.Project_ID = 7
GROUP BY e.Event_ID, e.Event_Title, e.Event_Start_Date, e.Event_End_Date, e.Include_Registrations_In_Project_Budgets
ORDER BY e.Event_Start_Date;

PRINT '';
PRINT 'Event Participants and Invoice Details for budget-included events:';
-- 2. Check invoice details for participants
SELECT TOP 10
    e.Event_ID,
    e.Event_Title,
    ep.Event_Participant_ID,
    c.Display_Name,
    id.Line_Total,
    id.Product_ID,
    p.Product_Name
FROM Events e
INNER JOIN Event_Participants ep ON e.Event_ID = ep.Event_ID
LEFT JOIN Invoice_Detail id ON ep.Event_Participant_ID = id.Event_Participant_ID
LEFT JOIN Products p ON id.Product_ID = p.Product_ID
INNER JOIN Participants part ON ep.Participant_ID = part.Participant_ID
INNER JOIN Contacts c ON part.Contact_ID = c.Contact_ID
WHERE e.Project_ID = 7
    AND e.Include_Registrations_In_Project_Budgets = 1
ORDER BY e.Event_ID, ep.Event_Participant_ID;

PRINT '';
PRINT 'Total Registration Income for Project 7 (from events with Include_On_Budget = 1):';
-- 3. Calculate total registration income
SELECT
    e.Project_ID,
    COUNT(DISTINCT ep.Event_Participant_ID) AS Total_Participants,
    SUM(id.Line_Total) AS Total_Registration_Income
FROM Events e
INNER JOIN Event_Participants ep ON e.Event_ID = ep.Event_ID
LEFT JOIN Invoice_Detail id ON ep.Event_Participant_ID = id.Event_Participant_ID
WHERE e.Project_ID = 7
    AND e.Include_Registrations_In_Project_Budgets = 1
GROUP BY e.Project_ID;

GO
