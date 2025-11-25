-- View Event Descriptions for Project_ID = 5
-- Check current Description and Meeting_Details fields

SELECT
    e.Event_ID,
    c.Congregation_Name,
    e.Event_Title,
    e.Description,
    e.Meeting_Instructions,
    LEN(e.Description) AS Description_Length
FROM
    Events e
    INNER JOIN Project_Campuses pc ON e.Event_ID = pc.Public_Event_ID
    INNER JOIN Congregations c ON pc.Congregation_ID = c.Congregation_ID
WHERE
    pc.Project_ID = 5
ORDER BY
    c.Congregation_Name;
