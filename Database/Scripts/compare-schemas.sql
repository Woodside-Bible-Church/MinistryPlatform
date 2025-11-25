-- Schema Comparison Script
-- Compares two databases to identify custom tables, columns, and objects
--
-- Usage:
--   1. Update @SourceDB and @TargetDB variables
--   2. Run this script against the SQL Server
--   3. Review results to identify customizations
--
-- @SourceDB = Blank MinistryPlatform (base)
-- @TargetDB = Production MinistryPlatform (with customizations)

DECLARE @SourceDB NVARCHAR(128) = 'MinistryPlatform_Blank';  -- Update this
DECLARE @TargetDB NVARCHAR(128) = 'MinistryPlatform';        -- Update this

-- ========================================
-- PART 1: Custom Tables
-- Tables that exist in Target but not in Source
-- ========================================
PRINT '========================================';
PRINT 'CUSTOM TABLES (in Target, not in Source)';
PRINT '========================================';

DECLARE @CustomTables TABLE (
    TableName NVARCHAR(128),
    SchemaName NVARCHAR(128)
);

INSERT INTO @CustomTables
SELECT
    t.TABLE_NAME,
    t.TABLE_SCHEMA
FROM [$TargetDB].INFORMATION_SCHEMA.TABLES t
WHERE t.TABLE_TYPE = 'BASE TABLE'
  AND t.TABLE_SCHEMA = 'dbo'
  AND NOT EXISTS (
      SELECT 1
      FROM [$SourceDB].INFORMATION_SCHEMA.TABLES s
      WHERE s.TABLE_NAME = t.TABLE_NAME
        AND s.TABLE_SCHEMA = t.TABLE_SCHEMA
  )
ORDER BY t.TABLE_NAME;

SELECT
    TableName,
    SchemaName
FROM @CustomTables
ORDER BY TableName;

PRINT '';
PRINT 'Total Custom Tables: ' + CAST((SELECT COUNT(*) FROM @CustomTables) AS VARCHAR);
PRINT '';
PRINT '';

-- ========================================
-- PART 2: Custom Columns
-- Columns added to base tables
-- ========================================
PRINT '========================================';
PRINT 'CUSTOM COLUMNS (added to base tables)';
PRINT '========================================';

DECLARE @CustomColumns TABLE (
    TableName NVARCHAR(128),
    ColumnName NVARCHAR(128),
    DataType NVARCHAR(128),
    IsNullable VARCHAR(3),
    DefaultValue NVARCHAR(MAX)
);

INSERT INTO @CustomColumns
SELECT
    tc.TABLE_NAME,
    tc.COLUMN_NAME,
    tc.DATA_TYPE +
        CASE
            WHEN tc.CHARACTER_MAXIMUM_LENGTH IS NOT NULL
            THEN '(' + CAST(tc.CHARACTER_MAXIMUM_LENGTH AS VARCHAR) + ')'
            ELSE ''
        END AS DataType,
    tc.IS_NULLABLE,
    tc.COLUMN_DEFAULT
FROM [$TargetDB].INFORMATION_SCHEMA.COLUMNS tc
INNER JOIN [$TargetDB].INFORMATION_SCHEMA.TABLES tt
    ON tc.TABLE_NAME = tt.TABLE_NAME
    AND tc.TABLE_SCHEMA = tt.TABLE_SCHEMA
WHERE tt.TABLE_TYPE = 'BASE TABLE'
  AND tc.TABLE_SCHEMA = 'dbo'
  -- Table exists in both databases
  AND EXISTS (
      SELECT 1
      FROM [$SourceDB].INFORMATION_SCHEMA.TABLES st
      WHERE st.TABLE_NAME = tc.TABLE_NAME
        AND st.TABLE_SCHEMA = tc.TABLE_SCHEMA
  )
  -- But column doesn't exist in source
  AND NOT EXISTS (
      SELECT 1
      FROM [$SourceDB].INFORMATION_SCHEMA.COLUMNS sc
      WHERE sc.TABLE_NAME = tc.TABLE_NAME
        AND sc.COLUMN_NAME = tc.COLUMN_NAME
        AND sc.TABLE_SCHEMA = tc.TABLE_SCHEMA
  )
ORDER BY tc.TABLE_NAME, tc.COLUMN_NAME;

SELECT
    TableName,
    ColumnName,
    DataType,
    IsNullable,
    DefaultValue
FROM @CustomColumns
ORDER BY TableName, ColumnName;

PRINT '';
PRINT 'Total Custom Columns: ' + CAST((SELECT COUNT(*) FROM @CustomColumns) AS VARCHAR);
PRINT '';
PRINT '';

-- ========================================
-- PART 3: Custom Stored Procedures
-- Procedures that exist in Target but not in Source
-- ========================================
PRINT '========================================';
PRINT 'CUSTOM STORED PROCEDURES';
PRINT '========================================';

DECLARE @CustomProcs TABLE (
    ProcedureName NVARCHAR(128),
    SchemaName NVARCHAR(128),
    CreateDate DATETIME
);

INSERT INTO @CustomProcs
SELECT
    tr.ROUTINE_NAME,
    tr.ROUTINE_SCHEMA,
    tr.CREATED
FROM [$TargetDB].INFORMATION_SCHEMA.ROUTINES tr
WHERE tr.ROUTINE_TYPE = 'PROCEDURE'
  AND tr.ROUTINE_SCHEMA = 'dbo'
  AND NOT EXISTS (
      SELECT 1
      FROM [$SourceDB].INFORMATION_SCHEMA.ROUTINES sr
      WHERE sr.ROUTINE_NAME = tr.ROUTINE_NAME
        AND sr.ROUTINE_SCHEMA = tr.ROUTINE_SCHEMA
  )
ORDER BY tr.ROUTINE_NAME;

SELECT
    ProcedureName,
    SchemaName,
    CreateDate
FROM @CustomProcs
ORDER BY ProcedureName;

PRINT '';
PRINT 'Total Custom Procedures: ' + CAST((SELECT COUNT(*) FROM @CustomProcs) AS VARCHAR);
PRINT '';
PRINT '';

-- ========================================
-- PART 4: Custom Views
-- Views that exist in Target but not in Source
-- ========================================
PRINT '========================================';
PRINT 'CUSTOM VIEWS';
PRINT '========================================';

DECLARE @CustomViews TABLE (
    ViewName NVARCHAR(128),
    SchemaName NVARCHAR(128)
);

INSERT INTO @CustomViews
SELECT
    tv.TABLE_NAME,
    tv.TABLE_SCHEMA
FROM [$TargetDB].INFORMATION_SCHEMA.VIEWS tv
WHERE tv.TABLE_SCHEMA = 'dbo'
  AND NOT EXISTS (
      SELECT 1
      FROM [$SourceDB].INFORMATION_SCHEMA.VIEWS sv
      WHERE sv.TABLE_NAME = tv.TABLE_NAME
        AND sv.TABLE_SCHEMA = tv.TABLE_SCHEMA
  )
ORDER BY tv.TABLE_NAME;

SELECT
    ViewName,
    SchemaName
FROM @CustomViews
ORDER BY ViewName;

PRINT '';
PRINT 'Total Custom Views: ' + CAST((SELECT COUNT(*) FROM @CustomViews) AS VARCHAR);
PRINT '';
PRINT '';

-- ========================================
-- PART 5: Custom Functions
-- Functions that exist in Target but not in Source
-- ========================================
PRINT '========================================';
PRINT 'CUSTOM FUNCTIONS';
PRINT '========================================';

DECLARE @CustomFunctions TABLE (
    FunctionName NVARCHAR(128),
    SchemaName NVARCHAR(128),
    FunctionType NVARCHAR(60)
);

INSERT INTO @CustomFunctions
SELECT
    tr.ROUTINE_NAME,
    tr.ROUTINE_SCHEMA,
    tr.ROUTINE_TYPE
FROM [$TargetDB].INFORMATION_SCHEMA.ROUTINES tr
WHERE tr.ROUTINE_TYPE = 'FUNCTION'
  AND tr.ROUTINE_SCHEMA = 'dbo'
  AND NOT EXISTS (
      SELECT 1
      FROM [$SourceDB].INFORMATION_SCHEMA.ROUTINES sr
      WHERE sr.ROUTINE_NAME = tr.ROUTINE_NAME
        AND sr.ROUTINE_SCHEMA = tr.ROUTINE_SCHEMA
  )
ORDER BY tr.ROUTINE_NAME;

SELECT
    FunctionName,
    SchemaName,
    FunctionType
FROM @CustomFunctions
ORDER BY FunctionName;

PRINT '';
PRINT 'Total Custom Functions: ' + CAST((SELECT COUNT(*) FROM @CustomFunctions) AS VARCHAR);
PRINT '';
PRINT '';

-- ========================================
-- SUMMARY
-- ========================================
PRINT '========================================';
PRINT 'SUMMARY';
PRINT '========================================';
PRINT 'Custom Tables:      ' + CAST((SELECT COUNT(*) FROM @CustomTables) AS VARCHAR);
PRINT 'Custom Columns:     ' + CAST((SELECT COUNT(*) FROM @CustomColumns) AS VARCHAR);
PRINT 'Custom Procedures:  ' + CAST((SELECT COUNT(*) FROM @CustomProcs) AS VARCHAR);
PRINT 'Custom Views:       ' + CAST((SELECT COUNT(*) FROM @CustomViews) AS VARCHAR);
PRINT 'Custom Functions:   ' + CAST((SELECT COUNT(*) FROM @CustomFunctions) AS VARCHAR);
PRINT '========================================';
