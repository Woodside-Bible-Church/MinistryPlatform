-- ===================================================================
-- Debug: Test the Events query step by step
-- ===================================================================

USE [MinistryPlatform]
GO

DECLARE @Project_RSVP_ID INT = 1;
DECLARE @Congregation_ID INT = NULL;

-- Step 1: Get the Project_ID from Project_RSVPs
DECLARE @ProjectID INT;
SELECT @ProjectID = Project_ID FROM Project_RSVPs WHERE Project_RSVP_ID = @Project_RSVP_ID;

PRINT 'Project_ID from Project_RSVPs: ' + CAST(@ProjectID AS NVARCHAR);

-- Step 2: Test the WHERE clause conditions one by one
PRINT '';
PRINT 'Testing WHERE clause conditions:';
PRINT '===================================================================';

-- Test 1: Events in Project_Events for this Project_ID
SELECT 'Test 1: Events in Project_Events' AS Test;
SELECT COUNT(*) AS Count FROM Project_Events WHERE Project_ID = @ProjectID;

-- Test 2: Events with Include_In_RSVP = 1
SELECT 'Test 2: Events with Include_In_RSVP = 1' AS Test;
SELECT COUNT(*) AS Count FROM Project_Events WHERE Project_ID = @ProjectID AND Include_In_RSVP = 1;

-- Test 3: Full JOIN with Events table
SELECT 'Test 3: JOIN to Events table' AS Test;
SELECT COUNT(*) AS Count
FROM Project_Events pe
INNER JOIN Events e ON pe.Event_ID = e.Event_ID
WHERE pe.Project_ID = @ProjectID
  AND pe.Include_In_RSVP = 1;

-- Step 3: Run the actual query without FOR JSON
SELECT
    e.Event_ID,
    e.Event_Title,
    e.Event_Start_Date,
    e.Congregation_ID,
    c.Congregation_Name AS Campus_Name,
    pe.Include_In_RSVP,
    pe.RSVP_Capacity_Modifier
FROM Project_Events pe
INNER JOIN Events e ON pe.Event_ID = e.Event_ID
LEFT JOIN Congregations c ON e.Congregation_ID = c.Congregation_ID
LEFT JOIN Locations l ON c.Location_ID = l.Location_ID
LEFT JOIN Addresses a ON l.Address_ID = a.Address_ID
WHERE pe.Project_ID = @ProjectID
  AND pe.Include_In_RSVP = 1
  AND (@Congregation_ID IS NULL OR e.Congregation_ID = @Congregation_ID)
ORDER BY e.Event_Start_Date ASC;

-- Step 4: Test with the subquery version (like in stored proc)
PRINT '';
PRINT 'Testing with subquery (as used in stored proc):';
SELECT COUNT(*) AS Count
FROM Project_Events pe
INNER JOIN Events e ON pe.Event_ID = e.Event_ID
WHERE pe.Project_ID = (SELECT Project_ID FROM Project_RSVPs WHERE Project_RSVP_ID = @Project_RSVP_ID)
  AND pe.Include_In_RSVP = 1;
GO
