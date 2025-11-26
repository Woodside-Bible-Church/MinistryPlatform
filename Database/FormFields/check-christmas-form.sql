-- Check which form is linked to the Christmas RSVP project
SELECT
    p.Project_ID,
    p.Project_Title,
    p.RSVP_Title,
    p.RSVP_Slug,
    p.Form_ID,
    f.Form_Title
FROM Projects p
LEFT JOIN Forms f ON p.Form_ID = f.Form_ID
WHERE p.RSVP_Slug = 'christmas-2025'
   OR p.Project_Title LIKE '%Christmas%'
   OR p.RSVP_Title LIKE '%Christmas%'
ORDER BY p.Project_ID DESC;

PRINT '';
PRINT 'Current fields for Form #2349:';

-- Show what fields exist for Form #2349
SELECT
    ff.Form_Field_ID,
    ff.Field_Order,
    ff.Field_Label,
    ff.Alternate_Label,
    ff.Required
FROM Form_Fields ff
WHERE ff.Form_ID = 2349
ORDER BY ff.Field_Order ASC;
