-- ===================================================================
-- Add RSVP Pages to Page Section
-- ===================================================================
-- Adds all RSVP pages to the specified page section
-- Page Section ID: 73 (adjust if needed)
-- Page IDs from screenshot: 963-970
-- ===================================================================

USE [MinistryPlatform]
GO

DECLARE @PageSectionID INT = 73;  -- Your custom page section

-- ===================================================================
-- Add pages to section
-- ===================================================================

-- Question Types (Page ID: 963)
IF NOT EXISTS (SELECT 1 FROM [dbo].[dp_Page_Section_Pages] WHERE [Page_ID] = 963 AND [Page_Section_ID] = @PageSectionID)
BEGIN
    INSERT INTO [dbo].[dp_Page_Section_Pages] ([Page_ID], [Page_Section_ID])
    VALUES (963, @PageSectionID);
    PRINT 'Added Question Types (963) to Page Section ' + CAST(@PageSectionID AS NVARCHAR);
END

-- Card Types (Page ID: 964)
IF NOT EXISTS (SELECT 1 FROM [dbo].[dp_Page_Section_Pages] WHERE [Page_ID] = 964 AND [Page_Section_ID] = @PageSectionID)
BEGIN
    INSERT INTO [dbo].[dp_Page_Section_Pages] ([Page_ID], [Page_Section_ID])
    VALUES (964, @PageSectionID);
    PRINT 'Added Card Types (964) to Page Section ' + CAST(@PageSectionID AS NVARCHAR);
END

-- Project RSVPs (Page ID: 965)
IF NOT EXISTS (SELECT 1 FROM [dbo].[dp_Page_Section_Pages] WHERE [Page_ID] = 965 AND [Page_Section_ID] = @PageSectionID)
BEGIN
    INSERT INTO [dbo].[dp_Page_Section_Pages] ([Page_ID], [Page_Section_ID])
    VALUES (965, @PageSectionID);
    PRINT 'Added Project RSVPs (965) to Page Section ' + CAST(@PageSectionID AS NVARCHAR);
END

-- Project RSVP Questions (Page ID: 966)
IF NOT EXISTS (SELECT 1 FROM [dbo].[dp_Page_Section_Pages] WHERE [Page_ID] = 966 AND [Page_Section_ID] = @PageSectionID)
BEGIN
    INSERT INTO [dbo].[dp_Page_Section_Pages] ([Page_ID], [Page_Section_ID])
    VALUES (966, @PageSectionID);
    PRINT 'Added Project RSVP Questions (966) to Page Section ' + CAST(@PageSectionID AS NVARCHAR);
END

-- Question Options (Page ID: 967)
IF NOT EXISTS (SELECT 1 FROM [dbo].[dp_Page_Section_Pages] WHERE [Page_ID] = 967 AND [Page_Section_ID] = @PageSectionID)
BEGIN
    INSERT INTO [dbo].[dp_Page_Section_Pages] ([Page_ID], [Page_Section_ID])
    VALUES (967, @PageSectionID);
    PRINT 'Added Question Options (967) to Page Section ' + CAST(@PageSectionID AS NVARCHAR);
END

-- Project Confirmation Cards (Page ID: 968)
IF NOT EXISTS (SELECT 1 FROM [dbo].[dp_Page_Section_Pages] WHERE [Page_ID] = 968 AND [Page_Section_ID] = @PageSectionID)
BEGIN
    INSERT INTO [dbo].[dp_Page_Section_Pages] ([Page_ID], [Page_Section_ID])
    VALUES (968, @PageSectionID);
    PRINT 'Added Project Confirmation Cards (968) to Page Section ' + CAST(@PageSectionID AS NVARCHAR);
END

-- Event RSVPs (Page ID: 969)
IF NOT EXISTS (SELECT 1 FROM [dbo].[dp_Page_Section_Pages] WHERE [Page_ID] = 969 AND [Page_Section_ID] = @PageSectionID)
BEGIN
    INSERT INTO [dbo].[dp_Page_Section_Pages] ([Page_ID], [Page_Section_ID])
    VALUES (969, @PageSectionID);
    PRINT 'Added Event RSVPs (969) to Page Section ' + CAST(@PageSectionID AS NVARCHAR);
END

-- Event RSVP Answers (Page ID: 970)
IF NOT EXISTS (SELECT 1 FROM [dbo].[dp_Page_Section_Pages] WHERE [Page_ID] = 970 AND [Page_Section_ID] = @PageSectionID)
BEGIN
    INSERT INTO [dbo].[dp_Page_Section_Pages] ([Page_ID], [Page_Section_ID])
    VALUES (970, @PageSectionID);
    PRINT 'Added Event RSVP Answers (970) to Page Section ' + CAST(@PageSectionID AS NVARCHAR);
END

-- ===================================================================
-- Summary
-- ===================================================================
PRINT '';
PRINT '===================================================================';
PRINT 'Pages added to Page Section ' + CAST(@PageSectionID AS NVARCHAR);
PRINT '';
PRINT 'Added 8 pages:';
PRINT '  963 - Question Types';
PRINT '  964 - Card Types';
PRINT '  965 - Project RSVPs';
PRINT '  966 - Project RSVP Questions';
PRINT '  967 - Question Options';
PRINT '  968 - Project Confirmation Cards';
PRINT '  969 - Event RSVPs';
PRINT '  970 - Event RSVP Answers';
PRINT '';
PRINT 'Next steps:';
PRINT '  1. Grant API security permissions for these pages';
PRINT '  2. Test API access';
PRINT '===================================================================';
GO
