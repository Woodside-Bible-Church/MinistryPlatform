-- Check if Payment_Methods table exists and its structure
SELECT
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Payment_Methods'
ORDER BY ORDINAL_POSITION;

-- If it exists, show sample data
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Payment_Methods')
BEGIN
    SELECT TOP 10 * FROM Payment_Methods;
END
