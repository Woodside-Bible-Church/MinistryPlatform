-- Investigate the relationship between Event_Participants and Invoice_Details

-- Check Invoice_Details structure first
SELECT COLUMN_NAME, DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Invoice_Detail'
ORDER BY ORDINAL_POSITION;

-- Check if there's a Participant_ID on Invoices
SELECT TOP 5 COLUMN_NAME, DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Invoices' AND COLUMN_NAME LIKE '%articipant%'
ORDER BY ORDINAL_POSITION;

-- Look at Event_Participants for Project 7
SELECT TOP 5
    ep.Event_Participant_ID,
    ep.Event_ID,
    ep.Participant_ID,
    c.Display_Name,
    e.Event_Title
FROM Event_Participants ep
INNER JOIN Events e ON ep.Event_ID = e.Event_ID
INNER JOIN Participants p ON ep.Participant_ID = p.Participant_ID
INNER JOIN Contacts c ON p.Contact_ID = c.Contact_ID
WHERE e.Project_ID = 7
ORDER BY ep.Event_Participant_ID DESC;
