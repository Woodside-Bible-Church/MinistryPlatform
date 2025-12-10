-- Check for capacity-related fields in Projects table
SELECT
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Projects'
    AND (COLUMN_NAME LIKE '%capacity%' OR COLUMN_NAME LIKE '%modifier%')
ORDER BY ORDINAL_POSITION;

-- Check the actual project data
SELECT
    Project_ID,
    Project_Title,
    Expected_Registration_Revenue
FROM Projects
WHERE Project_ID = 7;

-- Check Events for capacity info
SELECT
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Events'
    AND (COLUMN_NAME LIKE '%capacity%' OR COLUMN_NAME LIKE '%modifier%')
ORDER BY ORDINAL_POSITION;
