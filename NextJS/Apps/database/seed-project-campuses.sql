-- Seed Project_Campuses records for Christmas Services 2025
-- Project_ID: 5
-- These campuses have confirmation cards but no existing Project_Campuses records

INSERT INTO Project_Campuses (
    Project_ID,
    Congregation_ID,
    Public_Event_ID,
    Is_Active,
    Display_Order
)
VALUES
    (5, 16, NULL, 1, NULL), -- Warren
    (5, 27, NULL, 1, NULL), -- Troy Español
    (5, 12, NULL, 1, NULL), -- Pontiac
    (5, 11, NULL, 1, NULL), -- Plymouth
    (5, 9, NULL, 1, NULL),  -- Lake Orion
    (5, 8, NULL, 1, NULL),  -- Farmington Hills
    (5, 26, NULL, 1, NULL); -- Downriver

-- Verify the inserts
SELECT
    pc.Project_Campus_ID,
    pc.Project_ID,
    c.Congregation_Name,
    pc.Congregation_ID,
    pc.Public_Event_ID,
    pc.Is_Active,
    pc.Display_Order
FROM Project_Campuses pc
INNER JOIN Congregations c ON pc.Congregation_ID = c.Congregation_ID
WHERE pc.Project_ID = 5
ORDER BY c.Congregation_Name;
