-- Clean up ONLY leading/trailing whitespace from Description
-- Preserves internal line breaks, removes leading/trailing spaces, tabs, CR, LF
-- For Project_ID = 5 events (excluding Troy)

WITH Trimmed AS (
    SELECT
        e.Event_ID,
        e.Description AS Original,
        -- Find start position (first non-whitespace character)
        PATINDEX('%[^ ' + CHAR(9) + CHAR(10) + CHAR(13) + ']%', e.Description) AS StartPos,
        -- Find end position by reversing and finding first non-whitespace
        LEN(e.Description) - PATINDEX('%[^ ' + CHAR(9) + CHAR(10) + CHAR(13) + ']%', REVERSE(e.Description)) + 1 AS EndPos
    FROM
        Events e
        INNER JOIN Project_Campuses pc ON e.Event_ID = pc.Public_Event_ID
        INNER JOIN Congregations c ON pc.Congregation_ID = c.Congregation_ID
    WHERE
        pc.Project_ID = 5
        AND c.Congregation_Name != 'Troy'
        AND e.Description IS NOT NULL
)
UPDATE e
SET e.Description = SUBSTRING(t.Original, t.StartPos, t.EndPos - t.StartPos + 1)
FROM Events e
INNER JOIN Trimmed t ON e.Event_ID = t.Event_ID
WHERE t.StartPos > 0;

GO

-- Verify the cleanup
SELECT
    e.Event_ID,
    c.Congregation_Name,
    e.Description,
    e.Meeting_Instructions,
    LEN(e.Description) AS Description_Length,
    LEN(ISNULL(e.Meeting_Instructions, '')) AS Meeting_Instructions_Length,
    '[' + LEFT(e.Description, 50) + '...]' AS Description_Preview,
    '[' + ISNULL(e.Meeting_Instructions, '') + ']' AS Meeting_Instructions_Bracketed
FROM
    Events e
    INNER JOIN Project_Campuses pc ON e.Event_ID = pc.Public_Event_ID
    INNER JOIN Congregations c ON pc.Congregation_ID = c.Congregation_ID
WHERE
    pc.Project_ID = 5
ORDER BY
    c.Congregation_Name;
