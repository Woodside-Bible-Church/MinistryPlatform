-- Check Events table schema

USE MinistryPlatform;
GO

SELECT COLUMN_NAME, DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Events'
    AND (COLUMN_NAME LIKE '%Budget%' OR COLUMN_NAME LIKE '%Project%')
ORDER BY ORDINAL_POSITION;

-- Check events for Project 7
SELECT Event_ID, Event_Title, Event_Start_Date, Project_ID
FROM Events
WHERE Project_ID = 7;

GO
