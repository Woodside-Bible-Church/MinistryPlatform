-- Verify the "Number of Kids" field is in Form #2369 (Christmas 2025 RSVP)
SELECT
    ff.Form_Field_ID,
    ff.Form_ID,
    f.Form_Title,
    ff.Field_Order,
    ff.Field_Label,
    ff.Alternate_Label,
    fft.Field_Type AS MP_Fallback_Type,
    ff.Required,
    ff.Custom_Field_Configuration
FROM Form_Fields ff
INNER JOIN Forms f ON ff.Form_ID = f.Form_ID
INNER JOIN Form_Field_Types fft ON ff.Field_Type_ID = fft.Form_Field_Type_ID
WHERE ff.Form_ID = 2369
ORDER BY ff.Field_Order ASC;
