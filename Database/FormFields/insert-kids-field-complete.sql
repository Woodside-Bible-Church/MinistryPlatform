-- Add "Number of Kids" to Form #2369 (COMPLETE VERSION)
USE [MinistryPlatform]
GO

-- Check if field already exists
IF EXISTS (SELECT 1 FROM Form_Fields WHERE Form_ID = 2369 AND Field_Label = 'Number of Kids')
BEGIN
    PRINT 'Field "Number of Kids" already exists in Form 2369';
    SELECT Form_Field_ID, Field_Order, Field_Label, Alternate_Label
    FROM Form_Fields
    WHERE Form_ID = 2369 AND Field_Label = 'Number of Kids';
END
ELSE
BEGIN
    -- Insert the field with all required columns
    INSERT INTO Form_Fields (
        Domain_ID,
        Form_ID,
        Field_Order,
        Field_Label,
        Alternate_Label,
        Field_Type_ID,
        Required,
        Custom_Field_Configuration
    )
    VALUES (
        1,                              -- Domain_ID (from existing field)
        2369,                           -- Form_ID: Christmas 2025 RSVP
        1,                              -- Field_Order: First question after party size
        'Number of Kids',               -- Field_Label
        'How many of those are kids?',  -- Alternate_Label
        1,                              -- Field_Type_ID: Text Box
        0,                              -- Required: False
        '{"component":"Counter","min_value":0,"max_value":99,"default_value":0,"step":1,"icon":"Baby","helper_text":"Let us know how many children will be attending"}'
    );

    PRINT '✓ Successfully added "Number of Kids" field to Form #2369';
END

-- Show all fields in Form 2369
PRINT '';
PRINT 'All fields in Form #2369:';
SELECT
    ff.Form_Field_ID,
    ff.Field_Order,
    ff.Field_Label,
    ff.Alternate_Label,
    ff.Required
FROM Form_Fields ff
WHERE ff.Form_ID = 2369
ORDER BY ff.Field_Order ASC;
