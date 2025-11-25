-- Clean up ONLY leading/trailing whitespace from Meeting_Instructions
-- Preserves internal line breaks, removes leading/trailing spaces, tabs, CR, LF
-- For Project_ID = 5 events (excluding Troy)

WITH Trimmed AS (
    SELECT
        e.Event_ID,
        e.Meeting_Instructions AS Original,
        -- Find start position (first non-whitespace character)
        PATINDEX('%[^ ' + CHAR(9) + CHAR(10) + CHAR(13) + ']%', e.Meeting_Instructions) AS StartPos,
        -- Find end position by reversing and finding first non-whitespace
        LEN(e.Meeting_Instructions) - PATINDEX('%[^ ' + CHAR(9) + CHAR(10) + CHAR(13) + ']%', REVERSE(e.Meeting_Instructions)) + 1 AS EndPos
    FROM
        Events e
        INNER JOIN Project_Campuses pc ON e.Event_ID = pc.Public_Event_ID
        INNER JOIN Congregations c ON pc.Congregation_ID = c.Congregation_ID
    WHERE
        pc.Project_ID = 5
        AND c.Congregation_Name != 'Troy'
        AND e.Meeting_Instructions IS NOT NULL
)
UPDATE e
SET e.Meeting_Instructions = SUBSTRING(t.Original, t.StartPos, t.EndPos - t.StartPos + 1)
FROM Events e
INNER JOIN Trimmed t ON e.Event_ID = t.Event_ID
WHERE t.StartPos > 0;

GO

-- Verify the cleanup
SELECT
    e.Event_ID,
    c.Congregation_Name,
    e.Meeting_Instructions,
    LEN(ISNULL(e.Meeting_Instructions, '')) AS Length,
    '[' + ISNULL(e.Meeting_Instructions, '') + ']' AS Bracketed_View
FROM
    Events e
    INNER JOIN Project_Campuses pc ON e.Event_ID = pc.Public_Event_ID
    INNER JOIN Congregations c ON pc.Congregation_ID = c.Congregation_ID
WHERE
    pc.Project_ID = 5
ORDER BY
    c.Congregation_Name;
