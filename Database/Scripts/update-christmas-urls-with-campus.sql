-- Update External_Registration_URL for Project_ID = 5 events
-- Appends ?campus={Campus_Slug} to each URL

-- Preview the changes first
SELECT
    e.Event_ID,
    c.Congregation_Name,
    c.Campus_Slug,
    e.External_Registration_URL AS Current_URL,
    CONCAT(e.External_Registration_URL, '?campus=', c.Campus_Slug) AS New_URL
FROM
    Events e
    INNER JOIN Project_Campuses pc ON e.Event_ID = pc.Public_Event_ID
    INNER JOIN Congregations c ON pc.Congregation_ID = c.Congregation_ID
WHERE
    pc.Project_ID = 5
    AND e.External_Registration_URL = 'https://woodsidebible.org/christmas'
ORDER BY
    c.Congregation_Name;

-- Execute the update:
UPDATE e
SET e.External_Registration_URL = CONCAT(e.External_Registration_URL, '?campus=', c.Campus_Slug)
FROM
    Events e
    INNER JOIN Project_Campuses pc ON e.Event_ID = pc.Public_Event_ID
    INNER JOIN Congregations c ON pc.Congregation_ID = c.Congregation_ID
WHERE
    pc.Project_ID = 5
    AND e.External_Registration_URL = 'https://woodsidebible.org/christmas';

GO

-- Verify the changes
SELECT
    e.Event_ID,
    c.Congregation_Name,
    e.External_Registration_URL
FROM
    Events e
    INNER JOIN Project_Campuses pc ON e.Event_ID = pc.Public_Event_ID
    INNER JOIN Congregations c ON pc.Congregation_ID = c.Congregation_ID
WHERE
    pc.Project_ID = 5
ORDER BY
    c.Congregation_Name;
