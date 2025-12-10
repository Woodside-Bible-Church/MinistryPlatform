-- Check the actual schema of Project_Budget_Transactions table
SELECT
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    CHARACTER_MAXIMUM_LENGTH
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Project_Budget_Transactions'
ORDER BY ORDINAL_POSITION;
