-- =============================================
-- Remove Expected_Participant_Count from Projects
-- Author: Claude Code
-- Date: 2025-12-09
-- Description: Removes Expected_Participant_Count field - can be derived from Events.Participants_Expected if needed
-- =============================================

USE [MinistryPlatform]
GO

PRINT 'Removing Expected_Participant_Count from Projects...'

-- Remove field management entry
IF EXISTS (SELECT 1 FROM dp_Page_Fields WHERE Page_ID = 957 AND Field_Name = 'Expected_Participant_Count')
BEGIN
    DELETE FROM dp_Page_Fields WHERE Page_ID = 957 AND Field_Name = 'Expected_Participant_Count';
    PRINT 'Field management entry removed for Expected_Participant_Count.'
END
ELSE
    PRINT 'Field management entry for Expected_Participant_Count does not exist.'

-- Remove column from Projects table
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Projects') AND name = 'Expected_Participant_Count')
BEGIN
    ALTER TABLE dbo.Projects DROP COLUMN Expected_Participant_Count;
    PRINT 'Expected_Participant_Count column removed from Projects table.'
END
ELSE
    PRINT 'Expected_Participant_Count column does not exist in Projects table.'

PRINT 'Expected_Participant_Count removal complete.'
GO
