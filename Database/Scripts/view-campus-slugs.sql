-- View Campus Slugs for Project_ID = 5
SELECT
    pc.Project_Campus_ID,
    pc.Congregation_ID,
    c.Congregation_Name,
    c.Campus_Slug,
    pc.Public_Event_ID,
    e.External_Registration_URL,
    CONCAT(e.External_Registration_URL, '?campus=', c.Campus_Slug) AS New_URL
FROM
    Project_Campuses pc
    INNER JOIN Congregations c ON pc.Congregation_ID = c.Congregation_ID
    LEFT JOIN Events e ON pc.Public_Event_ID = e.Event_ID
WHERE
    pc.Project_ID = 5
ORDER BY
    c.Congregation_Name;
