-- ===================================================================
-- Debug: Simplified test for Events query issue
-- ===================================================================

USE [MinistryPlatform]
GO

DECLARE @Project_RSVP_ID INT = 1;

-- Step 1: Verify Project_RSVP exists and get Project_ID
PRINT '==================================================================='
PRINT 'Step 1: Check Project_RSVP record'
PRINT '==================================================================='
SELECT
    Project_RSVP_ID,
    Project_ID,
    RSVP_Title,
    Is_Active
FROM Project_RSVPs
WHERE Project_RSVP_ID = @Project_RSVP_ID;

-- Step 2: Get the Project_ID into a variable
DECLARE @ProjectID INT;
SELECT @ProjectID = Project_ID FROM Project_RSVPs WHERE Project_RSVP_ID = @Project_RSVP_ID;

PRINT '';
PRINT 'Project_ID from variable: ' + ISNULL(CAST(@ProjectID AS NVARCHAR), 'NULL');

-- Step 3: Test the basic query WITHOUT FOR JSON
PRINT '';
PRINT '==================================================================='
PRINT 'Step 2: Run query WITHOUT FOR JSON PATH'
PRINT '==================================================================='
SELECT
    e.Event_ID,
    e.Event_Title,
    e.Event_Start_Date,
    e.Congregation_ID,
    c.Congregation_Name AS Campus_Name
FROM Project_Events pe
INNER JOIN Events e ON pe.Event_ID = e.Event_ID
LEFT JOIN Congregations c ON e.Congregation_ID = c.Congregation_ID
WHERE pe.Project_ID = @ProjectID
  AND pe.Include_In_RSVP = 1;

-- Step 4: Test with FOR JSON PATH
PRINT '';
PRINT '==================================================================='
PRINT 'Step 3: Run same query WITH FOR JSON PATH'
PRINT '==================================================================='
DECLARE @EventsJson NVARCHAR(MAX);

SELECT @EventsJson = (
    SELECT
        e.Event_ID,
        e.Event_Title,
        e.Event_Start_Date,
        e.Congregation_ID,
        c.Congregation_Name AS Campus_Name
    FROM Project_Events pe
    INNER JOIN Events e ON pe.Event_ID = e.Event_ID
    LEFT JOIN Congregations c ON e.Congregation_ID = c.Congregation_ID
    WHERE pe.Project_ID = @ProjectID
      AND pe.Include_In_RSVP = 1
    FOR JSON PATH
);

SELECT @EventsJson AS EventsJson_Result;

-- Step 5: Test with subquery (as in stored proc)
PRINT '';
PRINT '==================================================================='
PRINT 'Step 4: Run with subquery (as used in stored proc)'
PRINT '==================================================================='
DECLARE @EventsJson2 NVARCHAR(MAX);

SELECT @EventsJson2 = (
    SELECT
        e.Event_ID,
        e.Event_Title,
        e.Event_Start_Date
    FROM Project_Events pe
    INNER JOIN Events e ON pe.Event_ID = e.Event_ID
    WHERE pe.Project_ID = (SELECT Project_ID FROM Project_RSVPs WHERE Project_RSVP_ID = @Project_RSVP_ID)
      AND pe.Include_In_RSVP = 1
    FOR JSON PATH
);

SELECT @EventsJson2 AS EventsJson_With_Subquery;

GO
