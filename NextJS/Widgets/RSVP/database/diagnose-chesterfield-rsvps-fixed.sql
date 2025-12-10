-- ===================================================================
-- Diagnostic Query: Investigate Chesterfield RSVP Display Issue (FIXED)
-- ===================================================================
-- Purpose: Find out why Chesterfield shows 0% in widget but has RSVPs in companion app
-- Date: 2025-12-09
-- ===================================================================

USE [MinistryPlatform]
GO

-- ===================================================================
-- Step 1: Find the Project ID for Christmas (or current RSVP project)
-- ===================================================================
PRINT '===================================================================';
PRINT 'Step 1: Finding Active RSVP Projects';
PRINT '===================================================================';

SELECT
    Project_ID,
    Project_Name,
    RSVP_Slug,
    RSVP_Title,
    RSVP_Is_Active
FROM Projects
WHERE RSVP_Is_Active = 1
ORDER BY Project_ID DESC;

-- Replace @Project_ID with your actual project ID
DECLARE @Project_ID INT = 1;  -- UPDATE THIS with the correct Project_ID from above

PRINT '';
PRINT '===================================================================';
PRINT 'Step 2: Finding Events for Project ' + CAST(@Project_ID AS VARCHAR(10));
PRINT '===================================================================';

-- Get all events for this project grouped by campus
SELECT
    e.Event_ID,
    e.Event_Title,
    e.Event_Start_Date,
    e.Congregation_ID,
    c.Congregation_Name AS Campus_Name,
    e.RSVP_Capacity,
    e.RSVP_Capacity_Modifier,
    e.Include_In_RSVP,
    -- Count RSVPs from Event_Participants
    (SELECT COUNT(*)
     FROM Event_Participants ep
     WHERE ep.Event_ID = e.Event_ID
     AND ep.Participation_Status_ID = 2) AS Event_Participants_Count,
    -- Calculate what stored proc would show
    CASE
        WHEN e.RSVP_Capacity IS NULL THEN 0
        WHEN e.RSVP_Capacity = 0 THEN 0
        ELSE CAST(
            ((SELECT COUNT(*) FROM Event_Participants ep
              WHERE ep.Event_ID = e.Event_ID
              AND ep.Participation_Status_ID = 2) + ISNULL(e.RSVP_Capacity_Modifier, 0)) * 100.0
            / e.RSVP_Capacity AS INT
        )
    END AS Capacity_Percentage_From_StoredProc
FROM Events e
LEFT JOIN Congregations c ON e.Congregation_ID = c.Congregation_ID
WHERE e.Project_ID = @Project_ID
  AND e.Include_In_RSVP = 1
ORDER BY c.Congregation_Name, e.Event_Start_Date;

PRINT '';
PRINT '===================================================================';
PRINT 'Step 3: Finding Chesterfield-specific Events';
PRINT '===================================================================';

-- Find Chesterfield Congregation_ID first
DECLARE @Chesterfield_Congregation_ID INT;
SELECT @Chesterfield_Congregation_ID = Congregation_ID
FROM Congregations
WHERE Congregation_Name LIKE '%Chesterfield%';

PRINT 'Chesterfield Congregation_ID: ' + ISNULL(CAST(@Chesterfield_Congregation_ID AS VARCHAR(10)), 'NOT FOUND');

-- Get Chesterfield events with detailed participant info
IF @Chesterfield_Congregation_ID IS NOT NULL
BEGIN
    SELECT
        e.Event_ID,
        e.Event_Title,
        FORMAT(e.Event_Start_Date, 'ddd - MMM dd, h:mm tt') AS Event_Time,
        e.RSVP_Capacity,
        e.RSVP_Capacity_Modifier,
        COUNT(ep.Event_Participant_ID) AS Participant_Count,
        CASE
            WHEN e.RSVP_Capacity IS NULL OR e.RSVP_Capacity = 0 THEN 0
            ELSE CAST((COUNT(ep.Event_Participant_ID) + ISNULL(e.RSVP_Capacity_Modifier, 0)) * 100.0 / e.RSVP_Capacity AS INT)
        END AS Calculated_Percentage
    FROM Events e
    LEFT JOIN Event_Participants ep ON ep.Event_ID = e.Event_ID
        AND ep.Participation_Status_ID = 2
    WHERE e.Congregation_ID = @Chesterfield_Congregation_ID
      AND e.Project_ID = @Project_ID
      AND e.Include_In_RSVP = 1
    GROUP BY
        e.Event_ID,
        e.Event_Title,
        e.Event_Start_Date,
        e.RSVP_Capacity,
        e.RSVP_Capacity_Modifier
    ORDER BY e.Event_Start_Date;

    PRINT '';
    PRINT '===================================================================';
    PRINT 'Step 4: List actual Event_Participants for Chesterfield events';
    PRINT '===================================================================';

    SELECT
        ep.Event_Participant_ID,
        ep.Event_ID,
        e.Event_Title,
        FORMAT(e.Event_Start_Date, 'ddd - MMM dd, h:mm tt') AS Event_Time,
        ep.Participant_ID,
        c.First_Name,
        c.Last_Name,
        ep.Participation_Status_ID,
        ps.Participation_Status,
        ep.Start_Date AS Participant_Start_Date
    FROM Event_Participants ep
    INNER JOIN Events e ON ep.Event_ID = e.Event_ID
    LEFT JOIN Contacts c ON ep.Participant_ID = c.Contact_ID
    LEFT JOIN Participation_Statuses ps ON ep.Participation_Status_ID = ps.Participation_Status_ID
    WHERE e.Congregation_ID = @Chesterfield_Congregation_ID
      AND e.Project_ID = @Project_ID
      AND e.Include_In_RSVP = 1
    ORDER BY e.Event_Start_Date, ep.Start_Date DESC;
END

PRINT '';
PRINT '===================================================================';
PRINT 'Step 5: Compare with Algonac (working campus)';
PRINT '===================================================================';

-- Find Algonac Congregation_ID
DECLARE @Algonac_Congregation_ID INT;
SELECT @Algonac_Congregation_ID = Congregation_ID
FROM Congregations
WHERE Congregation_Name LIKE '%Algonac%';

PRINT 'Algonac Congregation_ID: ' + ISNULL(CAST(@Algonac_Congregation_ID AS VARCHAR(10)), 'NOT FOUND');

-- Get Algonac events with detailed participant info
IF @Algonac_Congregation_ID IS NOT NULL
BEGIN
    SELECT
        e.Event_ID,
        e.Event_Title,
        FORMAT(e.Event_Start_Date, 'ddd - MMM dd, h:mm tt') AS Event_Time,
        e.RSVP_Capacity,
        e.RSVP_Capacity_Modifier,
        COUNT(ep.Event_Participant_ID) AS Participant_Count,
        CASE
            WHEN e.RSVP_Capacity IS NULL OR e.RSVP_Capacity = 0 THEN 0
            ELSE CAST((COUNT(ep.Event_Participant_ID) + ISNULL(e.RSVP_Capacity_Modifier, 0)) * 100.0 / e.RSVP_Capacity AS INT)
        END AS Calculated_Percentage
    FROM Events e
    LEFT JOIN Event_Participants ep ON ep.Event_ID = e.Event_ID
        AND ep.Participation_Status_ID = 2
    WHERE e.Congregation_ID = @Algonac_Congregation_ID
      AND e.Project_ID = @Project_ID
      AND e.Include_IN_RSVP = 1
    GROUP BY
        e.Event_ID,
        e.Event_Title,
        e.Event_Start_Date,
        e.RSVP_Capacity,
        e.RSVP_Capacity_Modifier
    ORDER BY e.Event_Start_Date;
END

PRINT '';
PRINT '===================================================================';
PRINT 'DIAGNOSIS COMPLETE';
PRINT '===================================================================';
PRINT 'Review the results above to identify:';
PRINT '1. Are Chesterfield events returning in the query?';
PRINT '2. Do they have Event_Participants with Participation_Status_ID = 2?';
PRINT '3. Is RSVP_Capacity set correctly (not 0 or NULL when it should have a value)?';
PRINT '4. How does Chesterfield data compare to Algonac data?';
PRINT '===================================================================';
