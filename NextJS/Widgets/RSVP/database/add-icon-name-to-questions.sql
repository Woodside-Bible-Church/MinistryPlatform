-- ===================================================================
-- Add Icon_Name field to Project_RSVP_Questions table
-- ===================================================================
-- This adds support for displaying icons next to questions in the RSVP form
-- Icons should be Lucide icon names (e.g., "Users", "Calendar", "Mail")
-- ===================================================================

USE [MinistryPlatform]
GO

-- Add Icon_Name column if it doesn't exist
IF NOT EXISTS (
    SELECT * FROM sys.columns
    WHERE object_id = OBJECT_ID(N'[dbo].[Project_RSVP_Questions]')
    AND name = 'Icon_Name'
)
BEGIN
    ALTER TABLE [dbo].[Project_RSVP_Questions]
    ADD [Icon_Name] NVARCHAR(50) NULL;

    PRINT 'Added Icon_Name column to Project_RSVP_Questions table';
END
ELSE
BEGIN
    PRINT 'Icon_Name column already exists in Project_RSVP_Questions table';
END
GO

-- Update existing questions with default icons based on question text patterns
-- This is optional - you can manually set icons via the MinistryPlatform UI

-- Party size / attendance questions
UPDATE [dbo].[Project_RSVP_Questions]
SET [Icon_Name] = 'Users'
WHERE [Icon_Name] IS NULL
  AND ([Question_Text] LIKE '%how many%'
       OR [Question_Text] LIKE '%party size%'
       OR [Question_Text] LIKE '%number of%people%');

-- First visit / new visitor questions
UPDATE [dbo].[Project_RSVP_Questions]
SET [Icon_Name] = 'Sparkles'
WHERE [Icon_Name] IS NULL
  AND ([Question_Text] LIKE '%first%visit%'
       OR [Question_Text] LIKE '%new%visitor%'
       OR [Question_Text] LIKE '%first%time%');

-- Date questions
UPDATE [dbo].[Project_RSVP_Questions]
SET [Icon_Name] = 'Calendar'
WHERE [Icon_Name] IS NULL
  AND [Question_Type_ID] = (SELECT Question_Type_ID FROM Question_Types WHERE Question_Type_Name = 'Date');

-- Email questions
UPDATE [dbo].[Project_RSVP_Questions]
SET [Icon_Name] = 'Mail'
WHERE [Icon_Name] IS NULL
  AND [Question_Type_ID] = (SELECT Question_Type_ID FROM Question_Types WHERE Question_Type_Name = 'Email');

-- Phone questions
UPDATE [dbo].[Project_RSVP_Questions]
SET [Icon_Name] = 'Phone'
WHERE [Icon_Name] IS NULL
  AND [Question_Type_ID] = (SELECT Question_Type_ID FROM Question_Types WHERE Question_Type_Name = 'Phone');

PRINT 'Applied default icons to existing questions based on patterns';
GO

-- ===================================================================
-- USAGE NOTES
-- ===================================================================
--
-- After running this script, you can set icons for questions via:
-- 1. MinistryPlatform UI: Navigate to Project RSVP Questions and edit Icon_Name field
-- 2. Direct SQL: UPDATE Project_RSVP_Questions SET Icon_Name = 'Users' WHERE Project_RSVP_Question_ID = 1
--
-- Recommended Lucide Icons for common question types:
-- - Users: Party size, attendee count
-- - Sparkles: First visit, new visitor
-- - Calendar: Date selection
-- - Clock: Time selection
-- - Mail: Email address
-- - Phone: Phone number
-- - MapPin: Location/address
-- - MessageSquare: Comments, notes, textarea
-- - CheckCircle: Yes/No, checkboxes
-- - List: Dropdowns, selections
-- - Tag: Tags, categories
-- - Star: Rating, favorites
-- - FileText: File upload, documents
-- - HelpCircle: General questions (default fallback)
--
-- ===================================================================
