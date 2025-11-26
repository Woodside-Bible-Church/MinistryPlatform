-- Check if we accidentally added the field to Form 2349
SELECT
    ff.Form_Field_ID,
    ff.Form_ID,
    f.Form_Title,
    ff.Field_Label,
    ff.Alternate_Label
FROM Form_Fields ff
INNER JOIN Forms f ON ff.Form_ID = f.Form_ID
WHERE ff.Form_ID = 2349
AND ff.Field_Label = 'Number of Kids';

-- If it exists in 2349, delete it
IF EXISTS (SELECT 1 FROM Form_Fields WHERE Form_ID = 2349 AND Field_Label = 'Number of Kids')
BEGIN
    DELETE FROM Form_Fields
    WHERE Form_ID = 2349
    AND Field_Label = 'Number of Kids';

    PRINT '✓ Removed "Number of Kids" from incorrect Form #2349';
END
ELSE
BEGIN
    PRINT '✓ Form #2349 is clean (field was never added there)';
END
