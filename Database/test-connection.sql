-- Test Database Connection
-- This simple query verifies you can connect and read from the database

SELECT
    DB_NAME() AS DatabaseName,
    GETDATE() AS CurrentDateTime,
    USER_NAME() AS CurrentUser,
    @@VERSION AS SQLServerVersion;

-- Test reading from a core table
SELECT TOP 5
    Event_ID,
    Event_Title,
    Event_Start_Date,
    Event_End_Date
FROM Events
ORDER BY Event_Start_Date DESC;

PRINT 'Connection test successful!';
