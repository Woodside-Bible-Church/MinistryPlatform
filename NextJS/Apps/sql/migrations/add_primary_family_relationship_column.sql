-- =============================================
-- Add Primary_Family column to Relationships table
-- This helps filter the dropdown to show only common family relationships
-- Date: 2025-11-11
-- =============================================

-- Add the column
IF NOT EXISTS (
    SELECT * FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.Relationships')
    AND name = 'Primary_Family'
)
BEGIN
    ALTER TABLE dbo.Relationships
    ADD Primary_Family BIT NOT NULL DEFAULT 0;

    PRINT 'Added Primary_Family column to Relationships table';
END
ELSE
BEGIN
    PRINT 'Primary_Family column already exists';
END
GO

-- Update primary family relationships
UPDATE dbo.Relationships
SET Primary_Family = 1
WHERE Relationship_ID IN (
    1,   -- Married to (Husband/Wife)
    2,   -- Sibling of (Brother/Sister)
    5,   -- Child of (Son/Daughter)
    6,   -- Parent of (Father/Mother)
    12,  -- Grandparent of (Grandfather/Grandmother)
    13,  -- Grandchild of (Grandson/Granddaughter)
    21,  -- Foster Parent of (Foster Dad/Foster Mom)
    22,  -- Foster Child of (Foster Son/Foster Daughter)
    24,  -- Parent-in-Law (Father-in-Law/Mother-in-Law)
    25,  -- Child-in-Law (Son-in-Law/Daughter-in-Law)
    26   -- Sibling-in-Law (Brother-in-Law/Sister-in-Law)
);

PRINT 'Updated ' + CAST(@@ROWCOUNT AS VARCHAR(10)) + ' relationships as primary family relationships';
GO

-- Verify the update
SELECT
    Relationship_ID,
    Relationship_Name,
    Male_Label,
    Female_Label,
    Primary_Family
FROM dbo.Relationships
WHERE Primary_Family = 1
ORDER BY Relationship_ID;
GO
