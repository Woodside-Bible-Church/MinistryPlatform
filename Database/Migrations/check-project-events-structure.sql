-- Quick script to check Project_Events table structure
SELECT
    c.name AS ColumnName,
    t.name AS DataType,
    c.max_length AS MaxLength,
    c.is_nullable AS IsNullable
FROM sys.columns c
INNER JOIN sys.types t ON c.user_type_id = t.user_type_id
WHERE c.object_id = OBJECT_ID('Project_Events')
ORDER BY c.column_id

-- Also show a sample row
PRINT ''
PRINT 'Sample data from Project_Events:'
SELECT TOP 1 * FROM Project_Events
