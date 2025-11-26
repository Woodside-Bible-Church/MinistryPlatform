-- Add "Number of Kids" to Form #2369 (FIXED)
USE [MinistryPlatform]
GO

DECLARE @FieldTypeID INT;

-- Get the correct Field_Type_ID for "Text Box"
SELECT @FieldTypeID = Form_Field_Type_ID
FROM Form_Field_Types
WHERE Field_Type = 'Text Box';

PRINT 'Field_Type_ID for "Text Box": ' + CAST(@FieldTypeID AS VARCHAR(10));

-- Check if field already exists
IF EXISTS (SELECT 1 FROM Form_Fields WHERE Form_ID = 2369 AND Field_Label = 'Number of Kids')
BEGIN
    PRINT 'Field already exists in Form 2369';
END
ELSE
BEGIN
    -- Insert the field
    INSERT INTO Form_Fields (
        Form_ID,
        Field_Order,
        Field_Label,
        Alternate_Label,
        Field_Type_ID,
        Required,
        Custom_Field_Configuration
    )
    VALUES (
        2369,                           -- Form_ID: Christmas 2025 RSVP
        1,                              -- Field_Order: First question after party size
        'Number of Kids',               -- Field_Label
        'How many of those are kids?',  -- Alternate_Label
        @FieldTypeID,                   -- Field_Type_ID: Text Box (ID = 1)
        0,                              -- Required: False
        '{"component":"Counter","min_value":0,"max_value":99,"default_value":0,"step":1,"icon":"Baby","helper_text":"Let us know how many children will be attending"}'
    );

    PRINT '✓ Successfully added "Number of Kids" field to Form #2369';
END

-- Verify it was added
SELECT
    ff.Form_Field_ID,
    ff.Form_ID,
    ff.Field_Order,
    ff.Field_Label,
    ff.Alternate_Label,
    ff.Required
FROM Form_Fields ff
WHERE ff.Form_ID = 2369
ORDER BY ff.Field_Order ASC;
