-- Seed script: Create initial "Open" status cancellation records for all active campuses
-- Excludes: Church-Wide (ID=1), Farmington Hills, Troy
-- Run this once to initialize the cancellations status board

-- First, check what campuses will be seeded (dry run)
SELECT
    c.Congregation_ID,
    c.Congregation_Name,
    c.Campus_Slug
FROM Congregations c
WHERE c.End_Date IS NULL
    AND c.Available_Online = 1
    AND c.Congregation_ID <> 1  -- Exclude Church-Wide
    AND c.Congregation_Name NOT IN ('Farmington Hills', 'Troy')
    AND NOT EXISTS (
        SELECT 1 FROM Congregation_Cancellations cc
        WHERE cc.Congregation_ID = c.Congregation_ID
        AND cc.End_Date IS NULL
    )
ORDER BY c.Congregation_Name;

-- Insert Open status records for each campus that doesn't have an active cancellation
INSERT INTO Congregation_Cancellations (
    Congregation_ID,
    Cancellation_Status_ID,
    Reason,
    Expected_Resume_Time,
    Start_Date,
    End_Date,
    Domain_ID
)
SELECT
    c.Congregation_ID,
    1,  -- Open status
    NULL,  -- No reason needed for open status
    NULL,  -- No expected resume time
    GETDATE(),  -- Start date is now
    NULL,  -- No end date (indefinite)
    1  -- Domain_ID
FROM Congregations c
WHERE c.End_Date IS NULL
    AND c.Available_Online = 1
    AND c.Congregation_ID <> 1  -- Exclude Church-Wide
    AND c.Congregation_Name NOT IN ('Farmington Hills', 'Troy')
    AND NOT EXISTS (
        SELECT 1 FROM Congregation_Cancellations cc
        WHERE cc.Congregation_ID = c.Congregation_ID
        AND cc.End_Date IS NULL
    );

-- Verify the results
SELECT
    cc.Congregation_Cancellation_ID,
    c.Congregation_Name,
    cs.Status_Name,
    cc.Start_Date
FROM Congregation_Cancellations cc
JOIN Congregations c ON cc.Congregation_ID = c.Congregation_ID
JOIN __CancellationStatuses cs ON cc.Cancellation_Status_ID = cs.Cancellation_Status_ID
WHERE cc.End_Date IS NULL
ORDER BY c.Congregation_Name;
