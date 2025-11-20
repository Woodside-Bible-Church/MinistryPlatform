-- ===================================================================
-- Insert Project_Campuses for Christmas 2025 Events
-- ===================================================================
-- Creates Project_Campuses records for Project_ID = 5 (Christmas 2025)
-- using the congregation from each public event
-- ===================================================================

USE [MinistryPlatform]
GO

-- Insert Project_Campuses records based on the public events
-- Only include events on December 24th (Christmas Eve)
INSERT INTO dbo.Project_Campuses (Project_ID, Congregation_ID, Public_Event_ID, Is_Active, Display_Order, Domain_ID)
SELECT
    5 AS Project_ID,  -- Christmas 2025 project
    E.Congregation_ID,
    E.Event_ID AS Public_Event_ID,
    1 AS Is_Active,
    NULL AS Display_Order,
    1 AS Domain_ID
FROM Events E
WHERE E.Event_Type_ID = 23
  AND E.Event_Start_Date > GETDATE()
  AND E.Special_Occasion_ID IS NOT NULL
  AND E.Congregation_ID IS NOT NULL
  AND DAY(E.Event_Start_Date) = 24  -- Only December 24th events
  AND NOT EXISTS (
      SELECT 1 FROM Project_Campuses pc
      WHERE pc.Project_ID = 5
        AND pc.Congregation_ID = E.Congregation_ID
  )
ORDER BY E.Congregation_ID;

-- Show what was inserted
SELECT
    pc.Project_Campus_ID,
    pc.Project_ID,
    c.Congregation_Name,
    pc.Congregation_ID,
    pc.Public_Event_ID,
    e.Event_Title,
    pc.Is_Active
FROM dbo.Project_Campuses pc
INNER JOIN dbo.Congregations c ON pc.Congregation_ID = c.Congregation_ID
INNER JOIN dbo.Events e ON pc.Public_Event_ID = e.Event_ID
WHERE pc.Project_ID = 5
ORDER BY c.Congregation_Name;

PRINT 'Inserted Project_Campuses records for Christmas 2025 project';
