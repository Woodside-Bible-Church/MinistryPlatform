-- Check if the "Number of Kids" field exists anywhere
SELECT
    ff.Form_Field_ID,
    ff.Form_ID,
    f.Form_Title,
    ff.Field_Order,
    ff.Field_Label,
    ff.Alternate_Label
FROM Form_Fields ff
LEFT JOIN Forms f ON ff.Form_ID = f.Form_ID
WHERE ff.Field_Label = 'Number of Kids'
   OR ff.Alternate_Label LIKE '%kids%'
   OR ff.Alternate_Label LIKE '%children%';

PRINT '';
PRINT 'Attempting to insert again with error handling...';
PRINT '';

-- Try to insert with explicit error handling
BEGIN TRY
    DECLARE @FieldTypeID INT;

    SELECT @FieldTypeID = Form_Field_Type_ID
    FROM Form_Field_Types
    WHERE Field_Type = 'Text Field';

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
        2369,
        1,
        'Number of Kids',
        'How many of those are kids?',
        @FieldTypeID,
        0,
        '{"component":"Counter","min_value":0,"max_value":99,"default_value":0,"step":1,"icon":"Baby","helper_text":"Let us know how many children will be attending"}'
    );

    PRINT '✓ INSERT successful!';
END TRY
BEGIN CATCH
    PRINT '✗ INSERT failed with error:';
    PRINT ERROR_MESSAGE();
END CATCH;
