-- Get the Domain_ID from the existing field in Form 2369
SELECT
    ff.Form_Field_ID,
    ff.Form_ID,
    ff.Domain_ID,
    ff.Field_Label
FROM Form_Fields ff
WHERE ff.Form_ID = 2369;

-- Also check the Form's Domain_ID
SELECT
    Form_ID,
    Form_Title,
    Domain_ID
FROM Forms
WHERE Form_ID = 2369;
