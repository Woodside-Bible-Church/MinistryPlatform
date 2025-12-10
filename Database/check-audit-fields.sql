-- Check which budget tables have audit fields

USE MinistryPlatform;
GO

DECLARE @tables TABLE (TableName NVARCHAR(255));
INSERT INTO @tables VALUES
    ('Project_Budget_Categories'),
    ('Project_Budget_Expense_Line_Items'),
    ('Project_Budget_Income_Line_Items'),
    ('Project_Budget_Transactions'),
    ('Project_Budget_Statuses'),
    ('Project_Budget_Payment_Methods');

SELECT
    t.TableName,
    c.COLUMN_NAME
FROM @tables t
CROSS APPLY (
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = t.TableName
        AND COLUMN_NAME IN ('Created_By_User_ID', 'Created_Date', 'Modified_By_User_ID', 'Modified_Date')
) c
ORDER BY t.TableName, c.COLUMN_NAME;

GO
