-- Investigate the relationship between Event_Participants and Invoice_Details
-- to understand how to get payment information

-- First, let's look at the Event_Participants table structure
SELECT TOP 5
    ep.Event_Participant_ID,
    ep.Event_ID,
    ep.Participant_ID,
    ep.Participation_Status_ID,
    c.Display_Name,
    e.Event_Title
FROM Event_Participants ep
INNER JOIN Events e ON ep.Event_ID = e.Event_ID
INNER JOIN Participants p ON ep.Participant_ID = p.Participant_ID
INNER JOIN Contacts c ON p.Contact_ID = c.Contact_ID
WHERE e.Project_ID = 7
ORDER BY ep.Event_Participant_ID DESC;

-- Check if there's a Participant_ID on Invoices
SELECT COLUMN_NAME, DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Invoices'
ORDER BY ORDINAL_POSITION;

-- Check Invoice_Details structure
SELECT COLUMN_NAME, DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Invoice_Detail'
ORDER BY ORDINAL_POSITION;

-- Try to find the relationship
-- Look for Event_Participants with Invoice data
SELECT TOP 5
    ep.Event_Participant_ID,
    c.Display_Name,
    e.Event_Title,
    i.Invoice_ID,
    i.Invoice_Date,
    i.Invoice_Total,
    id.Quantity,
    id.Unit_Price,
    id.Total_Amount
FROM Event_Participants ep
INNER JOIN Events e ON ep.Event_ID = e.Event_ID
INNER JOIN Participants p ON ep.Participant_ID = p.Participant_ID
INNER JOIN Contacts c ON p.Contact_ID = c.Contact_ID
LEFT JOIN Invoices i ON p.Participant_ID = i.Recipient_Contact_ID
LEFT JOIN Invoice_Detail id ON i.Invoice_ID = id.Invoice_ID
WHERE e.Project_ID = 7
    AND i.Invoice_ID IS NOT NULL
ORDER BY i.Invoice_Date DESC;
