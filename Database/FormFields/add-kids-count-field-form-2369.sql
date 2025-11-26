-- ===================================================================
-- Add "Number of Kids" Form Field to Christmas 2025 RSVP
-- ===================================================================
-- Form ID: 2369 (Christmas 2025 RSVP) - CORRECT FORM
-- This adds a counter field asking how many of the attendees are kids
-- Field Order: 1 (first question after implicit "How many people?" at order 0)
-- ===================================================================

USE [MinistryPlatform]
GO

-- ===================================================================
-- Step 1: Verify Form exists
-- ===================================================================
IF NOT EXISTS (SELECT 1 FROM Forms WHERE Form_ID = 2369)
BEGIN
    PRINT 'ERROR: Form #2369 does not exist!'
    RETURN;
END

PRINT 'Form #2369 found - proceeding with field addition...'
PRINT ''

-- ===================================================================
-- Step 2: Check if field already exists at Field_Order = 1
-- ===================================================================
IF EXISTS (
    SELECT 1 FROM Form_Fields
    WHERE Form_ID = 2369
    AND Field_Label = 'Number of Kids'
)
BEGIN
    PRINT 'WARNING: A field with label "Number of Kids" already exists for Form #2369'
    PRINT 'Skipping insertion to avoid duplicates.'
    RETURN;
END

-- ===================================================================
-- Step 3: Get the Field_Type_ID for "Text Field" (Counter fallback)
-- ===================================================================
DECLARE @FieldTypeID INT;

SELECT @FieldTypeID = Form_Field_Type_ID
FROM Form_Field_Types
WHERE Field_Type = 'Text Field';

IF @FieldTypeID IS NULL
BEGIN
    PRINT 'ERROR: Could not find Field_Type_ID for "Text Field"'
    RETURN;
END

PRINT 'Field_Type_ID for "Text Field": ' + CAST(@FieldTypeID AS VARCHAR(10))
PRINT ''

-- ===================================================================
-- Step 4: Insert "Number of Kids" form field
-- ===================================================================
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
    2369,                           -- Form_ID: Christmas 2025 RSVP (CORRECT)
    1,                              -- Field_Order: First question after party size (which is 0)
    'Number of Kids',               -- Field_Label: Simple, straightforward
    'How many of those are kids?',  -- Alternate_Label: Nice conversational tone
    @FieldTypeID,                   -- Field_Type_ID: Text Field (fallback for Counter)
    0,                              -- Required: False (optional question)
    '{
  "component": "Counter",
  "min_value": 0,
  "max_value": 99,
  "default_value": 0,
  "step": 1,
  "icon": "Baby",
  "helper_text": "Let us know how many children will be attending"
}'                                  -- Custom_Field_Configuration: Counter component config
);

PRINT '✓ Successfully added "Number of Kids" field to Form #2369'
PRINT ''

-- ===================================================================
-- Step 5: Verify insertion
-- ===================================================================
SELECT
    ff.Form_Field_ID,
    ff.Form_ID,
    f.Form_Title,
    ff.Field_Order,
    ff.Field_Label,
    ff.Alternate_Label,
    fft.Field_Type AS Field_Type_Fallback,
    ff.Required,
    ff.Custom_Field_Configuration
FROM Form_Fields ff
INNER JOIN Forms f ON ff.Form_ID = f.Form_ID
INNER JOIN Form_Field_Types fft ON ff.Field_Type_ID = fft.Form_Field_Type_ID
WHERE ff.Form_ID = 2369
ORDER BY ff.Field_Order ASC;

PRINT ''
PRINT '========================================'
PRINT 'Migration Complete!'
PRINT '========================================'
PRINT ''
PRINT 'Summary:'
PRINT '  - Form ID: 2369'
PRINT '  - Field Order: 1'
PRINT '  - Field Label: "Number of Kids"'
PRINT '  - Alternate Label: "How many of those are kids?"'
PRINT '  - Component: Counter'
PRINT '  - Min Value: 0'
PRINT '  - Max Value: 99'
PRINT '  - Icon: Baby (lucide-react icon)'
PRINT '  - Required: No (optional)'
PRINT ''
PRINT 'The RSVP widget will now display this question immediately after'
PRINT 'the "How many people?" counter on step 2 of the form.'
PRINT ''

GO
