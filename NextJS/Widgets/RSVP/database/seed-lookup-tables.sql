-- ===================================================================
-- Seed Lookup Tables for RSVP Widget
-- ===================================================================
-- Populates Question_Types and Card_Types with all available options
-- Run this AFTER create-rsvp-schema.sql
-- ===================================================================

USE [MinistryPlatform]
GO

-- ===================================================================
-- SEED Question_Types
-- ===================================================================

SET IDENTITY_INSERT [dbo].[Question_Types] ON;

MERGE INTO [dbo].[Question_Types] AS target
USING (VALUES
    (1, 'Counter', 'CounterQuestion', 'Numeric counter with +/- buttons', 0),
    (2, 'Checkbox', 'CheckboxQuestion', 'Single yes/no checkbox', 0),
    (3, 'Text', 'TextQuestion', 'Short text input', 0),
    (4, 'Textarea', 'TextareaQuestion', 'Long text area', 0),
    (5, 'Dropdown', 'DropdownQuestion', 'Select from dropdown list', 1),
    (6, 'Radio', 'RadioQuestion', 'Radio button group', 1),
    (7, 'Multi-Checkbox', 'MultiCheckboxQuestion', 'Multiple checkboxes', 1),
    (8, 'Date', 'DateQuestion', 'Date picker', 0),
    (9, 'Time', 'TimeQuestion', 'Time picker', 0),
    (10, 'Email', 'EmailQuestion', 'Email input with validation', 0),
    (11, 'Phone', 'PhoneQuestion', 'Phone number with formatting', 0),
    (12, 'Searchable Dropdown', 'SearchableDropdownQuestion', 'Combobox with search/filter', 1),
    (13, 'Multi-Select Dropdown', 'MultiSelectDropdownQuestion', 'Multi-select with search', 1),
    (14, 'Tag Input', 'TagInputQuestion', 'Free-text tag input', 0),
    (15, 'Button Group', 'ButtonGroupQuestion', 'Segmented button selection', 1),
    (16, 'Multi-Button Group', 'MultiButtonGroupQuestion', 'Multiple toggle buttons', 1),
    (17, 'Slider', 'SliderQuestion', 'Range slider', 0),
    (18, 'Rating', 'RatingQuestion', 'Star rating', 0),
    (19, 'File Upload', 'FileUploadQuestion', 'File/image upload', 0),
    (20, 'Color Picker', 'ColorPickerQuestion', 'Color selection', 0)
) AS source (Question_Type_ID, Question_Type_Name, Component_Name, Description, Requires_Options)
ON target.Question_Type_ID = source.Question_Type_ID
WHEN MATCHED THEN
    UPDATE SET
        Question_Type_Name = source.Question_Type_Name,
        Component_Name = source.Component_Name,
        Description = source.Description,
        Requires_Options = source.Requires_Options
WHEN NOT MATCHED THEN
    INSERT (Question_Type_ID, Question_Type_Name, Component_Name, Description, Requires_Options)
    VALUES (source.Question_Type_ID, source.Question_Type_Name, source.Component_Name, source.Description, source.Requires_Options);

SET IDENTITY_INSERT [dbo].[Question_Types] OFF;

PRINT 'Seeded Question_Types with 20 question types';
GO

-- ===================================================================
-- SEED Card_Types
-- ===================================================================

SET IDENTITY_INSERT [dbo].[Card_Types] ON;

MERGE INTO [dbo].[Card_Types] AS target
USING (VALUES
    (1, 'Instructions', 'InstructionsCard', 'Info', 'What to expect / event details', '{"title":"What to Expect","bullets":[]}', 0),
    (2, 'Map', 'MapCard', 'Map', 'Location map with directions link', '{"title":"Location","showDirectionsLink":true}', 1),
    (3, 'QR Code', 'QRCodeCard', 'QrCode', 'Check-in QR code', '{"title":"Check-In Code","description":"Show this code when you arrive"}', 0),
    (4, 'Share', 'ShareCard', 'Share2', 'Share event with friends', '{"title":"Invite a Friend","enabledMethods":["sms","email"]}', 0),
    (5, 'Add to Calendar', 'AddToCalendarCard', 'Calendar', 'Add event to calendar', '{"title":"Save the Date","providers":["google","apple","outlook"]}', 0),
    (6, 'Parking', 'ParkingCard', 'ParkingCircle', 'Parking information', '{"title":"Parking Information","description":""}', 1),
    (7, 'Childcare', 'ChildcareCard', 'Baby', 'Childcare availability', '{"title":"Childcare Available","description":""}', 1),
    (8, 'Contact Info', 'ContactInfoCard', 'Phone', 'Contact information for questions', '{"title":"Questions?","phone":"","email":""}', 1),
    (9, 'Schedule', 'ScheduleCard', 'Clock', 'Event schedule/timeline', '{"title":"Schedule","timelineItems":[]}', 1),
    (10, 'Weather', 'WeatherCard', 'Cloud', 'Weather forecast', '{"title":"Weather Forecast"}', 0),
    (11, 'What to Bring', 'WhatToBringCard', 'Backpack', 'Items to bring', '{"title":"What to Bring","items":[]}', 1),
    (12, 'Group Assignment', 'GroupAssignmentCard', 'Users', 'Group/team assignment', '{"title":"Your Group"}', 0)
) AS source (Card_Type_ID, Card_Type_Name, Component_Name, Icon_Name, Description, Default_Configuration, Requires_Configuration)
ON target.Card_Type_ID = source.Card_Type_ID
WHEN MATCHED THEN
    UPDATE SET
        Card_Type_Name = source.Card_Type_Name,
        Component_Name = source.Component_Name,
        Icon_Name = source.Icon_Name,
        Description = source.Description,
        Default_Configuration = source.Default_Configuration,
        Requires_Configuration = source.Requires_Configuration
WHEN NOT MATCHED THEN
    INSERT (Card_Type_ID, Card_Type_Name, Component_Name, Icon_Name, Description, Default_Configuration, Requires_Configuration)
    VALUES (source.Card_Type_ID, source.Card_Type_Name, source.Component_Name, source.Icon_Name, source.Description, source.Default_Configuration, source.Requires_Configuration);

SET IDENTITY_INSERT [dbo].[Card_Types] OFF;

PRINT 'Seeded Card_Types with 12 card types';
GO

PRINT '';
PRINT '===================================================================';
PRINT 'Lookup tables seeded successfully!';
PRINT '';
PRINT 'Question Types Available:';
PRINT '  1. Counter - Numeric +/- buttons';
PRINT '  2. Checkbox - Yes/no checkbox';
PRINT '  3-20. Various input types (text, dropdown, date, etc.)';
PRINT '';
PRINT 'Card Types Available:';
PRINT '  1. Instructions - What to expect';
PRINT '  2. Map - Directions';
PRINT '  3. QR Code - Check-in code';
PRINT '  4-12. Various card types (share, calendar, parking, etc.)';
PRINT '';
PRINT 'Next step: Run seed-christmas-example.sql to create sample RSVP';
PRINT '===================================================================';
GO
