-- Update Event Descriptions for Project_ID = 5 (excluding Troy)
-- Standardize Description and move campus-specific info to Meeting_Instructions

-- Define the standard description
DECLARE @StandardDescription NVARCHAR(MAX) =
'When''s the last time you experienced the true wonder of Christmas? Despite our culture''s best efforts, the gifts, lights, food, and cozy feels can''t fill us with joy and awe that lasts. But when we focus on Jesus, we''ll experience the wonder of Christmas as God intended…in a way that captures our imagination and brings life to our souls.
Invite your friends and family to celebrate Christmas at Woodside!';

-- Preview the changes
SELECT
    e.Event_ID,
    c.Congregation_Name,
    e.Description AS Current_Description,
    e.Meeting_Instructions AS Current_Meeting_Instructions,
    @StandardDescription AS New_Description,
    LTRIM(RTRIM(
        SUBSTRING(
            e.Description,
            CHARINDEX('Invite your friends and family to celebrate Christmas at Woodside!', e.Description) +
            LEN('Invite your friends and family to celebrate Christmas at Woodside!'),
            LEN(e.Description)
        )
    )) AS New_Meeting_Instructions
FROM
    Events e
    INNER JOIN Project_Campuses pc ON e.Event_ID = pc.Public_Event_ID
    INNER JOIN Congregations c ON pc.Congregation_ID = c.Congregation_ID
WHERE
    pc.Project_ID = 5
    AND c.Congregation_Name != 'Troy'  -- Exclude Troy
    AND e.Description LIKE '%Invite your friends and family to celebrate Christmas at Woodside!%'
ORDER BY
    c.Congregation_Name;

GO

-- Execute the update
UPDATE e
SET
    e.Description = 'When''s the last time you experienced the true wonder of Christmas? Despite our culture''s best efforts, the gifts, lights, food, and cozy feels can''t fill us with joy and awe that lasts. But when we focus on Jesus, we''ll experience the wonder of Christmas as God intended…in a way that captures our imagination and brings life to our souls.
Invite your friends and family to celebrate Christmas at Woodside!',
    e.Meeting_Instructions = LTRIM(RTRIM(
        SUBSTRING(
            e.Description,
            CHARINDEX('Invite your friends and family to celebrate Christmas at Woodside!', e.Description) +
            LEN('Invite your friends and family to celebrate Christmas at Woodside!'),
            LEN(e.Description)
        )
    ))
FROM
    Events e
    INNER JOIN Project_Campuses pc ON e.Event_ID = pc.Public_Event_ID
    INNER JOIN Congregations c ON pc.Congregation_ID = c.Congregation_ID
WHERE
    pc.Project_ID = 5
    AND c.Congregation_Name != 'Troy'  -- Exclude Troy
    AND e.Description LIKE '%Invite your friends and family to celebrate Christmas at Woodside!%';

GO

-- Verify the changes
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
