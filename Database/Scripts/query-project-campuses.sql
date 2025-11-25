-- Query Project_Campuses with Project_ID = 5
-- Join to Events table to get External Registration URL

SELECT
    pc.*,
    e.Event_Title,
    e.Event_Start_Date,
    e.Event_End_Date,
    e.External_Registration_URL
FROM
    Project_Campuses pc
    LEFT JOIN Events e ON pc.Public_Event_ID = e.Event_ID
WHERE
    pc.Project_ID = 5
ORDER BY
    pc.Congregation_ID;
