-- Add Expected_Discounts_Budget to Field Management in the "3. Budget" section

-- First, find the Page_Section_ID for the Budget section on the Projects page
DECLARE @PageSectionID INT;
DECLARE @FieldID INT;
DECLARE @PageID INT;

-- Get the Projects page ID
SELECT @PageID = Page_ID
FROM dp_Pages
WHERE Table_Name = 'Projects';

-- Get the Budget section ID
SELECT @PageSectionID = Page_Section_ID
FROM dp_Page_Sections
WHERE Page_ID = @PageID
  AND Section_Title = '3. Budget';

-- Get the Field_ID for Expected_Discounts_Budget
SELECT @FieldID = Field_ID
FROM dp_Page_Section_Fields psf
INNER JOIN INFORMATION_SCHEMA.COLUMNS c ON psf.Field_Name = c.COLUMN_NAME
WHERE c.TABLE_NAME = 'Projects'
  AND c.COLUMN_NAME = 'Expected_Discounts_Budget';

-- If the field doesn't exist in Field Management yet, we need to determine the Field_ID
-- MinistryPlatform assigns Field_IDs based on the column's ordinal position
IF @FieldID IS NULL
BEGIN
    SELECT @FieldID = COLUMNPROPERTY(OBJECT_ID('dbo.Projects'), 'Expected_Discounts_Budget', 'ColumnId');
END

-- Check if the field already exists in the Budget section
IF NOT EXISTS (
    SELECT 1
    FROM dp_Page_Section_Fields
    WHERE Page_Section_ID = @PageSectionID
      AND Field_Name = 'Expected_Discounts_Budget'
)
BEGIN
    -- Get the max Field_Order in the Budget section
    DECLARE @MaxFieldOrder INT;
    SELECT @MaxFieldOrder = ISNULL(MAX(Field_Order), 0)
    FROM dp_Page_Section_Fields
    WHERE Page_Section_ID = @PageSectionID;

    -- Insert the field into Field Management
    INSERT INTO dp_Page_Section_Fields (
        Page_Section_ID,
        Field_ID,
        Field_Order,
        Field_Name,
        Field_Label,
        Required,
        Field_Type_ID, -- 2 = Currency
        Domain_ID
    )
    VALUES (
        @PageSectionID,
        @FieldID,
        @MaxFieldOrder + 1,
        'Expected_Discounts_Budget',
        'Expected Discounts Budget',
        0, -- Not required
        2, -- Currency field type
        1  -- Default domain
    );

    PRINT 'Expected_Discounts_Budget added to Field Management in Budget section';
END
ELSE
BEGIN
    PRINT 'Expected_Discounts_Budget already exists in Field Management';
END
GO
