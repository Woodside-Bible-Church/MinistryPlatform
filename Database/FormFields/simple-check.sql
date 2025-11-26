-- Simple check: Does "Number of Kids" field exist in Form 2369?
SELECT COUNT(*) AS FieldCount
FROM Form_Fields
WHERE Form_ID = 2369
AND Field_Label = 'Number of Kids';

-- If it exists, show it
IF EXISTS (SELECT 1 FROM Form_Fields WHERE Form_ID = 2369 AND Field_Label = 'Number of Kids')
BEGIN
    PRINT 'Field EXISTS in Form 2369';
    SELECT Form_Field_ID, Field_Order, Field_Label, Alternate_Label
    FROM Form_Fields
    WHERE Form_ID = 2369 AND Field_Label = 'Number of Kids';
END
ELSE
BEGIN
    PRINT 'Field DOES NOT EXIST in Form 2369';
    PRINT 'Attempting INSERT now...';

    DECLARE @FieldTypeID INT;
    SELECT @FieldTypeID = Form_Field_Type_ID FROM Form_Field_Types WHERE Field_Type = 'Text Field';

    INSERT INTO Form_Fields (Form_ID, Field_Order, Field_Label, Alternate_Label, Field_Type_ID, Required, Custom_Field_Configuration)
    VALUES (2369, 1, 'Number of Kids', 'How many of those are kids?', @FieldTypeID, 0,
            '{"component":"Counter","min_value":0,"max_value":99,"default_value":0,"step":1,"icon":"Baby","helper_text":"Let us know how many children will be attending"}');

    PRINT 'INSERT complete. Checking again...';
    SELECT Form_Field_ID, Field_Order, Field_Label FROM Form_Fields WHERE Form_ID = 2369 AND Field_Label = 'Number of Kids';
END
