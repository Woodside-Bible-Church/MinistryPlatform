-- Clean up leading/trailing whitespace and line breaks from Description and Meeting_Instructions
-- For Project_ID = 5 events (excluding Troy)

-- Preview the changes
SELECT
    e.Event_ID,
    c.Congregation_Name,
    '[' + e.Description + ']' AS Current_Description,
    '[' + ISNULL(e.Meeting_Instructions, '') + ']' AS Current_Meeting_Instructions,
    '[' + LTRIM(RTRIM(REPLACE(REPLACE(REPLACE(e.Description, CHAR(13), ''), CHAR(10), ''), CHAR(9), ''))) + ']' AS New_Description_Preview,
    '[' + LTRIM(RTRIM(REPLACE(REPLACE(REPLACE(ISNULL(e.Meeting_Instructions, ''), CHAR(13), ''), CHAR(10), ''), CHAR(9), ''))) + ']' AS New_Meeting_Instructions_Preview
FROM
    Events e
    INNER JOIN Project_Campuses pc ON e.Event_ID = pc.Public_Event_ID
    INNER JOIN Congregations c ON pc.Congregation_ID = c.Congregation_ID
WHERE
    pc.Project_ID = 5
    AND c.Congregation_Name != 'Troy'
ORDER BY
    c.Congregation_Name;

GO

-- Execute the cleanup - trim all whitespace characters
UPDATE e
SET
    e.Description = LTRIM(RTRIM(e.Description)),
    e.Meeting_Instructions = LTRIM(RTRIM(e.Meeting_Instructions))
FROM
    Events e
    INNER JOIN Project_Campuses pc ON e.Event_ID = pc.Public_Event_ID
    INNER JOIN Congregations c ON pc.Congregation_ID = c.Congregation_ID
WHERE
    pc.Project_ID = 5
    AND c.Congregation_Name != 'Troy';

GO

-- Verify the cleanup
SELECT
    e.Event_ID,
    c.Congregation_Name,
    e.Description,
    e.Meeting_Instructions,
    LEN(e.Description) AS Description_Length,
    LEN(ISNULL(e.Meeting_Instructions, '')) AS Meeting_Instructions_Length
FROM
    Events e
    INNER JOIN Project_Campuses pc ON e.Event_ID = pc.Public_Event_ID
    INNER JOIN Congregations c ON pc.Congregation_ID = c.Congregation_ID
WHERE
    pc.Project_ID = 5
ORDER BY
    c.Congregation_Name;
