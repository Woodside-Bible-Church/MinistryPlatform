-- =============================================
-- Create Relationship_Types table and categorize relationships
-- This provides a flexible way to group relationships into categories
-- Date: 2025-11-11
-- =============================================

-- Step 1: Remove the Primary_Family column if it exists (including its default constraint)
IF EXISTS (
    SELECT * FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.Relationships')
    AND name = 'Primary_Family'
)
BEGIN
    -- Drop the default constraint first
    DECLARE @ConstraintName NVARCHAR(200);
    SELECT @ConstraintName = dc.name
    FROM sys.default_constraints dc
    INNER JOIN sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
    WHERE c.object_id = OBJECT_ID('dbo.Relationships')
    AND c.name = 'Primary_Family';

    IF @ConstraintName IS NOT NULL
    BEGIN
        DECLARE @SQL NVARCHAR(500) = 'ALTER TABLE dbo.Relationships DROP CONSTRAINT ' + @ConstraintName;
        EXEC sp_executesql @SQL;
        PRINT 'Dropped default constraint: ' + @ConstraintName;
    END

    -- Now drop the column
    ALTER TABLE dbo.Relationships
    DROP COLUMN Primary_Family;

    PRINT 'Removed Primary_Family column from Relationships table';
END
GO

-- Step 2: Create Relationship_Types table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Relationship_Types')
BEGIN
    CREATE TABLE dbo.Relationship_Types (
        Relationship_Type_ID INT IDENTITY(1,1) PRIMARY KEY,
        Relationship_Type_Name NVARCHAR(100) NOT NULL,
        Description NVARCHAR(500) NULL,
        Sort_Order INT NOT NULL DEFAULT 0,
        Domain_ID INT NOT NULL DEFAULT 1,
        CONSTRAINT UQ_Relationship_Type_Name UNIQUE (Relationship_Type_Name, Domain_ID)
    );

    PRINT 'Created Relationship_Types table';
END
GO

-- Step 3: Add Relationship_Type_ID to Relationships table
IF NOT EXISTS (
    SELECT * FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.Relationships')
    AND name = 'Relationship_Type_ID'
)
BEGIN
    ALTER TABLE dbo.Relationships
    ADD Relationship_Type_ID INT NULL;

    PRINT 'Added Relationship_Type_ID column to Relationships table';
END
GO

-- Step 4: Insert relationship type categories
SET IDENTITY_INSERT dbo.Relationship_Types ON;

INSERT INTO dbo.Relationship_Types (Relationship_Type_ID, Relationship_Type_Name, Description, Sort_Order, Domain_ID)
VALUES
    (1, 'Primary Family', 'Immediate family members (spouse, parents, children, siblings)', 1, 1),
    (2, 'Extended Family', 'Extended family members (grandparents, grandchildren, aunts, uncles, etc.)', 2, 1),
    (3, 'In-Laws', 'Family members by marriage', 3, 1),
    (4, 'Step & Foster', 'Step-family and foster family relationships', 4, 1),
    (5, 'Business & Professional', 'Business and professional relationships', 5, 1),
    (6, 'Emergency & Care', 'Emergency contacts and care relationships', 6, 1),
    (7, 'Other', 'Other relationships not categorized above', 99, 1);

SET IDENTITY_INSERT dbo.Relationship_Types OFF;

PRINT 'Inserted relationship type categories';
GO

-- Step 5: Categorize existing relationships
UPDATE dbo.Relationships SET Relationship_Type_ID = 1 -- Primary Family
WHERE Relationship_ID IN (
    1,   -- Married to (Husband/Wife)
    2,   -- Sibling of (Brother/Sister)
    5,   -- Child of (Son/Daughter)
    6    -- Parent of (Father/Mother)
);

UPDATE dbo.Relationships SET Relationship_Type_ID = 2 -- Extended Family
WHERE Relationship_ID IN (
    3,   -- Aunt/Uncle of
    4,   -- Niece/Nephew of
    12,  -- Grandparent of (Grandfather/Grandmother)
    13,  -- Grandchild of (Grandson/Granddaughter)
    18   -- Cousin of
);

UPDATE dbo.Relationships SET Relationship_Type_ID = 3 -- In-Laws
WHERE Relationship_ID IN (
    24,  -- Parent-in-Law (Father-in-Law/Mother-in-Law)
    25,  -- Child-in-Law (Son-in-Law/Daughter-in-Law)
    26   -- Sibling-in-Law (Brother-in-Law/Sister-in-Law)
);

UPDATE dbo.Relationships SET Relationship_Type_ID = 4 -- Step & Foster
WHERE Relationship_ID IN (
    21,  -- Foster Parent of (Foster Dad/Foster Mom)
    22,  -- Foster Child of (Foster Son/Foster Daughter)
    39,  -- Step-sibling of
    40,  -- Step-child of
    41,  -- Step-parent of
    42,  -- God-child of
    43   -- God-parent of
);

UPDATE dbo.Relationships SET Relationship_Type_ID = 5 -- Business & Professional
WHERE Relationship_ID IN (
    7,   -- Business Owner of
    8,   -- Business Owned by
    16,  -- Employer of
    23,  -- Employee of
    31   -- Co-Worker of
);

UPDATE dbo.Relationships SET Relationship_Type_ID = 6 -- Emergency & Care
WHERE Relationship_ID IN (
    46,  -- Adult Care Giver for
    47,  -- Adult Cared for by
    48,  -- Authorized to Pick Up
    49,  -- NOT Authorized to pick up
    50,  -- NOT Authorized to check in
    51,  -- Emergency Contact
    52   -- Emergency Contact For (Do not use)
);

UPDATE dbo.Relationships SET Relationship_Type_ID = 7 -- Other
WHERE Relationship_Type_ID IS NULL;

PRINT 'Categorized ' + CAST(@@ROWCOUNT AS VARCHAR(10)) + ' existing relationships';
GO

-- Step 6: Make Relationship_Type_ID NOT NULL after categorization
ALTER TABLE dbo.Relationships
ALTER COLUMN Relationship_Type_ID INT NOT NULL;

PRINT 'Made Relationship_Type_ID required on Relationships table';
GO

-- Step 7: Add foreign key constraint between Relationships and Relationship_Types
IF NOT EXISTS (
    SELECT * FROM sys.foreign_keys
    WHERE name = 'FK_Relationships_Relationship_Types'
)
BEGIN
    ALTER TABLE dbo.Relationships
    ADD CONSTRAINT FK_Relationships_Relationship_Types
    FOREIGN KEY (Relationship_Type_ID) REFERENCES dbo.Relationship_Types(Relationship_Type_ID);

    PRINT 'Added foreign key constraint between Relationships and Relationship_Types';
END
GO

-- Step 8: Add foreign key constraint between Relationship_Types and dp_Domains
IF NOT EXISTS (
    SELECT * FROM sys.foreign_keys
    WHERE name = 'FK_Relationship_Types_Domains'
)
BEGIN
    ALTER TABLE dbo.Relationship_Types
    ADD CONSTRAINT FK_Relationship_Types_Domains
    FOREIGN KEY (Domain_ID) REFERENCES dbo.dp_Domains(Domain_ID);

    PRINT 'Added foreign key constraint between Relationship_Types and dp_Domains';
END
GO

-- Step 9: Verify the results
SELECT
    RT.Relationship_Type_ID,
    RT.Relationship_Type_Name,
    RT.Sort_Order,
    COUNT(R.Relationship_ID) AS Relationship_Count
FROM dbo.Relationship_Types RT
    LEFT JOIN dbo.Relationships R ON R.Relationship_Type_ID = RT.Relationship_Type_ID
GROUP BY RT.Relationship_Type_ID, RT.Relationship_Type_Name, RT.Sort_Order
ORDER BY RT.Sort_Order;

PRINT '';
PRINT 'Sample relationships by type:';

SELECT
    RT.Relationship_Type_Name,
    R.Relationship_ID,
    R.Relationship_Name,
    R.Male_Label,
    R.Female_Label
FROM dbo.Relationships R
    INNER JOIN dbo.Relationship_Types RT ON RT.Relationship_Type_ID = R.Relationship_Type_ID
ORDER BY RT.Sort_Order, R.Relationship_Name;
GO
