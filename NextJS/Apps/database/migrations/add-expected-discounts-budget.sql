-- Add Expected_Discounts_Budget field to Projects table
-- This field stores the budgeted amount for registration discounts/scholarships

IF NOT EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.Projects')
    AND name = 'Expected_Discounts_Budget'
)
BEGIN
    ALTER TABLE dbo.Projects
    ADD Expected_Discounts_Budget DECIMAL(18,2) NULL;

    PRINT 'Expected_Discounts_Budget column added to Projects table';
END
ELSE
BEGIN
    PRINT 'Expected_Discounts_Budget column already exists';
END
GO
